<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\NotificationRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: NotificationRepository::class)]
#[ORM\Table(name: 'notifications')]
class Notification
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    private Uuid $id;

    #[ORM\ManyToOne(targetEntity: Tenant::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Tenant $tenant;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?User $user = null;

    #[ORM\Column(type: 'string', length: 64)]
    private string $type;

    #[ORM\Column(type: 'string', length: 255)]
    private string $title;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $body = null;

    #[ORM\Column(type: 'string', length: 512, nullable: true)]
    private ?string $url = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $readAt = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): Uuid { return $this->id; }

    public function getTenant(): Tenant { return $this->tenant; }
    public function setTenant(Tenant $t): static { $this->tenant = $t; return $this; }

    public function getUser(): ?User { return $this->user; }
    public function setUser(?User $u): static { $this->user = $u; return $this; }

    public function getType(): string { return $this->type; }
    public function setType(string $t): static { $this->type = $t; return $this; }

    public function getTitle(): string { return $this->title; }
    public function setTitle(string $t): static { $this->title = $t; return $this; }

    public function getBody(): ?string { return $this->body; }
    public function setBody(?string $b): static { $this->body = $b; return $this; }

    public function getUrl(): ?string { return $this->url; }
    public function setUrl(?string $u): static { $this->url = $u; return $this; }

    public function getReadAt(): ?\DateTimeImmutable { return $this->readAt; }
    public function markRead(): static { $this->readAt = new \DateTimeImmutable(); return $this; }

    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }

    public function isRead(): bool { return $this->readAt !== null; }
}
