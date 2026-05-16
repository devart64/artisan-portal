<?php
declare(strict_types=1);
namespace App\Entity;

use App\Entity\Tenant;
use App\Enum\LeadStatusEnum;
use App\Repository\LeadRepository;
use Doctrine\ORM\Mapping as ORM;
use Ramsey\Uuid\Doctrine\UuidGenerator;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: LeadRepository::class)]
#[ORM\Table(name: 'leads')]
#[ORM\HasLifecycleCallbacks]
class Lead
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    #[Groups(['lead:read'])]
    private ?string $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['lead:read', 'lead:write'])]
    private string $name;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $email = null;

    #[ORM\Column(length: 30, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $phone = null;

    #[ORM\Column(length: 100)]
    #[Groups(['lead:read', 'lead:write'])]
    private string $trade = '';

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $city = null;

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $source = null;

    #[ORM\Column(type: 'smallint', options: ['default' => 0])]
    #[Groups(['lead:read', 'lead:write'])]
    private int $score = 0;

    #[ORM\Column(enumType: LeadStatusEnum::class, options: ['default' => 'new'])]
    #[Groups(['lead:read', 'lead:write'])]
    private LeadStatusEnum $status = LeadStatusEnum::New;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $notes = null;

    #[ORM\ManyToOne(targetEntity: Tenant::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Tenant $tenant;

    #[ORM\Column(nullable: true)]
    #[Groups(['lead:read'])]
    private ?\DateTimeImmutable $lastContactedAt = null;

    #[ORM\Column]
    #[Groups(['lead:read'])]
    private \DateTimeImmutable $createdAt;

    #[ORM\PrePersist]
    public function initCreatedAt(): void
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getTenant(): Tenant { return $this->tenant; }
    public function setTenant(Tenant $tenant): static { $this->tenant = $tenant; return $this; }

    public function getId(): ?string { return $this->id; }
    public function getName(): string { return $this->name; }
    public function setName(string $name): static { $this->name = $name; return $this; }
    public function getEmail(): ?string { return $this->email; }
    public function setEmail(?string $email): static { $this->email = $email; return $this; }
    public function getPhone(): ?string { return $this->phone; }
    public function setPhone(?string $phone): static { $this->phone = $phone; return $this; }
    public function getTrade(): string { return $this->trade; }
    public function setTrade(string $trade): static { $this->trade = $trade; return $this; }
    public function getCity(): ?string { return $this->city; }
    public function setCity(?string $city): static { $this->city = $city; return $this; }
    public function getSource(): ?string { return $this->source; }
    public function setSource(?string $source): static { $this->source = $source; return $this; }
    public function getScore(): int { return $this->score; }
    public function setScore(int $score): static { $this->score = $score; return $this; }
    public function getStatus(): LeadStatusEnum { return $this->status; }
    public function setStatus(LeadStatusEnum $status): static { $this->status = $status; return $this; }
    public function getNotes(): ?string { return $this->notes; }
    public function setNotes(?string $notes): static { $this->notes = $notes; return $this; }
    public function getLastContactedAt(): ?\DateTimeImmutable { return $this->lastContactedAt; }
    public function setLastContactedAt(?\DateTimeImmutable $dt): static { $this->lastContactedAt = $dt; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
}
