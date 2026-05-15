<?php

declare(strict_types=1);

namespace App\Security;

use App\Repository\ClientTokenRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAuthenticationException;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;

class ClientTokenAuthenticator extends AbstractAuthenticator
{
    public function __construct(
        private readonly ClientTokenRepository $clientTokenRepository,
    ) {}

    public function supports(Request $request): ?bool
    {
        // Only handle requests to /api/portal/{token}/*
        return str_starts_with($request->getPathInfo(), '/api/portal/');
    }

    public function authenticate(Request $request): Passport
    {
        // Extract token from URL path: /api/portal/{token}/...
        $pathInfo = $request->getPathInfo();
        $pathParts = explode('/', trim($pathInfo, '/'));

        // Expected: ['api', 'portal', '{token}', ...]
        if (count($pathParts) < 3) {
            throw new CustomUserMessageAuthenticationException('Token is missing from URL.');
        }

        $tokenValue = $pathParts[2];

        if (empty($tokenValue)) {
            throw new CustomUserMessageAuthenticationException('Token is missing from URL.');
        }

        $clientToken = $this->clientTokenRepository->findValidByToken($tokenValue);

        if ($clientToken === null) {
            throw new CustomUserMessageAuthenticationException('Invalid or expired magic link token.');
        }

        $client = $clientToken->getClient();
        $chantier = $clientToken->getChantier();
        $tenant = $client->getTenant();

        $clientUser = new ClientUser($client, $chantier, $tenant);

        return new SelfValidatingPassport(
            new UserBadge(
                $client->getId()->toString(),
                function () use ($clientUser): ClientUser {
                    return $clientUser;
                }
            )
        );
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?Response
    {
        // Continue with the request
        return null;
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): ?Response
    {
        return new JsonResponse(
            ['error' => $exception->getMessageKey()],
            Response::HTTP_UNAUTHORIZED
        );
    }
}
