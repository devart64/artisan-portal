<?php
declare(strict_types=1);
namespace App\Controller;

use App\Repository\ChantierRepository;
use App\Repository\ClientRepository;
use App\Repository\UserRepository;
use App\Service\TenantContext;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/onboarding')]
#[IsGranted('ROLE_USER')]
class OnboardingController extends AbstractController
{
    public function __construct(
        private readonly TenantContext $tenantContext,
        private readonly ChantierRepository $chantierRepository,
        private readonly ClientRepository $clientRepository,
        private readonly UserRepository $userRepository,
    ) {}

    #[Route('/checklist', name: 'onboarding_checklist', methods: ['GET'])]
    public function checklist(): JsonResponse
    {
        $tenant = $this->tenantContext->getTenant();

        $hasClient     = count($this->clientRepository->findBy(['tenant' => $tenant], limit: 1)) > 0;
        $hasChantier   = count($this->chantierRepository->findBy(['tenant' => $tenant], limit: 1)) > 0;
        $hasTeamMember = count($this->userRepository->findBy(['tenant' => $tenant])) > 1;
        $hasBilling    = in_array($tenant->getPlanStatus()->value, ['active', 'trialing'], true);

        $steps = [
            ['key' => 'profile',  'label' => 'Configurer votre profil',         'done' => true],
            ['key' => 'client',   'label' => 'Ajouter votre premier client',     'done' => $hasClient],
            ['key' => 'chantier', 'label' => 'Créer votre premier chantier',     'done' => $hasChantier],
            ['key' => 'billing',  'label' => 'Choisir un plan',                  'done' => $hasBilling],
            ['key' => 'team',     'label' => 'Inviter un collaborateur',          'done' => $hasTeamMember],
        ];

        $completed = count(array_filter($steps, fn($s) => $s['done']));
        $total     = count($steps);

        return $this->json([
            'steps'     => $steps,
            'completed' => $completed,
            'total'     => $total,
            'percent'   => (int) round($completed / $total * 100),
            'done'      => $completed === $total,
        ]);
    }
}
