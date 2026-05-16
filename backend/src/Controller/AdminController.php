<?php

declare(strict_types=1);

namespace App\Controller;

use App\Enum\PlanEnum;
use App\Enum\PlanStatusEnum;
use App\Repository\TenantRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/admin/api')]
#[IsGranted('ROLE_SUPER_ADMIN')]
class AdminController extends AbstractController
{
    public function __construct(
        private readonly TenantRepository $tenantRepository,
        private readonly UserRepository $userRepository,
        private readonly EntityManagerInterface $em,
    ) {}

    #[Route('/tenants', name: 'admin_tenants', methods: ['GET'])]
    public function tenants(): JsonResponse
    {
        $tenants = $this->tenantRepository->findAll();

        return $this->json(array_map(fn($t) => [
            'id'          => $t->getId()->toString(),
            'name'        => $t->getName(),
            'slug'        => $t->getSlug(),
            'plan'        => $t->getPlan()->value,
            'planStatus'  => $t->getPlanStatus()->value,
            'trialEndsAt' => $t->getTrialEndsAt()?->format('c'),
            'createdAt'   => $t->getCreatedAt()->format('c'),
            'userCount'   => count($this->userRepository->findBy(['tenant' => $t])),
        ], $tenants));
    }

    #[Route('/tenants/{id}', name: 'admin_tenant_update', methods: ['PATCH'])]
    public function updateTenant(string $id, Request $request): JsonResponse
    {
        $tenant = $this->tenantRepository->find($id);
        if ($tenant === null) {
            return $this->json(['error' => 'Tenant introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['plan'])) {
            $plan = PlanEnum::tryFrom($data['plan']);
            if ($plan === null) {
                return $this->json(['error' => 'Plan invalide.'], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
            $tenant->setPlan($plan);
        }

        if (isset($data['planStatus'])) {
            $status = PlanStatusEnum::tryFrom($data['planStatus']);
            if ($status === null) {
                return $this->json(['error' => 'Statut invalide.'], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
            $tenant->setPlanStatus($status);
        }

        $this->em->flush();

        return $this->json(['ok' => true]);
    }

    #[Route('/stats', name: 'admin_stats', methods: ['GET'])]
    public function stats(): JsonResponse
    {
        $tenants = $this->tenantRepository->findAll();

        $byPlan = [];
        foreach (PlanEnum::cases() as $plan) {
            $byPlan[$plan->value] = 0;
        }
        foreach ($tenants as $t) {
            $byPlan[$t->getPlan()->value]++;
        }

        return $this->json([
            'totalTenants' => count($tenants),
            'byPlan'       => $byPlan,
            'totalUsers'   => count($this->userRepository->findAll()),
        ]);
    }
}
