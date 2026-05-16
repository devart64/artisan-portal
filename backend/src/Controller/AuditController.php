<?php
declare(strict_types=1);
namespace App\Controller;

use App\Entity\AuditLog;
use App\Repository\AuditLogRepository;
use App\Service\TenantContext;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/audit')]
#[IsGranted('ROLE_ADMIN')]
class AuditController extends AbstractController
{
    public function __construct(
        private readonly AuditLogRepository $auditLogRepository,
        private readonly TenantContext $tenantContext,
    ) {}

    #[Route('', name: 'audit_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $tenant = $this->tenantContext->getTenant();
        $logs   = $this->auditLogRepository->findForTenant($tenant);

        return $this->json(array_map(fn(AuditLog $l) => [
            'id'         => $l->getId()->toString(),
            'action'     => $l->getAction(),
            'resource'   => $l->getResource(),
            'resourceId' => $l->getResourceId(),
            'meta'       => $l->getMeta(),
            'user'       => $l->getUser() ? [
                'id'    => $l->getUser()->getId()->toString(),
                'name'  => $l->getUser()->getName(),
                'email' => $l->getUser()->getEmail(),
            ] : null,
            'createdAt' => $l->getCreatedAt()->format('c'),
        ], $logs));
    }
}
