<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\ClientTokenRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ClientTokenRepository::class)]
#[ORM\Table(name: 'client_tokens')]
#[ORM\HasLifecycleCallbacks]
class ClientToken
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    private Uuid $id;

    #[ORM\ManyToOne(targetEntity: Client::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Client $client;

    #[ORM\ManyToOne(targetEntity: Chantier::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Chantier $chantier;

    #[ORM\Column(type: 'string', length: 128, unique: true)]
    private string $token;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $expiresAt;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->token = bin2hex(random_bytes(32));
        $this->expiresAt = new \DateTimeImmutable('+30 days');
        $this->createdAt = new \DateTimeImmutable();
    }

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        if (!isset($this->createdAt)) {
            $this->createdAt = new \DateTimeImmutable();
        }
        if (!isset($this->expiresAt)) {
            $this->expiresAt = new \DateTimeImmutable('+30 days');
        }
        if (!isset($this->token)) {
            $this->token = bin2hex(random_bytes(32));
        }
    }

    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getClient(): Client
    {
        return $this->client;
    }

    public function setClient(Client $client): static
    {
        $this->client = $client;
        return $this;
    }

    public function getChantier(): Chantier
    {
        return $this->chantier;
    }

    public function setChantier(Chantier $chantier): static
    {
        $this->chantier = $chantier;
        return $this;
    }

    public function getToken(): string
    {
        return $this->token;
    }

    public function setToken(string $token): static
    {
        $this->token = $token;
        return $this;
    }

    public function getExpiresAt(): \DateTimeImmutable
    {
        return $this->expiresAt;
    }

    public function setExpiresAt(\DateTimeImmutable $expiresAt): static
    {
        $this->expiresAt = $expiresAt;
        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function isValid(): bool
    {
        return $this->expiresAt > new \DateTimeImmutable();
    }
}
