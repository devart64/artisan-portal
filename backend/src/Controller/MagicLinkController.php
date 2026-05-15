<?php

declare(strict_types=1);

namespace App\Controller;

use App\Repository\ChantierRepository;
use App\Repository\ClientRepository;
use App\Service\MagicLinkService;
use App\Service\TenantContext;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/auth')]
#[IsGranted('ROLE_USER')]
class MagicLinkController extends AbstractController
{
    public function __construct(
        private readonly TenantContext $tenantContext,
        private readonly ClientRepository $clientRepository,
        private readonly ChantierRepository $chantierRepository,
        private readonly MagicLinkService $magicLinkService,
    ) {}

    /**
     * POST /api/auth/magic-link
     * Generate and send a magic link to a client for a specific chantier.
     *
     * Body: { "clientId": "...", "chantierId": "..." }
     */
    #[Route('/magic-link', name: 'auth_magic_link', methods: ['POST'])]
    public function sendMagicLink(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            return $this->json(['error' => 'Invalid JSON body.'], Response::HTTP_BAD_REQUEST);
        }

        if (empty($data['clientId']) || empty($data['chantierId'])) {
            return $this->json(['error' => 'clientId and chantierId are required.'], Response::HTTP_BAD_REQUEST);
        }

        $tenant = $this->tenantContext->getTenant();

        // Verify client belongs to this tenant
        $client = $this->clientRepository->find($data['clientId']);
        if ($client === null || $client->getTenant()->getId()->toString() !== $tenant->getId()->toString()) {
            return $this->json(['error' => 'Client not found.'], Response::HTTP_NOT_FOUND);
        }

        // Verify chantier belongs to this tenant
        $chantier = $this->chantierRepository->find($data['chantierId']);
        if ($chantier === null || $chantier->getTenant()->getId()->toString() !== $tenant->getId()->toString()) {
            return $this->json(['error' => 'Chantier not found.'], Response::HTTP_NOT_FOUND);
        }

        // Client must have an email address to receive the magic link
        if ($client->getEmail() === null) {
            return $this->json(['error' => 'This client has no email address.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        try {
            $this->magicLinkService->sendMagicLink($client, $chantier);
        } catch (\Throwable $e) {
            return $this->json(['error' => 'Failed to send magic link: ' . $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->json(['message' => 'Magic link sent successfully.'], Response::HTTP_OK);
    }
}
