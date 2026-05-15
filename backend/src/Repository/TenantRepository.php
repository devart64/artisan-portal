<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Tenant;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Tenant>
 */
class TenantRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Tenant::class);
    }

    public function findBySlug(string $slug): ?Tenant
    {
        return $this->findOneBy(['slug' => $slug]);
    }

    public function findByStripeCustomerId(string $stripeCustomerId): ?Tenant
    {
        return $this->findOneBy(['stripeCustomerId' => $stripeCustomerId]);
    }

    public function save(Tenant $tenant, bool $flush = false): void
    {
        $this->getEntityManager()->persist($tenant);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}
