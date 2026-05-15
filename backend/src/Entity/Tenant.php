<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\PlanEnum;
use App\Enum\PlanStatusEnum;
use App\Repository\TenantRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: TenantRepository::class)]
#[ORM\Table(name: 'tenants')]
#[ORM\HasLifecycleCallbacks]
class Tenant
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    private Uuid $id;

    #[ORM\Column(type: 'string', length: 255)]
    private string $name;

    #[ORM\Column(type: 'string', length: 255, unique: true)]
    private string $slug;

    #[ORM\Column(type: 'string', length: 512, nullable: true)]
    private ?string $logoUrl = null;

    #[ORM\Column(type: 'string', length: 7)]
    private string $brandColor = '#1A56A0';

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $stripeCustomerId = null;

    #[ORM\Column(type: 'string', enumType: PlanEnum::class)]
    private PlanEnum $plan = PlanEnum::STARTER;

    #[ORM\Column(type: 'string', enumType: PlanStatusEnum::class)]
    private PlanStatusEnum $planStatus = PlanStatusEnum::TRIALING;

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

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;
        return $this;
    }

    public function getSlug(): string
    {
        return $this->slug;
    }

    public function setSlug(string $slug): static
    {
        $this->slug = $slug;
        return $this;
    }

    public function getLogoUrl(): ?string
    {
        return $this->logoUrl;
    }

    public function setLogoUrl(?string $logoUrl): static
    {
        $this->logoUrl = $logoUrl;
        return $this;
    }

    public function getBrandColor(): string
    {
        return $this->brandColor;
    }

    public function setBrandColor(string $brandColor): static
    {
        $this->brandColor = $brandColor;
        return $this;
    }

    public function getStripeCustomerId(): ?string
    {
        return $this->stripeCustomerId;
    }

    public function setStripeCustomerId(?string $stripeCustomerId): static
    {
        $this->stripeCustomerId = $stripeCustomerId;
        return $this;
    }

    public function getPlan(): PlanEnum
    {
        return $this->plan;
    }

    public function setPlan(PlanEnum $plan): static
    {
        $this->plan = $plan;
        return $this;
    }

    public function getPlanStatus(): PlanStatusEnum
    {
        return $this->planStatus;
    }

    public function setPlanStatus(PlanStatusEnum $planStatus): static
    {
        $this->planStatus = $planStatus;
        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }
}
