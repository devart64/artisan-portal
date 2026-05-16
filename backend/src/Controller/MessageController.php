<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Chantier;
use App\Entity\Message;
use App\Repository\ChantierRepository;
use App\Repository\MessageRepository;
use App\Service\TenantContext;
use Doctrine\ORM\EntityManagerInterface;
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
        private readonly EntityManagerInterface $em,
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

    /**
     * POST /api/chantiers/{id}/messages
     *
     * Sends a message from the authenticated artisan on a given chantier.
     * The chantier must belong to the current tenant (enforced via 'view' voter).
     */
    #[Route('/api/chantiers/{id}/messages', name: 'chantier_message_send', methods: ['POST'])]
    public function send(string $id, Request $request): JsonResponse
    {
        $chantier = $this->em->find(Chantier::class, $id);
        if (!$chantier) {
            return $this->json(['error' => 'Chantier introuvable'], 404);
        }

        $this->denyAccessUnlessGranted('view', $chantier);

        $data    = json_decode($request->getContent(), true);
        $content = trim($data['content'] ?? '');

        if ($content === '') {
            return $this->json(['error' => 'Le message ne peut pas être vide'], 422);
        }

        $user    = $this->tenantContext->getCurrentUser();
        $message = new Message();
        $message->setChantier($chantier);
        $message->setSenderType('artisan');
        $message->setSenderName($user->getEmail());
        $message->setContent($content);
        $message->setRead(false);

        $this->em->persist($message);
        $this->em->flush();

        return $this->json([
            'id'         => $message->getId()->toString(),
            'chantierId' => $chantier->getId()->toString(),
            'senderType' => $message->getSenderType(),
            'senderName' => $message->getSenderName(),
            'content'    => $message->getContent(),
            'read'       => $message->isRead(),
            'createdAt'  => $message->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ], 201);
    }
}
