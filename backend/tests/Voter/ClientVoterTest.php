<?php

declare(strict_types=1);

namespace App\Tests\Voter;

use App\Entity\Client;
use App\Entity\Tenant;
use App\Entity\User;
use App\Enum\UserRoleEnum;
use App\Voter\ClientVoter;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Security\Core\Authentication\Token\UsernamePasswordToken;
use Symfony\Component\Uid\Uuid;

class ClientVoterTest extends TestCase
{
    private ClientVoter $voter;

    protected function setUp(): void
    {
        $this->voter = new ClientVoter();
    }

    private function makeTenant(): Tenant
    {
        $tenant = new Tenant();
        $reflection = new \ReflectionProperty(Tenant::class, 'id');
        $reflection->setValue($tenant, Uuid::v4());
        return $tenant;
    }

    private function makeUser(Tenant $tenant, UserRoleEnum $role = UserRoleEnum::ADMIN): User
    {
        $user = new User();
        $user->setTenant($tenant);
        $user->setRole($role);
        $user->setEmail('artisan@test.com');
        return $user;
    }

    private function makeClient(Tenant $tenant): Client
    {
        $client = new Client();
        $client->setTenant($tenant);
        $client->setName('Client Test');
        return $client;
    }

    private function makeToken(User $user): UsernamePasswordToken
    {
        return new UsernamePasswordToken($user, 'main', $user->getRoles());
    }

    public function testAdminCanViewOwnTenantClient(): void
    {
        $tenant = $this->makeTenant();
        $user = $this->makeUser($tenant);
        $client = $this->makeClient($tenant);

        $result = $this->voter->vote($this->makeToken($user), $client, ['view']);
        $this->assertSame(1, $result);
    }

    public function testAdminCanEditOwnTenantClient(): void
    {
        $tenant = $this->makeTenant();
        $user = $this->makeUser($tenant);
        $client = $this->makeClient($tenant);

        $result = $this->voter->vote($this->makeToken($user), $client, ['edit']);
        $this->assertSame(1, $result);
    }

    public function testCannotAccessClientFromDifferentTenant(): void
    {
        $tenantA = $this->makeTenant();
        $tenantB = $this->makeTenant();
        $reflection = new \ReflectionProperty(Tenant::class, 'id');
        $reflection->setValue($tenantB, Uuid::v4());

        $user = $this->makeUser($tenantA);
        $client = $this->makeClient($tenantB);

        foreach (['view', 'edit', 'delete'] as $attr) {
            $result = $this->voter->vote($this->makeToken($user), $client, [$attr]);
            $this->assertSame(-1, $result, "Expected DENY for attribute '$attr' on cross-tenant client");
        }
    }

    public function testCollaboratorCanViewButNotDelete(): void
    {
        $tenant = $this->makeTenant();
        $user = $this->makeUser($tenant, UserRoleEnum::COLLABORATOR);
        $client = $this->makeClient($tenant);

        $viewResult = $this->voter->vote($this->makeToken($user), $client, ['view']);
        $this->assertSame(1, $viewResult);

        $deleteResult = $this->voter->vote($this->makeToken($user), $client, ['delete']);
        $this->assertSame(-1, $deleteResult);
    }
}
