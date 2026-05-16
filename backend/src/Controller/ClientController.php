<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Client;
use App\Repository\ClientRepository;
use App\Service\TenantContext;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/clients')]
#[IsGranted('ROLE_USER')]
class ClientController extends AbstractController
{
    public function __construct(
        private readonly TenantContext $tenantContext,
        private readonly ClientRepository $clientRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {}

    /**
     * GET /api/clients
     *
     * List all clients belonging to the current tenant.
     */
    #[Route('', name: 'client_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $tenant  = $this->tenantContext->getTenant();
        $clients = $this->clientRepository->findByTenant($tenant);

        return $this->json($this->normalizeMany($clients));
    }

    /**
     * POST /api/clients
     *
     * Create a new client for the current tenant.
     * Body: { "name": "...", "email": "...", "phone": "..." }
     */
    #[Route('', name: 'client_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $tenant = $this->tenantContext->getTenant();

        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            return $this->json(['error' => 'Invalid JSON body.'], Response::HTTP_BAD_REQUEST);
        }

        $name = trim((string) ($data['name'] ?? ''));

        if ($name === '') {
            return $this->json(['error' => 'Name is required.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $client = new Client();
        $client->setTenant($tenant);
        $client->setName($name);

        if (isset($data['email'])) {
            $email = trim((string) $data['email']);
            if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return $this->json(['error' => 'Format d\'email invalide.'], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
            $client->setEmail($email !== '' ? $email : null);
        }

        if (isset($data['phone'])) {
            $phone = trim((string) $data['phone']);
            $client->setPhone($phone !== '' ? $phone : null);
        }

        $this->clientRepository->save($client, true);

        return $this->json($this->normalize($client), Response::HTTP_CREATED);
    }

    /**
     * GET /api/clients/{id}
     *
     * Retrieve a single client.
     */
    #[Route('/{id}', name: 'client_show', methods: ['GET'])]
    public function show(string $id): JsonResponse
    {
        $client = $this->resolveClient($id);

        if ($client === null) {
            return $this->json(['error' => 'Client not found.'], Response::HTTP_NOT_FOUND);
        }

        $this->denyAccessUnlessGranted('view', $client);

        return $this->json($this->normalize($client));
    }

    /**
     * PATCH /api/clients/{id}
     *
     * Update a client's details.
     * Body: { "name": "...", "email": "...", "phone": "..." } (all optional)
     */
    #[Route('/{id}', name: 'client_update', methods: ['PATCH'])]
    public function update(string $id, Request $request): JsonResponse
    {
        $client = $this->resolveClient($id);

        if ($client === null) {
            return $this->json(['error' => 'Client not found.'], Response::HTTP_NOT_FOUND);
        }

        $this->denyAccessUnlessGranted('edit', $client);

        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            return $this->json(['error' => 'Invalid JSON body.'], Response::HTTP_BAD_REQUEST);
        }

        if (array_key_exists('name', $data)) {
            $name = trim((string) $data['name']);
            if ($name === '') {
                return $this->json(['error' => 'Name cannot be empty.'], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
            $client->setName($name);
        }

        if (array_key_exists('email', $data)) {
            $email = ($data['email'] !== null) ? trim((string) $data['email']) : null;
            if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return $this->json(['error' => 'Format d\'email invalide.'], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
            $client->setEmail(($email !== null && $email !== '') ? $email : null);
        }

        if (array_key_exists('phone', $data)) {
            $phone = ($data['phone'] !== null) ? trim((string) $data['phone']) : null;
            $client->setPhone(($phone !== null && $phone !== '') ? $phone : null);
        }

        $this->entityManager->flush();

        return $this->json($this->normalize($client));
    }

    /**
     * DELETE /api/clients/{id}
     *
     * Delete a client.
     */
    #[Route('/{id}', name: 'client_delete', methods: ['DELETE'])]
    public function delete(string $id): JsonResponse
    {
        $client = $this->resolveClient($id);

        if ($client === null) {
            return $this->json(['error' => 'Client not found.'], Response::HTTP_NOT_FOUND);
        }

        $this->denyAccessUnlessGranted('delete', $client);

        $this->entityManager->remove($client);
        $this->entityManager->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Find a client that belongs to the current tenant, or return null.
     */
    private function resolveClient(string $id): ?Client
    {
        $tenant = $this->tenantContext->getTenant();
        $client = $this->clientRepository->find($id);

        if ($client === null || $client->getTenant()->getId()->toString() !== $tenant->getId()->toString()) {
            return null;
        }

        return $client;
    }

    /** @return array<string, mixed> */
    private function normalize(Client $client): array
    {
        return [
            'id'        => $client->getId()->toString(),
            'name'      => $client->getName(),
            'email'     => $client->getEmail(),
            'phone'     => $client->getPhone(),
            'createdAt' => $client->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }

    /**
     * @param Client[] $clients
     * @return array<int, array<string, mixed>>
     */
    private function normalizeMany(array $clients): array
    {
        return array_map($this->normalize(...), $clients);
    }
}
