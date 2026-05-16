<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Notification;
use App\Entity\Tenant;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class NotificationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Notification::class);
    }

    /** @return Notification[] */
    public function findForTenant(Tenant $tenant, int $limit = 20): array
    {
        return $this->createQueryBuilder('n')
            ->where('n.tenant = :tenant')
            ->setParameter('tenant', $tenant)
            ->orderBy('n.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    public function countUnread(Tenant $tenant): int
    {
        return (int) $this->createQueryBuilder('n')
            ->select('COUNT(n.id)')
            ->where('n.tenant = :tenant')
            ->andWhere('n.readAt IS NULL')
            ->setParameter('tenant', $tenant)
            ->getQuery()
            ->getSingleScalarResult();
    }
}
