<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\DocumentStatusEnum;
use App\Enum\DocumentTypeEnum;
use App\Repository\DocumentRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: DocumentRepository::class)]
#[ORM\Table(name: 'documents')]
#[ORM\HasLifecycleCallbacks]
class Document
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    private Uuid $id;

    #[ORM\ManyToOne(targetEntity: Chantier::class, inversedBy: 'documents')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Chantier $chantier;

    #[ORM\Column(type: 'string', enumType: DocumentTypeEnum::class)]
    private DocumentTypeEnum $type;

    #[ORM\Column(type: 'string', length: 255)]
    private string $label;

    #[ORM\Column(type: 'string', length: 1024)]
    private string $filePath;

    #[ORM\Column(type: 'string', enumType: DocumentStatusEnum::class, nullable: true)]
    private ?DocumentStatusEnum $status = null;

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

    public function getType(): DocumentTypeEnum
    {
        return $this->type;
    }

    public function setType(DocumentTypeEnum $type): static
    {
        $this->type = $type;
        return $this;
    }

    public function getLabel(): string
    {
        return $this->label;
    }

    public function setLabel(string $label): static
    {
        $this->label = $label;
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

    public function getStatus(): ?DocumentStatusEnum
    {
        return $this->status;
    }

    public function setStatus(?DocumentStatusEnum $status): static
    {
        $this->status = $status;
        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }
}
