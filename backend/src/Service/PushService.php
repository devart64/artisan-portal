<?php
declare(strict_types=1);
namespace App\Service;

use App\Entity\PushSubscription;
use App\Entity\Tenant;
use App\Repository\PushSubscriptionRepository;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\VAPID;

class PushService
{
    private ?WebPush $webPush = null;

    public function __construct(
        private readonly PushSubscriptionRepository $subscriptionRepository,
        private readonly string $vapidPublicKey,
        private readonly string $vapidPrivateKey,
        private readonly string $vapidSubject,
    ) {}

    /**
     * Lazily build the WebPush client. Deferring construction avoids crashing
     * when the VAPID keys are placeholders/absent (tests, or dev setups without
     * push configured), since WebPush decodes the keys eagerly in its constructor.
     */
    private function webPush(): WebPush
    {
        return $this->webPush ??= new WebPush([
            'VAPID' => [
                'subject'    => $this->vapidSubject,
                'publicKey'  => $this->vapidPublicKey,
                'privateKey' => $this->vapidPrivateKey,
            ],
        ]);
    }

    public function sendToTenant(Tenant $tenant, string $title, string $body, ?string $url = null): void
    {
        $subscriptions = $this->subscriptionRepository->findForTenant($tenant);

        if (empty($subscriptions)) {
            return;
        }

        $payload = json_encode([
            'title' => $title,
            'body'  => $body,
            'url'   => $url ?? '/',
            'icon'  => '/icon-192.png',
        ]);

        foreach ($subscriptions as $sub) {
            try {
                $subscription = Subscription::create([
                    'endpoint' => $sub->getEndpoint(),
                    'keys'     => [
                        'p256dh' => $sub->getP256dh(),
                        'auth'   => $sub->getAuth(),
                    ],
                ]);
                $this->webPush()->queueNotification($subscription, $payload);
            } catch (\Throwable) {
                // Subscription invalide — ignorer
            }
        }

        foreach ($this->webPush()->flush() as $report) {
            // Log les échecs si nécessaire
        }
    }
}
