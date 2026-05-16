<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Chantier;
use App\Entity\Message;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Message>
 */
class MessageRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Message::class);
    }

    /** @return Message[] */
    public function findByChantier(Chantier $chantier): array
    {
        return $this->findBy(['chantier' => $chantier], ['createdAt' => 'ASC']);
    }

    /** @return Message[] */
    public function findUnreadByChantier(Chantier $chantier): array
    {
        return $this->findBy(['chantier' => $chantier, 'read' => false], ['createdAt' => 'ASC']);
    }

    public function countUnreadClientMessages(Chantier $chantier): int
    {
        return (int) $this->createQueryBuilder('m')
            ->select('COUNT(m.id)')
            ->where('m.chantier = :chantier')
            ->andWhere('m.senderType = :type')
            ->andWhere('m.read = false')
            ->setParameter('chantier', $chantier)
            ->setParameter('type', 'client')
            ->getQuery()
            ->getSingleScalarResult();
    }

    /** @return Message[] Messages non lus envoyés par le client (senderType = 'client') */
    public function findUnreadClientMessages(Chantier $chantier): array
    {
        return $this->createQueryBuilder('m')
            ->where('m.chantier = :chantier')
            ->andWhere('m.senderType = :type')
            ->andWhere('m.read = false')
            ->setParameter('chantier', $chantier)
            ->setParameter('type', 'client')
            ->orderBy('m.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function save(Message $message, bool $flush = false): void
    {
        $this->getEntityManager()->persist($message);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}
