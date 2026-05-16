<?php
declare(strict_types=1);
namespace App\Entity;

use App\Repository\AuditLogRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: AuditLogRepository::class)]
#[ORM\Table(name: 'audit_logs')]
class AuditLog
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
    private string $action;

    #[ORM\Column(type: 'string', length: 64)]
    private string $resource;

    #[ORM\Column(type: 'string', length: 64, nullable: true)]
    private ?string $resourceId = null;

    #[ORM\Column(type: 'json', nullable: true)]
    private ?array $meta = null;

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
    public function getAction(): string { return $this->action; }
    public function setAction(string $a): static { $this->action = $a; return $this; }
    public function getResource(): string { return $this->resource; }
    public function setResource(string $r): static { $this->resource = $r; return $this; }
    public function getResourceId(): ?string { return $this->resourceId; }
    public function setResourceId(?string $id): static { $this->resourceId = $id; return $this; }
    public function getMeta(): ?array { return $this->meta; }
    public function setMeta(?array $m): static { $this->meta = $m; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
}
