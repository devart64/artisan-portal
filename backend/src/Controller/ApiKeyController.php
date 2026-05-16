<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\ApiKey;
use App\Enum\PlanEnum;
use App\Repository\ApiKeyRepository;
use App\Service\TenantContext;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/api-keys')]
#[IsGranted('ROLE_ADMIN')]
class ApiKeyController extends AbstractController
{
    public function __construct(
        private readonly ApiKeyRepository $apiKeyRepository,
        private readonly TenantContext $tenantContext,
        private readonly EntityManagerInterface $em,
    ) {}

    #[Route('', name: 'api_keys_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $tenant = $this->tenantContext->getTenant();

        if ($tenant->getPlan() !== PlanEnum::BUSINESS) {
            return $this->json(['error' => 'Les clés API sont réservées au plan Entreprise.'], Response::HTTP_PAYMENT_REQUIRED);
        }

        $keys = $this->apiKeyRepository->findBy(['tenant' => $tenant]);

        return $this->json(array_map(fn(ApiKey $k) => [
            'id'         => $k->getId()->toString(),
            'name'       => $k->getName(),
            'prefix'     => $k->getKeyPrefix() . '...',
            'lastUsedAt' => $k->getLastUsedAt()?->format('c'),
            'createdAt'  => $k->getCreatedAt()->format('c'),
        ], $keys));
    }

    #[Route('', name: 'api_keys_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $tenant = $this->tenantContext->getTenant();

        if ($tenant->getPlan() !== PlanEnum::BUSINESS) {
            return $this->json(['error' => 'Les clés API sont réservées au plan Entreprise.'], Response::HTTP_PAYMENT_REQUIRED);
        }

        $data = json_decode($request->getContent(), true);
        $name = trim($data['name'] ?? '');

        if ($name === '') {
            return $this->json(['error' => 'Le nom est requis.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Générer la clé brute (on la retourne UNE SEULE FOIS)
        $rawKey = 'ap_' . bin2hex(random_bytes(24));
        $prefix = substr($rawKey, 0, 8);
        $hash   = hash('sha256', $rawKey);

        $apiKey = new ApiKey();
        $apiKey->setTenant($tenant);
        $apiKey->setName($name);
        $apiKey->setKeyHash($hash);
        $apiKey->setKeyPrefix($prefix);

        $this->em->persist($apiKey);
        $this->em->flush();

        return $this->json([
            'id'  => $apiKey->getId()->toString(),
            'key' => $rawKey,  // Affiché une seule fois !
            'name' => $name,
        ], Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'api_keys_delete', methods: ['DELETE'])]
    public function delete(string $id): JsonResponse
    {
        $tenant = $this->tenantContext->getTenant();
        $key    = $this->apiKeyRepository->find($id);

        if ($key === null || !$key->getTenant()->getId()->equals($tenant->getId())) {
            return $this->json(['error' => 'Introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $this->em->remove($key);
        $this->em->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }
}
