<?php

declare(strict_types=1);

namespace App\Controller;

use App\Service\StripeService;
use App\Service\TenantContext;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class StripeWebhookController extends AbstractController
{
    /**
     * POST /api/stripe/webhook
     *
     * Public endpoint — no JWT required. Stripe calls this with a signed payload.
     * The signature is verified inside StripeService::handleWebhook().
     */
    #[Route('/api/stripe/webhook', name: 'stripe_webhook', methods: ['POST'])]
    public function webhook(Request $request, StripeService $stripeService): JsonResponse
    {
        $payload   = $request->getContent();
        $signature = $request->headers->get('Stripe-Signature', '');

        try {
            $stripeService->handleWebhook($payload, $signature);

            return $this->json(['ok' => true]);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        }
    }

    /**
     * GET /api/stripe/portal-url
     *
     * Returns a one-time Stripe Customer Portal URL for the authenticated tenant.
     * Requires ROLE_USER (JWT-protected via the api firewall).
     */
    #[Route('/api/stripe/portal-url', name: 'stripe_portal_url', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function portalUrl(TenantContext $tenantContext, StripeService $stripeService): JsonResponse
    {
        $tenant     = $tenantContext->getTenant();
        $customerId = $tenant->getStripeCustomerId() ?? '';

        if ($customerId === '') {
            return $this->json(
                ['error' => 'No Stripe customer linked to this tenant.'],
                Response::HTTP_UNPROCESSABLE_ENTITY
            );
        }

        $url = $stripeService->getPortalUrl($customerId);

        return $this->json(['url' => $url]);
    }
}
