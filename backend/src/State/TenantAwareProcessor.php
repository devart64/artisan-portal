<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Chantier;
use App\Entity\Client;
use App\Service\TenantContext;

/**
 * Injects the current tenant on POST operations for tenant-owned resources.
 */
final class TenantAwareProcessor implements ProcessorInterface
{
    public function __construct(
        /** @var ProcessorInterface<mixed, mixed> */
        private readonly ProcessorInterface $inner,
        private readonly TenantContext $tenantContext,
    ) {}

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        if ($data instanceof Chantier || $data instanceof Client) {
            $tenant = $this->tenantContext->getTenant();
            if ($tenant !== null) {
                $data->setTenant($tenant);
            }
        }

        return $this->inner->process($data, $operation, $uriVariables, $context);
    }
}
