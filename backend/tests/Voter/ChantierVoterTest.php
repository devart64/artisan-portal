<?php

declare(strict_types=1);

namespace App\Tests\Voter;

use App\Entity\Chantier;
use App\Entity\Tenant;
use App\Entity\User;
use App\Enum\UserRoleEnum;
use App\Voter\ChantierVoter;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Security\Core\Authentication\Token\UsernamePasswordToken;
use Symfony\Component\Uid\Uuid;

class ChantierVoterTest extends TestCase
{
    private ChantierVoter $voter;

    protected function setUp(): void
    {
        $this->voter = new ChantierVoter();
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

    private function makeChantier(Tenant $tenant): Chantier
    {
        $chantier = new Chantier();
        $chantier->setTenant($tenant);
        $chantier->setTitle('Test chantier');
        return $chantier;
    }

    private function makeToken(User $user): UsernamePasswordToken
    {
        return new UsernamePasswordToken($user, 'main', $user->getRoles());
    }

    public function testAdminCanViewOwnTenantChantier(): void
    {
        $tenant = $this->makeTenant();
        $user = $this->makeUser($tenant, UserRoleEnum::ADMIN);
        $chantier = $this->makeChantier($tenant);

        $result = $this->voter->vote($this->makeToken($user), $chantier, ['view']);
        $this->assertSame(1, $result); // ACCESS_GRANTED
    }

    public function testAdminCanEditOwnTenantChantier(): void
    {
        $tenant = $this->makeTenant();
        $user = $this->makeUser($tenant, UserRoleEnum::ADMIN);
        $chantier = $this->makeChantier($tenant);

        $result = $this->voter->vote($this->makeToken($user), $chantier, ['edit']);
        $this->assertSame(1, $result);
    }

    public function testCollaboratorCanViewButNotEdit(): void
    {
        $tenant = $this->makeTenant();
        $user = $this->makeUser($tenant, UserRoleEnum::COLLABORATOR);
        $chantier = $this->makeChantier($tenant);

        $viewResult = $this->voter->vote($this->makeToken($user), $chantier, ['view']);
        $this->assertSame(1, $viewResult);

        $editResult = $this->voter->vote($this->makeToken($user), $chantier, ['edit']);
        $this->assertSame(-1, $editResult); // ACCESS_DENIED
    }

    public function testUserCannotAccessDifferentTenantChantier(): void
    {
        $tenantA = $this->makeTenant();
        $tenantB = $this->makeTenant();

        $reflection = new \ReflectionProperty(Tenant::class, 'id');
        $reflection->setValue($tenantB, Uuid::v4());

        $user = $this->makeUser($tenantA, UserRoleEnum::ADMIN);
        $chantier = $this->makeChantier($tenantB);

        $result = $this->voter->vote($this->makeToken($user), $chantier, ['view']);
        $this->assertSame(-1, $result);
    }

    public function testAdminCanDeleteOwnTenantChantier(): void
    {
        $tenant = $this->makeTenant();
        $user = $this->makeUser($tenant, UserRoleEnum::ADMIN);
        $chantier = $this->makeChantier($tenant);

        $result = $this->voter->vote($this->makeToken($user), $chantier, ['delete']);
        $this->assertSame(1, $result);
    }

    public function testCollaboratorCannotDeleteChantier(): void
    {
        $tenant = $this->makeTenant();
        $user = $this->makeUser($tenant, UserRoleEnum::COLLABORATOR);
        $chantier = $this->makeChantier($tenant);

        $result = $this->voter->vote($this->makeToken($user), $chantier, ['delete']);
        $this->assertSame(-1, $result);
    }
}
