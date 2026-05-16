<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Notification;
use App\Repository\NotificationRepository;
use App\Service\TenantContext;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/notifications')]
#[IsGranted('ROLE_USER')]
class NotificationController extends AbstractController
{
    public function __construct(
        private readonly NotificationRepository $notificationRepository,
        private readonly TenantContext $tenantContext,
        private readonly EntityManagerInterface $em,
    ) {}

    #[Route('', name: 'notifications_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $tenant        = $this->tenantContext->getTenant();
        $notifications = $this->notificationRepository->findForTenant($tenant);
        $unread        = $this->notificationRepository->countUnread($tenant);

        return $this->json([
            'unread' => $unread,
            'items'  => array_map(fn(Notification $n) => [
                'id'        => $n->getId()->toString(),
                'type'      => $n->getType(),
                'title'     => $n->getTitle(),
                'body'      => $n->getBody(),
                'url'       => $n->getUrl(),
                'read'      => $n->isRead(),
                'createdAt' => $n->getCreatedAt()->format('c'),
            ], $notifications),
        ]);
    }

    #[Route('/{id}/read', name: 'notification_read', methods: ['PATCH'])]
    public function markRead(string $id): JsonResponse
    {
        $tenant = $this->tenantContext->getTenant();
        $notif  = $this->notificationRepository->find($id);

        if ($notif === null || !$notif->getTenant()->getId()->equals($tenant->getId())) {
            return $this->json(['error' => 'Introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $notif->markRead();
        $this->em->flush();

        return $this->json(['ok' => true]);
    }

    #[Route('/read-all', name: 'notifications_read_all', methods: ['POST'])]
    public function markAllRead(): JsonResponse
    {
        $tenant = $this->tenantContext->getTenant();
        $items  = $this->notificationRepository->findForTenant($tenant, 100);

        foreach ($items as $n) {
            if (!$n->isRead()) $n->markRead();
        }

        $this->em->flush();
        return $this->json(['ok' => true]);
    }
}
