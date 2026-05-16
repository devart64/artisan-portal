<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Tenant;
use App\Enum\ChantierStatusEnum;
use App\Enum\PlanEnum;
use App\Repository\ChantierRepository;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class PlanLimitChecker
{
    public function __construct(
        private ChantierRepository $chantierRepository,
    ) {}

    public function assertCanCreateChantier(Tenant $tenant): void
    {
        if ($tenant->getPlan() !== PlanEnum::STARTER) {
            return; // Pro et Business = illimité
        }

        $count = $this->chantierRepository->countActivByTenant($tenant);
        if ($count >= 5) {
            throw new HttpException(
                402,
                'Limite atteinte : le plan Débutant est limité à 5 chantiers actifs. Passez au plan Professionnel pour continuer.',
            );
        }
    }

    public function getRemainingChantiers(Tenant $tenant): ?int
    {
        if ($tenant->getPlan() !== PlanEnum::STARTER) {
            return null; // null = illimité
        }
        $count = $this->chantierRepository->countActivByTenant($tenant);
        return max(0, 5 - $count);
    }
}
