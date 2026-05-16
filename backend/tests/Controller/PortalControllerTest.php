<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use App\Entity\Chantier;
use App\Entity\Client;
use App\Entity\ClientToken;
use App\Entity\Tenant;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class PortalControllerTest extends WebTestCase
{
    // -------------------------------------------------------------------------
    // Fixtures helpers
    // -------------------------------------------------------------------------

    /**
     * Creates a minimal Tenant + User + Client + Chantier and persists them.
     * Returns an associative array with the created objects.
     *
     * @return array{tenant: Tenant, user: User, client: Client, chantier: Chantier, em: EntityManagerInterface}
     */
    private function createTenantFixture(EntityManagerInterface $em, UserPasswordHasherInterface $hasher): array
    {
        $suffix = uniqid();

        $tenant = new Tenant();
        $tenant->setName('Portal Tenant ' . $suffix);
        $tenant->setSlug('portal-tenant-' . $suffix);
        $em->persist($tenant);

        $user = new User();
        $user->setTenant($tenant);
        $user->setEmail('artisan-' . $suffix . '@portal.test');
        $user->setPassword($hasher->hashPassword($user, 'Password1!'));
        $em->persist($user);

        $client = new Client();
        $client->setTenant($tenant);
        $client->setName('Client Portal ' . $suffix);
        $em->persist($client);

        $chantier = new Chantier();
        $chantier->setTenant($tenant);
        $chantier->setClient($client);
        $chantier->setTitle('Chantier Portal ' . $suffix);
        $em->persist($chantier);

        $em->flush();

        return [
            'tenant'   => $tenant,
            'user'     => $user,
            'client'   => $client,
            'chantier' => $chantier,
            'em'       => $em,
        ];
    }

    // -------------------------------------------------------------------------
    // Tests
    // -------------------------------------------------------------------------

    public function testPortalWithInvalidTokenReturns401(): void
    {
        $browser = static::createClient();

        $browser->request('GET', '/api/portal/this-token-does-not-exist');

        $this->assertResponseStatusCodeSame(401);
    }

    public function testPortalWithExpiredTokenReturns401(): void
    {
        $browser    = static::createClient();
        $container  = static::getContainer();

        /** @var EntityManagerInterface $em */
        $em     = $container->get(EntityManagerInterface::class);
        /** @var UserPasswordHasherInterface $hasher */
        $hasher = $container->get(UserPasswordHasherInterface::class);

        $fixture = $this->createTenantFixture($em, $hasher);

        // Create a ClientToken that is already expired.
        $expiredToken = new ClientToken();
        $expiredToken->setClient($fixture['client']);
        $expiredToken->setChantier($fixture['chantier']);
        $expiredToken->setToken(bin2hex(random_bytes(32)));
        $expiredToken->setExpiresAt(new \DateTimeImmutable('-1 day'));
        $em->persist($expiredToken);
        $em->flush();

        $browser->request('GET', '/api/portal/' . $expiredToken->getToken());

        $this->assertResponseStatusCodeSame(401);
    }

    public function testPortalWithValidTokenReturns200(): void
    {
        $browser   = static::createClient();
        $container = static::getContainer();

        /** @var EntityManagerInterface $em */
        $em     = $container->get(EntityManagerInterface::class);
        /** @var UserPasswordHasherInterface $hasher */
        $hasher = $container->get(UserPasswordHasherInterface::class);

        $fixture = $this->createTenantFixture($em, $hasher);

        // Create a valid ClientToken (default expiry is +30 days from constructor).
        $validToken = new ClientToken();
        $validToken->setClient($fixture['client']);
        $validToken->setChantier($fixture['chantier']);
        // Keep the auto-generated token value from the constructor.
        $em->persist($validToken);
        $em->flush();

        $browser->request('GET', '/api/portal/' . $validToken->getToken());

        $this->assertResponseStatusCodeSame(200);

        $body = json_decode($browser->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $this->assertArrayHasKey('tenant', $body);
        $this->assertArrayHasKey('client', $body);
        $this->assertArrayHasKey('chantier', $body);
        $this->assertSame($fixture['chantier']->getTitle(), $body['chantier']['title']);
        $this->assertSame($fixture['client']->getName(), $body['client']['name']);
    }
}
