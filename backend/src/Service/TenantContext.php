<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Tenant;
use App\Entity\User;
use Symfony\Bundle\SecurityBundle\Security;

class TenantContext
{
    public function __construct(
        private readonly Security $security,
    ) {}

    public function getTenant(): Tenant
    {
        $user = $this->security->getUser();

        if (!$user instanceof User) {
            throw new \RuntimeException('No authenticated artisan user found. Cannot resolve tenant context.');
        }

        return $user->getTenant();
    }

    public function getCurrentUser(): User
    {
        $user = $this->security->getUser();

        if (!$user instanceof User) {
            throw new \RuntimeException('No authenticated artisan user found.');
        }

        return $user;
    }

    public function hasTenant(): bool
    {
        $user = $this->security->getUser();
        return $user instanceof User;
    }
}
