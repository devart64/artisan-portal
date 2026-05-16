<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class LeadControllerTest extends WebTestCase
{
    // -------------------------------------------------------------------------
    // Helper: register a fresh user and return its JWT
    // -------------------------------------------------------------------------

    /**
     * Registers a brand-new artisan account with a unique email and returns the
     * JWT obtained from the subsequent login call.
     *
     * @return array{jwt: string, browser: KernelBrowser}
     */
    private function registerAndGetJwt(): array
    {
        $browser = static::createClient();
        $email    = 'lead-test-' . uniqid() . '@example.com';
        $password = 'Password1!';

        // Step 1 – register (also returns a token but we use login below for
        // explicitness, matching real client flows).
        $browser->request(
            'POST',
            '/api/auth/register',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['name' => 'Lead Tester', 'email' => $email, 'password' => $password], JSON_THROW_ON_ERROR)
        );

        $registerStatus = $browser->getResponse()->getStatusCode();
        if ($registerStatus !== 201) {
            throw new \RuntimeException("Registration failed with status $registerStatus");
        }

        // Step 2 – login to get a fresh token.
        $browser->request(
            'POST',
            '/api/auth/login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['email' => $email, 'password' => $password], JSON_THROW_ON_ERROR)
        );

        $loginStatus = $browser->getResponse()->getStatusCode();
        if ($loginStatus !== 200) {
            throw new \RuntimeException("Login failed with status $loginStatus");
        }

        $body = json_decode($browser->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        return ['jwt' => $body['token'], 'browser' => $browser];
    }

    // -------------------------------------------------------------------------
    // Tests
    // -------------------------------------------------------------------------

    public function testCreateLeadRequiresAuth(): void
    {
        $client = static::createClient();

        $client->request(
            'POST',
            '/api/leads',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['name' => 'Prospect Anonyme', 'trade' => 'plomberie'], JSON_THROW_ON_ERROR)
        );

        $this->assertResponseStatusCodeSame(401);
    }

    public function testListLeadsRequiresAuth(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/leads');
        $this->assertResponseStatusCodeSame(401);
    }

    public function testCreateLeadWithAuth(): void
    {
        ['jwt' => $jwt, 'browser' => $browser] = $this->registerAndGetJwt();

        $browser->request(
            'POST',
            '/api/leads',
            [],
            [],
            [
                'CONTENT_TYPE'  => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer ' . $jwt,
            ],
            json_encode([
                'name'   => 'Pierre Martin',
                'email'  => 'pierre.martin@example.com',
                'trade'  => 'electricite',
                'city'   => 'Lyon',
                'source' => 'agent',
                'score'  => 75,
            ], JSON_THROW_ON_ERROR)
        );

        $this->assertResponseStatusCodeSame(201);

        $body = json_decode($browser->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $this->assertArrayHasKey('id', $body);
        $this->assertSame('Pierre Martin', $body['name']);
        $this->assertSame('electricite', $body['trade']);
        $this->assertSame(75, $body['score']);
        $this->assertSame('new', $body['status']);
    }

    public function testListLeadsWithAuth(): void
    {
        ['jwt' => $jwt, 'browser' => $browser] = $this->registerAndGetJwt();

        // Create one lead so the list is not trivially empty.
        $browser->request(
            'POST',
            '/api/leads',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $jwt],
            json_encode(['name' => 'Sophie Bernard', 'trade' => 'maconnerie'], JSON_THROW_ON_ERROR)
        );
        $this->assertResponseStatusCodeSame(201);

        // List leads.
        $browser->request(
            'GET',
            '/api/leads',
            [],
            [],
            ['HTTP_AUTHORIZATION' => 'Bearer ' . $jwt]
        );

        $this->assertResponseStatusCodeSame(200);

        $body = json_decode($browser->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $this->assertIsArray($body);
        $this->assertGreaterThanOrEqual(1, count($body));
    }

    public function testUpdateLeadStatus(): void
    {
        ['jwt' => $jwt, 'browser' => $browser] = $this->registerAndGetJwt();

        // Create the lead.
        $browser->request(
            'POST',
            '/api/leads',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $jwt],
            json_encode(['name' => 'Marc Dupont', 'trade' => 'peinture'], JSON_THROW_ON_ERROR)
        );
        $this->assertResponseStatusCodeSame(201);

        $created = json_decode($browser->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $leadId  = $created['id'];

        // PATCH the status.
        $browser->request(
            'PATCH',
            '/api/leads/' . $leadId,
            [],
            [],
            ['CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $jwt],
            json_encode(['status' => 'qualified'], JSON_THROW_ON_ERROR)
        );

        $this->assertResponseStatusCodeSame(200);

        $updated = json_decode($browser->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $this->assertSame('qualified', $updated['status']);
    }

    public function testUpdateLeadScore(): void
    {
        ['jwt' => $jwt, 'browser' => $browser] = $this->registerAndGetJwt();

        // Create the lead.
        $browser->request(
            'POST',
            '/api/leads',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $jwt],
            json_encode(['name' => 'Anna Lefort', 'trade' => 'carrelage', 'score' => 10], JSON_THROW_ON_ERROR)
        );
        $this->assertResponseStatusCodeSame(201);

        $created = json_decode($browser->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $leadId  = $created['id'];

        // PATCH the score.
        $browser->request(
            'PATCH',
            '/api/leads/' . $leadId,
            [],
            [],
            ['CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $jwt],
            json_encode(['score' => 90], JSON_THROW_ON_ERROR)
        );

        $this->assertResponseStatusCodeSame(200);

        $updated = json_decode($browser->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $this->assertSame(90, $updated['score']);
    }
}
