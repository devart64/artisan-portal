<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\MessageRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: MessageRepository::class)]
#[ORM\Table(name: 'messages')]
#[ORM\HasLifecycleCallbacks]
class Message
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    private Uuid $id;

    #[ORM\ManyToOne(targetEntity: Chantier::class, inversedBy: 'messages')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Chantier $chantier;

    #[ORM\Column(type: 'string', length: 20)]
    private string $senderType;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $senderName = null;

    #[ORM\Column(type: 'text')]
    private string $content;

    #[ORM\Column(type: 'boolean')]
    private bool $read = false;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        if (!isset($this->createdAt)) {
            $this->createdAt = new \DateTimeImmutable();
        }
    }

    public function getId(): Uuid
    {
        return $this->id;
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

    public function getSenderType(): string
    {
        return $this->senderType;
    }

    public function setSenderType(string $senderType): static
    {
        if (!in_array($senderType, ['artisan', 'client'], true)) {
            throw new \InvalidArgumentException('senderType must be "artisan" or "client"');
        }
        $this->senderType = $senderType;
        return $this;
    }

    public function getSenderName(): ?string
    {
        return $this->senderName;
    }

    public function setSenderName(?string $senderName): static
    {
        $this->senderName = $senderName;
        return $this;
    }

    public function getContent(): string
    {
        return $this->content;
    }

    public function setContent(string $content): static
    {
        $this->content = $content;
        return $this;
    }

    public function isRead(): bool
    {
        return $this->read;
    }

    public function setRead(bool $read): static
    {
        $this->read = $read;
        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }
}
