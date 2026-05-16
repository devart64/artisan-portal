<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class AuthControllerTest extends WebTestCase
{
    // -------------------------------------------------------------------------
    // Register
    // -------------------------------------------------------------------------

    public function testRegisterCreatesUserAndTenant(): void
    {
        $client = static::createClient();
        $email = 'register-' . uniqid() . '@example.com';

        $client->request(
            'POST',
            '/api/auth/register',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'name'     => 'Test Artisan',
                'email'    => $email,
                'password' => 'Password1!',
            ], JSON_THROW_ON_ERROR)
        );

        $this->assertResponseStatusCodeSame(201);
        $this->assertResponseHeaderSame('content-type', 'application/json');

        $body = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $this->assertArrayHasKey('token', $body);
        $this->assertNotEmpty($body['token']);
        $this->assertArrayHasKey('tenant', $body);
        $this->assertArrayHasKey('user', $body);
        $this->assertSame($email, $body['user']['email']);
    }

    public function testRegisterWithDuplicateEmailFails(): void
    {
        $client = static::createClient();
        $email = 'dup-' . uniqid() . '@example.com';

        $payload = json_encode([
            'name'     => 'Artisan Dup',
            'email'    => $email,
            'password' => 'Password1!',
        ], JSON_THROW_ON_ERROR);

        // First registration — must succeed.
        $client->request('POST', '/api/auth/register', [], [], ['CONTENT_TYPE' => 'application/json'], $payload);
        $this->assertResponseStatusCodeSame(201);

        // Second registration with the same email.
        $client->request('POST', '/api/auth/register', [], [], ['CONTENT_TYPE' => 'application/json'], $payload);

        $status = $client->getResponse()->getStatusCode();
        $this->assertContains($status, [409, 422], 'Expected 409 Conflict or 422 Unprocessable Entity for duplicate email.');
    }

    public function testRegisterMissingFieldsReturnsUnprocessable(): void
    {
        $client = static::createClient();

        $client->request(
            'POST',
            '/api/auth/register',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['name' => 'Missing email and password'], JSON_THROW_ON_ERROR)
        );

        $this->assertResponseStatusCodeSame(422);
    }

    // -------------------------------------------------------------------------
    // Login
    // -------------------------------------------------------------------------

    public function testLoginWithValidCredentials(): void
    {
        $client = static::createClient();
        $email = 'login-ok-' . uniqid() . '@example.com';
        $password = 'Password1!';

        // Create the account first.
        $client->request(
            'POST',
            '/api/auth/register',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['name' => 'Login Artisan', 'email' => $email, 'password' => $password], JSON_THROW_ON_ERROR)
        );
        $this->assertResponseStatusCodeSame(201);

        // Now log in.
        $client->request(
            'POST',
            '/api/auth/login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['email' => $email, 'password' => $password], JSON_THROW_ON_ERROR)
        );

        $this->assertResponseStatusCodeSame(200);

        $body = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $this->assertArrayHasKey('token', $body);
        $this->assertNotEmpty($body['token']);
    }

    public function testLoginWithBadPasswordFails(): void
    {
        $client = static::createClient();
        $email = 'login-bad-' . uniqid() . '@example.com';

        // Create account.
        $client->request(
            'POST',
            '/api/auth/register',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['name' => 'Bad Pass Artisan', 'email' => $email, 'password' => 'CorrectPass1!'], JSON_THROW_ON_ERROR)
        );
        $this->assertResponseStatusCodeSame(201);

        // Attempt login with wrong password.
        $client->request(
            'POST',
            '/api/auth/login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['email' => $email, 'password' => 'WrongPass99!'], JSON_THROW_ON_ERROR)
        );

        $this->assertResponseStatusCodeSame(401);
    }
}
