<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Client;
use App\Entity\Chantier;
use App\Entity\ClientToken;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ClientToken>
 */
class ClientTokenRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ClientToken::class);
    }

    public function findValidByToken(string $token): ?ClientToken
    {
        $clientToken = $this->findOneBy(['token' => $token]);

        if ($clientToken === null || !$clientToken->isValid()) {
            return null;
        }

        return $clientToken;
    }

    public function findByClientAndChantier(Client $client, Chantier $chantier): ?ClientToken
    {
        return $this->findOneBy(['client' => $client, 'chantier' => $chantier]);
    }

    /** @return ClientToken[] */
    public function findExpiredTokens(): array
    {
        return $this->createQueryBuilder('ct')
            ->where('ct.expiresAt < :now')
            ->setParameter('now', new \DateTimeImmutable())
            ->getQuery()
            ->getResult();
    }

    public function save(ClientToken $clientToken, bool $flush = false): void
    {
        $this->getEntityManager()->persist($clientToken);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(ClientToken $clientToken, bool $flush = false): void
    {
        $this->getEntityManager()->remove($clientToken);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}
