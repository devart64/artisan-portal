<?php

declare(strict_types=1);

namespace App\Tests\Service;

use App\Entity\Tenant;
use App\Entity\User;
use App\Service\TenantContext;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;

class TenantContextTest extends TestCase
{
    public function testGetTenantReturnsUserTenant(): void
    {
        $tenant = new Tenant();
        $user = new User();
        $user->setTenant($tenant);
        $user->setEmail('test@example.com');

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($user);

        $context = new TenantContext($security);

        $this->assertSame($tenant, $context->getTenant());
    }

    public function testGetTenantThrowsWhenNotAuthenticated(): void
    {
        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn(null);

        $context = new TenantContext($security);

        $this->expectException(\RuntimeException::class);
        $context->getTenant();
    }

    public function testGetCurrentUserReturnsUser(): void
    {
        $tenant = new Tenant();
        $user = new User();
        $user->setTenant($tenant);
        $user->setEmail('test@example.com');

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($user);

        $context = new TenantContext($security);

        $this->assertSame($user, $context->getCurrentUser());
    }

    public function testHasTenantReturnsTrueWhenAuthenticated(): void
    {
        $tenant = new Tenant();
        $user = new User();
        $user->setTenant($tenant);
        $user->setEmail('test@example.com');

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($user);

        $context = new TenantContext($security);

        $this->assertTrue($context->hasTenant());
    }

    public function testHasTenantReturnsFalseWhenNotAuthenticated(): void
    {
        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn(null);

        $context = new TenantContext($security);

        $this->assertFalse($context->hasTenant());
    }
}
