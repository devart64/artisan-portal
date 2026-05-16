<?php
declare(strict_types=1);
namespace App\Controller;

use App\Entity\PushSubscription;
use App\Repository\PushSubscriptionRepository;
use App\Service\TenantContext;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/push')]
#[IsGranted('ROLE_USER')]
class PushController extends AbstractController
{
    public function __construct(
        private readonly TenantContext $tenantContext,
        private readonly PushSubscriptionRepository $subscriptionRepository,
        private readonly EntityManagerInterface $em,
        private readonly string $vapidPublicKey,
    ) {}

    #[Route('/vapid-public-key', name: 'push_vapid_key', methods: ['GET'])]
    public function vapidKey(): JsonResponse
    {
        return $this->json(['publicKey' => $this->vapidPublicKey]);
    }

    #[Route('/subscribe', name: 'push_subscribe', methods: ['POST'])]
    public function subscribe(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $endpoint = $data['endpoint'] ?? '';
        $p256dh   = $data['keys']['p256dh'] ?? '';
        $auth     = $data['keys']['auth'] ?? '';

        if ($endpoint === '' || $p256dh === '' || $auth === '') {
            return $this->json(['error' => 'Données manquantes.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $tenant = $this->tenantContext->getTenant();

        // Upsert : si l'endpoint existe déjà, ne pas dupliquer
        $existing = $this->subscriptionRepository->findOneBy(['endpoint' => $endpoint]);
        if ($existing !== null) {
            return $this->json(['ok' => true]);
        }

        $sub = new PushSubscription();
        $sub->setTenant($tenant);
        $sub->setEndpoint($endpoint);
        $sub->setP256dh($p256dh);
        $sub->setAuth($auth);

        $this->em->persist($sub);
        $this->em->flush();

        return $this->json(['ok' => true], Response::HTTP_CREATED);
    }

    #[Route('/unsubscribe', name: 'push_unsubscribe', methods: ['POST'])]
    public function unsubscribe(Request $request): JsonResponse
    {
        $data     = json_decode($request->getContent(), true);
        $endpoint = $data['endpoint'] ?? '';

        $sub = $this->subscriptionRepository->findOneBy(['endpoint' => $endpoint]);
        if ($sub !== null) {
            $this->em->remove($sub);
            $this->em->flush();
        }

        return $this->json(['ok' => true]);
    }
}
