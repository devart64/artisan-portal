<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Tenant;
use App\Enum\PlanEnum;
use App\Enum\PlanStatusEnum;
use App\Repository\TenantRepository;
use Doctrine\ORM\EntityManagerInterface;
use Stripe\Customer;
use Stripe\Exception\SignatureVerificationException;
use Stripe\StripeClient;
use Stripe\Webhook;

class StripeService
{
    private readonly StripeClient $stripe;

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly TenantRepository $tenantRepository,
        private readonly string $stripeSecretKey,
        private readonly string $stripeWebhookSecret,
    ) {
        $this->stripe = new StripeClient($this->stripeSecretKey);
    }

    /**
     * Create a Stripe customer for the given tenant and return the customer ID.
     */
    public function createCustomer(Tenant $tenant): string
    {
        $customer = $this->stripe->customers->create([
            'name'     => $tenant->getName(),
            'metadata' => [
                'tenant_id'   => $tenant->getId()->toString(),
                'tenant_slug' => $tenant->getSlug(),
            ],
        ]);

        return $customer->id;
    }

    /**
     * Create a subscription for the given customer and Stripe price ID.
     */
    public function createSubscription(string $customerId, string $priceId): void
    {
        $this->stripe->subscriptions->create([
            'customer' => $customerId,
            'items'    => [
                ['price' => $priceId],
            ],
            'payment_behavior' => 'default_incomplete',
            'expand'           => ['latest_invoice.payment_intent'],
        ]);
    }

    /**
     * Generate a Stripe Customer Portal URL for self-service billing management.
     */
    public function getPortalUrl(string $customerId): string
    {
        $session = $this->stripe->billingPortal->sessions->create([
            'customer'   => $customerId,
            'return_url' => 'https://app.artisan-portal.fr/settings/billing',
        ]);

        return $session->url;
    }

    /**
     * Handle a Stripe webhook payload, verifying signature and updating tenant records.
     */
    public function handleWebhook(string $payload, string $signature): void
    {
        try {
            $event = Webhook::constructEvent($payload, $signature, $this->stripeWebhookSecret);
        } catch (SignatureVerificationException $e) {
            throw new \InvalidArgumentException('Invalid Stripe webhook signature.', 0, $e);
        }

        match ($event->type) {
            'customer.subscription.updated' => $this->handleSubscriptionUpdated($event->data->object),
            'customer.subscription.deleted' => $this->handleSubscriptionDeleted($event->data->object),
            'invoice.payment_failed'        => $this->handlePaymentFailed($event->data->object),
            'invoice.payment_succeeded'     => $this->handlePaymentSucceeded($event->data->object),
            default                         => null,
        };
    }

    private function handleSubscriptionUpdated(\Stripe\Subscription $subscription): void
    {
        $tenant = $this->tenantRepository->findByStripeCustomerId($subscription->customer);
        if ($tenant === null) {
            return;
        }

        $status = $this->mapStripeStatusToPlanStatus($subscription->status);
        $tenant->setPlanStatus($status);

        $this->entityManager->flush();
    }

    private function handleSubscriptionDeleted(\Stripe\Subscription $subscription): void
    {
        $tenant = $this->tenantRepository->findByStripeCustomerId($subscription->customer);
        if ($tenant === null) {
            return;
        }

        $tenant->setPlanStatus(PlanStatusEnum::CANCELED);
        $this->entityManager->flush();
    }

    private function handlePaymentFailed(\Stripe\Invoice $invoice): void
    {
        if ($invoice->customer === null) {
            return;
        }

        $tenant = $this->tenantRepository->findByStripeCustomerId($invoice->customer);
        if ($tenant === null) {
            return;
        }

        $tenant->setPlanStatus(PlanStatusEnum::PAST_DUE);
        $this->entityManager->flush();
    }

    private function handlePaymentSucceeded(\Stripe\Invoice $invoice): void
    {
        if ($invoice->customer === null) {
            return;
        }

        $tenant = $this->tenantRepository->findByStripeCustomerId($invoice->customer);
        if ($tenant === null) {
            return;
        }

        $tenant->setPlanStatus(PlanStatusEnum::ACTIVE);
        $this->entityManager->flush();
    }

    private function mapStripeStatusToPlanStatus(string $stripeStatus): PlanStatusEnum
    {
        return match ($stripeStatus) {
            'trialing'  => PlanStatusEnum::TRIALING,
            'active'    => PlanStatusEnum::ACTIVE,
            'past_due'  => PlanStatusEnum::PAST_DUE,
            'canceled'  => PlanStatusEnum::CANCELED,
            'unpaid'    => PlanStatusEnum::PAST_DUE,
            default     => PlanStatusEnum::CANCELED,
        };
    }
}
