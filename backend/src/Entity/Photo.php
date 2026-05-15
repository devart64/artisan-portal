<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\PhotoRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: PhotoRepository::class)]
#[ORM\Table(name: 'photos')]
#[ORM\HasLifecycleCallbacks]
class Photo
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    private Uuid $id;

    #[ORM\ManyToOne(targetEntity: Chantier::class, inversedBy: 'photos')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Chantier $chantier;

    #[ORM\Column(type: 'string', length: 1024)]
    private string $filePath;

    #[ORM\Column(type: 'string', length: 512, nullable: true)]
    private ?string $caption = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $uploadedAt;

    public function __construct()
    {
        $this->uploadedAt = new \DateTimeImmutable();
    }

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        if (!isset($this->uploadedAt)) {
            $this->uploadedAt = new \DateTimeImmutable();
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

    public function getFilePath(): string
    {
        return $this->filePath;
    }

    public function setFilePath(string $filePath): static
    {
        $this->filePath = $filePath;
        return $this;
    }

    public function getCaption(): ?string
    {
        return $this->caption;
    }

    public function setCaption(?string $caption): static
    {
        $this->caption = $caption;
        return $this;
    }

    public function getUploadedAt(): \DateTimeImmutable
    {
        return $this->uploadedAt;
    }
}
