<?php
declare(strict_types=1);
namespace App\Controller;

use App\Repository\ChantierRepository;
use App\Repository\ClientRepository;
use App\Repository\UserRepository;
use App\Service\TenantContext;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/account')]
#[IsGranted('ROLE_ADMIN')]
class AccountController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly TenantContext $tenantContext,
        private readonly ChantierRepository $chantierRepository,
        private readonly ClientRepository $clientRepository,
        private readonly UserRepository $userRepository,
    ) {}

    #[Route('/export', name: 'account_export', methods: ['GET'])]
    public function export(): JsonResponse
    {
        $tenant    = $this->tenantContext->getTenant();
        $chantiers = $this->chantierRepository->findBy(['tenant' => $tenant]);
        $clients   = $this->clientRepository->findBy(['tenant' => $tenant]);
        $users     = $this->userRepository->findBy(['tenant' => $tenant]);

        $export = [
            'exportedAt' => (new \DateTimeImmutable())->format('c'),
            'tenant'     => [
                'id'        => $tenant->getId()->toString(),
                'name'      => $tenant->getName(),
                'slug'      => $tenant->getSlug(),
                'plan'      => $tenant->getPlan()->value,
                'createdAt' => $tenant->getCreatedAt()->format('c'),
            ],
            'users' => array_map(fn($u) => [
                'email'     => $u->getEmail(),
                'name'      => $u->getName(),
                'role'      => $u->getRole()->value,
                'createdAt' => $u->getCreatedAt()->format('c'),
            ], $users),
            'clients' => array_map(fn($c) => [
                'name'  => $c->getName(),
                'email' => $c->getEmail(),
                'phone' => $c->getPhone(),
            ], $clients),
            'chantiers' => array_map(fn($ch) => [
                'title'     => $ch->getTitle(),
                'status'    => $ch->getStatus()->value,
                'address'   => $ch->getAddress(),
                'createdAt' => $ch->getCreatedAt()->format('c'),
            ], $chantiers),
        ];

        return $this->json($export);
    }

    #[Route('', name: 'account_delete', methods: ['DELETE'])]
    public function delete(Request $request): JsonResponse
    {
        $data    = json_decode($request->getContent(), true);
        $confirm = $data['confirm'] ?? '';

        if ($confirm !== 'SUPPRIMER') {
            return $this->json(
                ['error' => 'Vous devez envoyer {"confirm":"SUPPRIMER"} pour confirmer la suppression.'],
                Response::HTTP_UNPROCESSABLE_ENTITY
            );
        }

        $tenant = $this->tenantContext->getTenant();
        $this->em->remove($tenant);
        $this->em->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }
}
