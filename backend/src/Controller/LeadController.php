<?php
declare(strict_types=1);
namespace App\Controller;

use App\Entity\Lead;
use App\Enum\LeadStatusEnum;
use App\Repository\LeadRepository;
use App\Service\TenantContext;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/leads')]
#[IsGranted('ROLE_USER')]
class LeadController extends AbstractController
{
    public function __construct(
        private LeadRepository $leads,
        private EntityManagerInterface $em,
        private SerializerInterface $serializer,
        private TenantContext $tenantContext,
    ) {}

    #[Route('', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        $tenant = $this->tenantContext->getTenant();
        $status = $request->query->get('status');
        if ($status && $statusEnum = LeadStatusEnum::tryFrom($status)) {
            $leads = $this->leads->findBy(['tenant' => $tenant, 'status' => $statusEnum], ['createdAt' => 'DESC']);
        } else {
            $leads = $this->leads->findBy(['tenant' => $tenant], ['createdAt' => 'DESC'], 100);
        }

        return $this->json($leads, context: ['groups' => ['lead:read']]);
    }

    #[Route('', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $tenant = $this->tenantContext->getTenant();
        $data = json_decode($request->getContent(), true);

        $lead = new Lead();
        $lead->setTenant($tenant);
        $lead->setName($data['name'] ?? '');
        $lead->setEmail($data['email'] ?? null);
        $lead->setPhone($data['phone'] ?? null);
        $lead->setTrade($data['trade'] ?? '');
        $lead->setCity($data['city'] ?? null);
        $lead->setSource($data['source'] ?? 'agent');
        $lead->setScore($data['score'] ?? 0);
        if (isset($data['notes'])) $lead->setNotes($data['notes']);

        $this->em->persist($lead);
        $this->em->flush();

        return $this->json($lead, Response::HTTP_CREATED, context: ['groups' => ['lead:read']]);
    }

    #[Route('/{id}', methods: ['PATCH'])]
    public function update(string $id, Request $request): JsonResponse
    {
        $tenant = $this->tenantContext->getTenant();
        $lead = $this->leads->find($id);
        if (!$lead) return $this->json(['error' => 'Not found'], 404);
        if (!$lead->getTenant()->getId()->equals($tenant->getId())) {
            return $this->json(['error' => 'Not found'], 404);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['status']) && $s = LeadStatusEnum::tryFrom($data['status'])) {
            $lead->setStatus($s);
        }
        if (array_key_exists('score', $data)) $lead->setScore((int)$data['score']);
        if (array_key_exists('notes', $data)) $lead->setNotes($data['notes']);
        if (array_key_exists('email', $data)) $lead->setEmail($data['email']);
        if (array_key_exists('phone', $data)) $lead->setPhone($data['phone']);
        if (isset($data['lastContactedAt'])) {
            $lead->setLastContactedAt(new \DateTimeImmutable($data['lastContactedAt']));
        }

        $this->em->flush();

        return $this->json($lead, context: ['groups' => ['lead:read']]);
    }

    #[Route('/pending', methods: ['GET'])]
    public function pending(): JsonResponse
    {
        $tenant = $this->tenantContext->getTenant();
        return $this->json($this->leads->findPending($tenant), context: ['groups' => ['lead:read']]);
    }
}
