<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\ApiKey;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class ApiKeyRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ApiKey::class);
    }

    public function findByHash(string $hash): ?ApiKey
    {
        return $this->findOneBy(['keyHash' => $hash]);
    }
}
