<?php

declare(strict_types=1);

namespace App\Security;

use App\Entity\Chantier;
use App\Entity\Client;
use App\Entity\Tenant;
use Symfony\Component\Security\Core\User\UserInterface;

class ClientUser implements UserInterface
{
    public function __construct(
        private readonly Client $client,
        private readonly Chantier $chantier,
        private readonly Tenant $tenant,
    ) {}

    public function getRoles(): array
    {
        return ['ROLE_CLIENT'];
    }

    public function getClient(): Client
    {
        return $this->client;
    }

    public function getChantier(): Chantier
    {
        return $this->chantier;
    }

    public function getTenant(): Tenant
    {
        return $this->tenant;
    }

    public function getUserIdentifier(): string
    {
        return $this->client->getId()->toString();
    }

    public function eraseCredentials(): void
    {
        // No credentials to erase
    }
}
