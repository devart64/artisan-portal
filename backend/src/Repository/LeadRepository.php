<?php
declare(strict_types=1);
namespace App\Repository;

use App\Entity\Lead;
use App\Entity\Tenant;
use App\Enum\LeadStatusEnum;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class LeadRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Lead::class);
    }

    /** @return Lead[] */
    public function findByStatus(LeadStatusEnum $status): array
    {
        return $this->findBy(['status' => $status], ['createdAt' => 'DESC']);
    }

    /** @return Lead[] */
    public function findPending(Tenant $tenant): array
    {
        return $this->createQueryBuilder('l')
            ->where('l.status IN (:statuses)')
            ->andWhere('l.tenant = :tenant')
            ->setParameter('statuses', [LeadStatusEnum::New, LeadStatusEnum::Qualified])
            ->setParameter('tenant', $tenant)
            ->orderBy('l.score', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
