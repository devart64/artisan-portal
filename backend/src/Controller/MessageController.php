<?php

declare(strict_types=1);

namespace App\Controller;

use App\Repository\ChantierRepository;
use App\Repository\MessageRepository;
use App\Service\TenantContext;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/messages')]
#[IsGranted('ROLE_USER')]
class MessageController extends AbstractController
{
    public function __construct(
        private readonly TenantContext $tenantContext,
        private readonly ChantierRepository $chantierRepository,
        private readonly MessageRepository $messageRepository,
    ) {}

    /**
     * GET /api/messages
     * GET /api/messages?unread=true
     *
     * Aggregates messages across all chantiers of the current tenant.
     * Used by the dashboard to show unread client messages.
     */
    #[Route('', name: 'messages_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $tenant = $this->tenantContext->getTenant();
        $unreadOnly = $request->query->get('unread') === 'true';

        $chantiers = $this->chantierRepository->findBy(['tenant' => $tenant]);

        $messages = [];
        foreach ($chantiers as $chantier) {
            $rows = $unreadOnly
                ? $this->messageRepository->findUnreadClientMessages($chantier)
                : $this->messageRepository->findByChantier($chantier);

            foreach ($rows as $msg) {
                $messages[] = [
                    'id'          => $msg->getId()->toString(),
                    'chantierId'  => $chantier->getId()->toString(),
                    'chantierTitle' => $chantier->getTitle(),
                    'senderType'  => $msg->getSenderType(),
                    'senderName'  => $msg->getSenderName(),
                    'content'     => $msg->getContent(),
                    'read'        => $msg->isRead(),
                    'createdAt'   => $msg->getCreatedAt()->format(\DateTimeInterface::ATOM),
                ];
            }
        }

        // Sort by date desc
        usort($messages, static fn ($a, $b) => strcmp($b['createdAt'], $a['createdAt']));

        return $this->json($messages);
    }
}
