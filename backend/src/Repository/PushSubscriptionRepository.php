<?php
declare(strict_types=1);
namespace App\Repository;

use App\Entity\PushSubscription;
use App\Entity\Tenant;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class PushSubscriptionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PushSubscription::class);
    }

    public function findForTenant(Tenant $tenant): array
    {
        return $this->findBy(['tenant' => $tenant]);
    }
}
