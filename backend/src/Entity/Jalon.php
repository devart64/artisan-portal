<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\JalonRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: JalonRepository::class)]
#[ORM\Table(name: 'jalons')]
#[ORM\HasLifecycleCallbacks]
class Jalon
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: \Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator::class)]
    private Uuid $id;

    #[ORM\ManyToOne(targetEntity: Chantier::class, inversedBy: 'jalons')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Chantier $chantier;

    #[ORM\Column(type: 'string', length: 255)]
    private string $title;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $date = null;

    #[ORM\Column(type: 'boolean')]
    private bool $done = false;

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

    #[Groups(['jalon:read'])]
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

    #[Groups(['jalon:read'])]
    public function getTitle(): string
    {
        return $this->title;
    }

    public function setTitle(string $title): static
    {
        $this->title = $title;
        return $this;
    }

    #[Groups(['jalon:read'])]
    public function getDate(): ?\DateTimeImmutable
    {
        return $this->date;
    }

    public function setDate(?\DateTimeImmutable $date): static
    {
        $this->date = $date;
        return $this;
    }

    #[Groups(['jalon:read'])]
    public function isDone(): bool
    {
        return $this->done;
    }

    public function setDone(bool $done): static
    {
        $this->done = $done;
        return $this;
    }

    #[Groups(['jalon:read'])]
    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }
}
