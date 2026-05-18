<?php

declare(strict_types=1);

namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Adds CORS headers to every API response and handles OPTIONS preflight requests.
 *
 * Configure the allowed origin via the CORS_ALLOW_ORIGIN environment variable.
 * Defaults to '*' when the variable is absent (suitable for development).
 *
 * Example .env entry:
 *   CORS_ALLOW_ORIGIN=https://app.artisan-portal.fr
 */
class CorsSubscriber implements EventSubscriberInterface
{
    private const ALLOW_METHODS = 'GET, POST, PATCH, PUT, DELETE, OPTIONS';
    private const ALLOW_HEADERS = 'Content-Type, Authorization, Accept, X-Requested-With';
    private const MAX_AGE       = '3600';

    public function __construct(
        private readonly string $corsAllowOrigin,
    ) {}

    public static function getSubscribedEvents(): array
    {
        return [
            // Run early so the preflight response is sent before any security checks.
            KernelEvents::REQUEST  => ['onKernelRequest', 250],
            KernelEvents::RESPONSE => ['onKernelResponse', 0],
        ];
    }

    /**
     * Short-circuit OPTIONS preflight requests with a 204 No Content response,
     * so they never reach the firewall or controller layer.
     */
    public function onKernelRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();

        if ($request->getMethod() !== Request::METHOD_OPTIONS) {
            return;
        }

        $response = new Response('', Response::HTTP_NO_CONTENT);
        $this->addCorsHeaders($request, $response);

        $event->setResponse($response);
    }

    /**
     * Append CORS headers to every outgoing response.
     */
    public function onKernelResponse(ResponseEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $this->addCorsHeaders($event->getRequest(), $event->getResponse());
    }

    private function addCorsHeaders(Request $request, Response $response): void
    {
        $origin = $this->resolveAllowedOrigin($request);

        $response->headers->set('Access-Control-Allow-Origin', $origin);
        $response->headers->set('Access-Control-Allow-Methods', self::ALLOW_METHODS);
        $response->headers->set('Access-Control-Allow-Headers', self::ALLOW_HEADERS);
        $response->headers->set('Access-Control-Max-Age', self::MAX_AGE);

        // Expose the Authorization header so the browser can read JWT responses.
        $response->headers->set('Access-Control-Expose-Headers', 'Authorization');

        // Allow credentials (cookies) when the origin is specific
        if ($origin !== '*') {
            $response->headers->set('Access-Control-Allow-Credentials', 'true');
        }

        // If the origin is specific (not a wildcard), we must add the Vary header
        // so CDNs and proxies cache the response per origin.
        if ($origin !== '*') {
            $response->headers->set('Vary', 'Origin');
        }
    }

    /**
     * Determine the effective allow-origin value.
     *
     * When CORS_ALLOW_ORIGIN is a wildcard ('*') we return '*' regardless of the
     * incoming Origin header.  When it contains a specific origin we compare it
     * against the request and echo it back only when it matches (standard behaviour
     * required for credentialed requests).
     */
    private function resolveAllowedOrigin(Request $request): string
    {
        $configured = $this->corsAllowOrigin;

        if ($configured === '*') {
            return '*';
        }

        $requestOrigin = $request->headers->get('Origin', '');

        // Support a comma-separated list of allowed origins.
        $allowed = array_map('trim', explode(',', $configured));

        if (in_array($requestOrigin, $allowed, true)) {
            return $requestOrigin;
        }

        // Return the first configured origin as a safe default when there is no
        // match — the browser will reject the response, which is the desired
        // behaviour for disallowed origins.
        return $allowed[0];
    }
}
