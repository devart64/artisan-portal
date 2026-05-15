<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Client;
use App\Entity\Tenant;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Client>
 */
class ClientRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Client::class);
    }

    /** @return Client[] */
    public function findByTenant(Tenant $tenant): array
    {
        return $this->findBy(['tenant' => $tenant], ['createdAt' => 'DESC']);
    }

    public function save(Client $client, bool $flush = false): void
    {
        $this->getEntityManager()->persist($client);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}
