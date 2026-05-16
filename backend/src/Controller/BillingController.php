<?php

declare(strict_types=1);

namespace App\Controller;

use App\Service\PlanLimitChecker;
use App\Service\StripeService;
use App\Service\TenantContext;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api')]
#[IsGranted('ROLE_USER')]
class BillingController extends AbstractController
{
    public function __construct(
        private TenantContext $tenantContext,
        private StripeService $stripeService,
        private PlanLimitChecker $planLimitChecker,
    ) {}

    #[Route('/billing', name: 'billing_info', methods: ['GET'])]
    public function billing(): JsonResponse
    {
        $tenant = $this->tenantContext->getTenant();

        $data = [
            'plan'                => $tenant->getPlan()->value,
            'planStatus'          => $tenant->getPlanStatus()->value,
            'trialEndsAt'         => $tenant->getTrialEndsAt()?->format('c'),
            'stripeCustomerId'    => $tenant->getStripeCustomerId(),
            'stripePortalUrl'     => null,
            'nextBillingDate'     => null,
            'remainingChantiers'  => $this->planLimitChecker->getRemainingChantiers($tenant),
        ];

        if ($tenant->getStripeCustomerId()) {
            try {
                $data['stripePortalUrl'] = $this->stripeService->getPortalUrl($tenant->getStripeCustomerId());
            } catch (\Throwable) {
                // Stripe non configuré ou erreur réseau — pas critique
            }
        }

        return $this->json($data);
    }

    #[Route('/stripe/checkout', name: 'stripe_checkout', methods: ['POST'])]
    public function checkout(Request $request): JsonResponse
    {
        $tenant = $this->tenantContext->getTenant();

        // Map plan → Stripe price ID (depuis les variables d'env)
        $planPrices = [
            'starter'  => $_ENV['STRIPE_PRICE_STARTER']  ?? '',
            'pro'      => $_ENV['STRIPE_PRICE_PRO']       ?? '',
            'business' => $_ENV['STRIPE_PRICE_BUSINESS']  ?? '',
        ];

        $body    = json_decode($request->getContent() ?: '{}', true);
        $plan    = $body['plan'] ?? 'starter';
        $priceId = $planPrices[$plan] ?? '';

        if (!$priceId) {
            return $this->json(['error' => 'Plan invalide ou STRIPE_PRICE_' . strtoupper($plan) . ' non configuré'], 400);
        }

        $frontendUrl = $_ENV['FRONTEND_URL'] ?? 'http://localhost:3000';
        $successUrl  = "{$frontendUrl}/settings/billing?success=1";
        $cancelUrl   = "{$frontendUrl}/settings/billing?canceled=1";

        try {
            $url = $this->stripeService->createCheckoutSession($tenant, $priceId, $successUrl, $cancelUrl);
            return $this->json(['url' => $url]);
        } catch (\Throwable $e) {
            return $this->json(['error' => $e->getMessage()], 500);
        }
    }
}
