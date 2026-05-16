<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Chantier;
use App\Entity\Client;
use App\Service\PlanLimitChecker;
use App\Service\TenantContext;

/**
 * Injects the current tenant on POST operations for tenant-owned resources.
 * Also enforces plan limits before persisting new Chantiers.
 */
final class TenantAwareProcessor implements ProcessorInterface
{
    public function __construct(
        /** @var ProcessorInterface<mixed, mixed> */
        private readonly ProcessorInterface $inner,
        private readonly TenantContext $tenantContext,
        private readonly PlanLimitChecker $planLimitChecker,
    ) {}

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        if ($data instanceof Chantier || $data instanceof Client) {
            $tenant = $this->tenantContext->getTenant();
            if ($tenant !== null) {
                if ($data instanceof Chantier) {
                    $this->planLimitChecker->assertCanCreateChantier($tenant);
                }
                $data->setTenant($tenant);
            }
        }

        return $this->inner->process($data, $operation, $uriVariables, $context);
    }
}
