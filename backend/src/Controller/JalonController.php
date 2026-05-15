<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Chantier;
use App\Entity\Jalon;
use App\Repository\ChantierRepository;
use App\Repository\JalonRepository;
use App\Service\TenantContext;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api')]
#[IsGranted('ROLE_USER')]
class JalonController extends AbstractController
{
    public function __construct(
        private readonly TenantContext $tenantContext,
        private readonly ChantierRepository $chantierRepository,
        private readonly JalonRepository $jalonRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {}

    /**
     * GET /api/chantiers/{id}/jalons
     *
     * List jalons for a chantier ordered by date ASC.
     */
    #[Route('/chantiers/{id}/jalons', name: 'jalon_list', methods: ['GET'])]
    public function list(string $id): JsonResponse
    {
        $chantier = $this->resolveChantier($id);

        if ($chantier === null) {
            return $this->json(['error' => 'Chantier not found.'], Response::HTTP_NOT_FOUND);
        }

        $this->denyAccessUnlessGranted('view', $chantier);

        $jalons = $this->jalonRepository->findByChantier($chantier);

        return $this->json($jalons, Response::HTTP_OK, [], ['groups' => ['jalon:read']]);
    }

    /**
     * POST /api/chantiers/{id}/jalons
     *
     * Create a new jalon for a chantier.
     * Body: { "title": "...", "date": "2024-06-01T00:00:00+00:00" }
     */
    #[Route('/chantiers/{id}/jalons', name: 'jalon_create', methods: ['POST'])]
    public function create(string $id, Request $request): JsonResponse
    {
        $chantier = $this->resolveChantier($id);

        if ($chantier === null) {
            return $this->json(['error' => 'Chantier not found.'], Response::HTTP_NOT_FOUND);
        }

        $this->denyAccessUnlessGranted('view', $chantier);

        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            return $this->json(['error' => 'Invalid JSON body.'], Response::HTTP_BAD_REQUEST);
        }

        $title = trim((string) ($data['title'] ?? ''));

        if ($title === '') {
            return $this->json(['error' => 'Title is required.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $jalon = new Jalon();
        $jalon->setChantier($chantier);
        $jalon->setTitle($title);

        if (!empty($data['date'])) {
            $parsedDate = \DateTimeImmutable::createFromFormat(\DateTimeInterface::ATOM, (string) $data['date']);
            if ($parsedDate === false) {
                // Fallback: try a plain Y-m-d
                $parsedDate = \DateTimeImmutable::createFromFormat('Y-m-d', (string) $data['date']);
            }
            if ($parsedDate !== false) {
                $jalon->setDate($parsedDate);
            } else {
                return $this->json(['error' => 'Invalid date format. Use ISO 8601 (e.g. 2024-06-01T00:00:00+00:00).'], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
        }

        if (isset($data['done'])) {
            $jalon->setDone((bool) $data['done']);
        }

        $this->jalonRepository->save($jalon, true);

        return $this->json($jalon, Response::HTTP_CREATED, [], ['groups' => ['jalon:read']]);
    }

    /**
     * PATCH /api/jalons/{id}
     *
     * Toggle done status and/or update title/date.
     * Body: { "done": true } | { "title": "..." } | { "date": "..." }
     */
    #[Route('/jalons/{id}', name: 'jalon_update', methods: ['PATCH'])]
    public function update(string $id, Request $request): JsonResponse
    {
        $jalon = $this->resolveJalon($id);

        if ($jalon === null) {
            return $this->json(['error' => 'Jalon not found.'], Response::HTTP_NOT_FOUND);
        }

        $this->denyAccessUnlessGranted('view', $jalon->getChantier());

        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            return $this->json(['error' => 'Invalid JSON body.'], Response::HTTP_BAD_REQUEST);
        }

        if (array_key_exists('title', $data)) {
            $title = trim((string) $data['title']);
            if ($title === '') {
                return $this->json(['error' => 'Title cannot be empty.'], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
            $jalon->setTitle($title);
        }

        if (array_key_exists('done', $data)) {
            $jalon->setDone((bool) $data['done']);
        }

        if (array_key_exists('date', $data)) {
            if ($data['date'] === null) {
                $jalon->setDate(null);
            } else {
                $parsedDate = \DateTimeImmutable::createFromFormat(\DateTimeInterface::ATOM, (string) $data['date']);
                if ($parsedDate === false) {
                    $parsedDate = \DateTimeImmutable::createFromFormat('Y-m-d', (string) $data['date']);
                }
                if ($parsedDate === false) {
                    return $this->json(['error' => 'Invalid date format. Use ISO 8601 (e.g. 2024-06-01T00:00:00+00:00).'], Response::HTTP_UNPROCESSABLE_ENTITY);
                }
                $jalon->setDate($parsedDate);
            }
        }

        $this->entityManager->flush();

        return $this->json($jalon, Response::HTTP_OK, [], ['groups' => ['jalon:read']]);
    }

    /**
     * DELETE /api/jalons/{id}
     *
     * Delete a jalon. Requires at least 'view' on the parent chantier.
     * The ChantierVoter restricts deletes to ADMIN users via 'edit'/'delete' on the chantier,
     * but since jalons are sub-resources managed by the artisan we gate on 'edit'.
     */
    #[Route('/jalons/{id}', name: 'jalon_delete', methods: ['DELETE'])]
    public function delete(string $id): JsonResponse
    {
        $jalon = $this->resolveJalon($id);

        if ($jalon === null) {
            return $this->json(['error' => 'Jalon not found.'], Response::HTTP_NOT_FOUND);
        }

        $this->denyAccessUnlessGranted('edit', $jalon->getChantier());

        $this->entityManager->remove($jalon);
        $this->entityManager->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private function resolveChantier(string $id): ?Chantier
    {
        $tenant   = $this->tenantContext->getTenant();
        $chantier = $this->chantierRepository->find($id);

        if ($chantier === null || $chantier->getTenant()->getId()->toString() !== $tenant->getId()->toString()) {
            return null;
        }

        return $chantier;
    }

    private function resolveJalon(string $id): ?Jalon
    {
        $tenant = $this->tenantContext->getTenant();
        $jalon  = $this->jalonRepository->find($id);

        if ($jalon === null || $jalon->getChantier()->getTenant()->getId()->toString() !== $tenant->getId()->toString()) {
            return null;
        }

        return $jalon;
    }
}
