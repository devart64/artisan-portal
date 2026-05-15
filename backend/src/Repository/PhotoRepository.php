<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Chantier;
use App\Entity\Photo;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Photo>
 */
class PhotoRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Photo::class);
    }

    /** @return Photo[] */
    public function findByChantier(Chantier $chantier): array
    {
        return $this->findBy(['chantier' => $chantier], ['uploadedAt' => 'DESC']);
    }

    public function save(Photo $photo, bool $flush = false): void
    {
        $this->getEntityManager()->persist($photo);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}
