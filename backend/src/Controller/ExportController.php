<?php
declare(strict_types=1);
namespace App\Controller;

use App\Repository\ChantierRepository;
use App\Repository\DocumentRepository;
use App\Service\TenantContext;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/export')]
#[IsGranted('ROLE_USER')]
class ExportController extends AbstractController
{
    public function __construct(
        private readonly TenantContext $tenantContext,
        private readonly ChantierRepository $chantierRepository,
        private readonly DocumentRepository $documentRepository,
    ) {}

    #[Route('/chantiers.csv', name: 'export_chantiers_csv', methods: ['GET'])]
    public function chantiersCsv(): StreamedResponse
    {
        $tenant    = $this->tenantContext->getTenant();
        $chantiers = $this->chantierRepository->findBy(['tenant' => $tenant]);

        $response = new StreamedResponse(function () use ($chantiers) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['ID', 'Titre', 'Statut', 'Client', 'Adresse', 'Date création', 'Date début', 'Date fin'], ';');

            foreach ($chantiers as $c) {
                fputcsv($handle, [
                    $c->getId()->toString(),
                    $c->getTitle(),
                    $c->getStatus()->value,
                    $c->getClient()?->getName() ?? '',
                    $c->getAddress() ?? '',
                    $c->getCreatedAt()->format('d/m/Y'),
                    $c->getStartDate()?->format('d/m/Y') ?? '',
                    $c->getEndDate()?->format('d/m/Y') ?? '',
                ], ';');
            }
            fclose($handle);
        });

        $response->headers->set('Content-Type', 'text/csv; charset=utf-8');
        $response->headers->set('Content-Disposition', 'attachment; filename="chantiers-' . date('Y-m-d') . '.csv"');

        return $response;
    }

    #[Route('/documents.csv', name: 'export_documents_csv', methods: ['GET'])]
    public function documentsCsv(): StreamedResponse
    {
        $tenant    = $this->tenantContext->getTenant();

        // Document has no direct tenant field; it belongs to Chantier which belongs to Tenant
        $documents = $this->documentRepository->createQueryBuilder('d')
            ->join('d.chantier', 'c')
            ->where('c.tenant = :tenant')
            ->setParameter('tenant', $tenant)
            ->getQuery()->getResult();

        $response = new StreamedResponse(function () use ($documents) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['ID', 'Label', 'Type', 'Statut', 'Chantier', 'Signé le', 'Signataire', 'Date création'], ';');

            foreach ($documents as $d) {
                fputcsv($handle, [
                    $d->getId()->toString(),
                    $d->getLabel(),
                    $d->getType()->value,
                    $d->getStatus()?->value ?? '',
                    $d->getChantier()->getTitle(),
                    $d->getSignedAt()?->format('d/m/Y') ?? '',
                    $d->getSignerName() ?? '',
                    $d->getCreatedAt()->format('d/m/Y'),
                ], ';');
            }
            fclose($handle);
        });

        $response->headers->set('Content-Type', 'text/csv; charset=utf-8');
        $response->headers->set('Content-Disposition', 'attachment; filename="documents-' . date('Y-m-d') . '.csv"');

        return $response;
    }
}
