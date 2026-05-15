<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Chantier;
use App\Entity\Jalon;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Jalon>
 */
class JalonRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Jalon::class);
    }

    /** @return Jalon[] */
    public function findByChantier(Chantier $chantier): array
    {
        return $this->findBy(['chantier' => $chantier], ['date' => 'ASC']);
    }

    /** @return Jalon[] */
    public function findPendingByChantier(Chantier $chantier): array
    {
        return $this->createQueryBuilder('j')
            ->where('j.chantier = :chantier')
            ->andWhere('j.done = false')
            ->setParameter('chantier', $chantier)
            ->orderBy('j.date', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function save(Jalon $jalon, bool $flush = false): void
    {
        $this->getEntityManager()->persist($jalon);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}
