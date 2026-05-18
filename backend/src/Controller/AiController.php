<?php

declare(strict_types=1);

namespace App\Controller;

use App\Repository\ChantierRepository;
use App\Service\AiService;
use App\Service\TenantContext;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/ai')]
#[IsGranted('ROLE_USER')]
class AiController extends AbstractController
{
    public function __construct(
        private readonly AiService $aiService,
        private readonly ChantierRepository $chantierRepository,
        private readonly TenantContext $tenantContext,
        #[Autowire(service: 'limiter.ai_devis')]
        private readonly RateLimiterFactory $aiLimiter,
    ) {}

    #[Route('/chantiers/{id}/devis', name: 'ai_generate_devis', methods: ['POST'])]
    public function generateDevis(string $id): JsonResponse
    {
        $tenant  = $this->tenantContext->getTenant();
        $limiter = $this->aiLimiter->create($tenant->getId()->toString());
        if (!$limiter->consume(1)->isAccepted()) {
            return $this->json(['error' => 'Limite atteinte. Vous pouvez générer 10 devis IA par heure.'], Response::HTTP_TOO_MANY_REQUESTS);
        }

        $chantier = $this->chantierRepository->find($id);

        if ($chantier === null || !$chantier->getTenant()->getId()->equals($tenant->getId())) {
            return $this->json(['error' => 'Chantier introuvable.'], Response::HTTP_NOT_FOUND);
        }

        try {
            $devis = $this->aiService->generateDevis($chantier);
            return $this->json(['devis' => $devis]);
        } catch (\Throwable $e) {
            return $this->json(['error' => 'Erreur IA : ' . $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
