<?php
declare(strict_types=1);
namespace App\Controller;

use App\Enum\ChantierStatusEnum;
use App\Repository\ChantierRepository;
use App\Repository\ClientRepository;
use App\Repository\DocumentRepository;
use App\Repository\LeadRepository;
use App\Service\TenantContext;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/stats')]
#[IsGranted('ROLE_USER')]
class StatsController extends AbstractController
{
    public function __construct(
        private readonly TenantContext $tenantContext,
        private readonly ChantierRepository $chantierRepository,
        private readonly ClientRepository $clientRepository,
        private readonly DocumentRepository $documentRepository,
        private readonly LeadRepository $leadRepository,
    ) {}

    #[Route('', name: 'stats_index', methods: ['GET'])]
    public function index(): JsonResponse
    {
        $tenant = $this->tenantContext->getTenant();

        $chantiers     = $this->chantierRepository->findBy(['tenant' => $tenant]);
        $clients       = $this->clientRepository->findBy(['tenant' => $tenant]);
        $documents     = $this->documentRepository->createQueryBuilder('d')
            ->join('d.chantier', 'c')
            ->where('c.tenant = :tenant')
            ->setParameter('tenant', $tenant)
            ->getQuery()->getResult();

        $byStatus = [];
        foreach (ChantierStatusEnum::cases() as $case) {
            $byStatus[$case->value] = 0;
        }
        foreach ($chantiers as $c) {
            $byStatus[$c->getStatus()->value]++;
        }

        $signed = array_filter($documents, fn($d) => $d->getSignedAt() !== null);

        return $this->json([
            'chantiers'         => count($chantiers),
            'chantiersByStatus' => $byStatus,
            'clients'           => count($clients),
            'documents'         => count($documents),
            'documentsSigned'   => count($signed),
            'leads'             => $this->leadRepository->count(['tenant' => $tenant]),
        ]);
    }
}
