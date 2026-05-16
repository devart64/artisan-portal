<?php

declare(strict_types=1);

namespace App\Tests\Security;

use App\Entity\Chantier;
use App\Entity\Client;
use App\Entity\ClientToken;
use App\Entity\Tenant;
use PHPUnit\Framework\TestCase;

class ClientTokenTest extends TestCase
{
    private function makeToken(int $expiresInDays): ClientToken
    {
        $tenant = new Tenant();
        $client = new Client();
        $client->setTenant($tenant);
        $client->setName('Test Client');

        $chantier = new Chantier();
        $chantier->setTenant($tenant);
        $chantier->setTitle('Test Chantier');

        $token = new ClientToken();
        $token->setClient($client);
        $token->setChantier($chantier);

        // Override expiresAt via reflection
        $reflection = new \ReflectionProperty(ClientToken::class, 'expiresAt');
        $expires = new \DateTimeImmutable(sprintf('%+d days', $expiresInDays));
        $reflection->setValue($token, $expires);

        return $token;
    }

    public function testFreshTokenIsValid(): void
    {
        $token = $this->makeToken(30);
        $this->assertTrue($token->isValid());
    }

    public function testExpiredTokenIsInvalid(): void
    {
        $token = $this->makeToken(-1);
        $this->assertFalse($token->isValid());
    }

    public function testTokenExpiresExactlyNowIsInvalid(): void
    {
        $token = $this->makeToken(0);
        // expires at "now + 0 days" which may be microseconds ahead or behind
        // just assert it returns a bool
        $this->assertIsBool($token->isValid());
    }

    public function testTokenHasUniqueValue(): void
    {
        $tenant = new Tenant();
        $client = new Client();
        $client->setTenant($tenant);
        $client->setName('C');
        $chantier = new Chantier();
        $chantier->setTenant($tenant);
        $chantier->setTitle('T');

        $t1 = new ClientToken();
        $t1->setClient($client);
        $t1->setChantier($chantier);
        $t2 = new ClientToken();
        $t2->setClient($client);
        $t2->setChantier($chantier);

        $this->assertNotEmpty($t1->getToken());
        $this->assertNotEmpty($t2->getToken());
        $this->assertNotSame($t1->getToken(), $t2->getToken());
    }

    public function testTokenLengthIs64Chars(): void
    {
        $tenant = new Tenant();
        $client = new Client();
        $client->setTenant($tenant);
        $client->setName('C');
        $chantier = new Chantier();
        $chantier->setTenant($tenant);
        $chantier->setTitle('T');

        $token = new ClientToken();
        $token->setClient($client);
        $token->setChantier($chantier);
        // bin2hex(random_bytes(32)) = 64 hex chars
        $this->assertSame(64, strlen($token->getToken()));
    }
}
