<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Chantier;
use App\Entity\Client;
use App\Entity\Tenant;
use App\Enum\ChantierStatusEnum;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Chantier>
 */
class ChantierRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Chantier::class);
    }

    /** @return Chantier[] */
    public function findByTenant(Tenant $tenant): array
    {
        return $this->findBy(['tenant' => $tenant], ['createdAt' => 'DESC']);
    }

    /** @return Chantier[] */
    public function findByTenantAndStatus(Tenant $tenant, ChantierStatusEnum $status): array
    {
        return $this->findBy(['tenant' => $tenant, 'status' => $status], ['createdAt' => 'DESC']);
    }

    /** @return Chantier[] */
    public function findByClient(Client $client): array
    {
        return $this->findBy(['client' => $client], ['createdAt' => 'DESC']);
    }

    public function save(Chantier $chantier, bool $flush = false): void
    {
        $this->getEntityManager()->persist($chantier);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}
