<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Chantier;
use App\Entity\Document;
use App\Enum\DocumentTypeEnum;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Document>
 */
class DocumentRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Document::class);
    }

    /** @return Document[] */
    public function findByChantier(Chantier $chantier): array
    {
        return $this->findBy(['chantier' => $chantier], ['createdAt' => 'DESC']);
    }

    /** @return Document[] */
    public function findByChantierAndType(Chantier $chantier, DocumentTypeEnum $type): array
    {
        return $this->findBy(['chantier' => $chantier, 'type' => $type], ['createdAt' => 'DESC']);
    }

    public function save(Document $document, bool $flush = false): void
    {
        $this->getEntityManager()->persist($document);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /** @return Document[] */
    public function findUnsignedOlderThan(\DateTimeImmutable $threshold): array
    {
        return $this->createQueryBuilder('d')
            ->join('d.chantier', 'ch')
            ->join('ch.client', 'c')
            ->where('d.signedAt IS NULL')
            ->andWhere('d.createdAt < :threshold')
            ->andWhere('c.email IS NOT NULL')
            ->setParameter('threshold', $threshold)
            ->getQuery()
            ->getResult();
    }
}
