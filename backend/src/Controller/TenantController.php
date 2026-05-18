<?php

declare(strict_types=1);

namespace App\Controller;

use App\Service\FileUploadService;
use App\Service\TenantContext;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/settings')]
#[IsGranted('ROLE_USER')]
class TenantController extends AbstractController
{
    public function __construct(
        private readonly TenantContext $tenantContext,
        private readonly FileUploadService $fileUploadService,
        private readonly EntityManagerInterface $entityManager,
    ) {}

    /**
     * GET /api/settings
     * Returns current tenant branding and plan info.
     */
    #[Route('', name: 'settings_get', methods: ['GET'])]
    public function get(): JsonResponse
    {
        $tenant = $this->tenantContext->getTenant();

        return $this->json([
            'id'         => $tenant->getId()->toString(),
            'name'       => $tenant->getName(),
            'slug'       => $tenant->getSlug(),
            'logoUrl'    => $tenant->getLogoUrl(),
            'brandColor' => $tenant->getBrandColor(),
            'plan'       => $tenant->getPlan()->value,
            'planStatus' => $tenant->getPlanStatus()->value,
        ]);
    }

    /**
     * PATCH /api/settings
     * Updates tenant name and/or brand color.
     */
    #[Route('', name: 'settings_update', methods: ['PATCH'])]
    public function update(Request $request): JsonResponse
    {
        $tenant = $this->tenantContext->getTenant();
        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            return $this->json(['error' => 'Corps JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        if (isset($data['name']) && trim((string) $data['name']) !== '') {
            $tenant->setName(trim((string) $data['name']));
        }

        if (isset($data['brandColor'])) {
            $color = trim((string) $data['brandColor']);
            if (!preg_match('/^#[0-9A-Fa-f]{6}$/', $color)) {
                return $this->json(['error' => 'Couleur invalide (format attendu : #RRGGBB).'], Response::HTTP_BAD_REQUEST);
            }
            $tenant->setBrandColor($color);
        }

        $this->entityManager->flush();

        return $this->json([
            'id'         => $tenant->getId()->toString(),
            'name'       => $tenant->getName(),
            'slug'       => $tenant->getSlug(),
            'logoUrl'    => $tenant->getLogoUrl(),
            'brandColor' => $tenant->getBrandColor(),
            'plan'       => $tenant->getPlan()->value,
            'planStatus' => $tenant->getPlanStatus()->value,
        ]);
    }

    /**
     * POST /api/settings/logo
     * Uploads a new logo to S3 and stores the path on the tenant.
     */
    #[Route('/logo', name: 'settings_logo', methods: ['POST'])]
    public function uploadLogo(Request $request): JsonResponse
    {
        $tenant = $this->tenantContext->getTenant();

        $file = $request->files->get('logo');
        if ($file === null) {
            return $this->json(['error' => 'Aucun fichier reçu (champ attendu : logo).'], Response::HTTP_BAD_REQUEST);
        }

        $allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
        if (!in_array($file->getMimeType(), $allowed, true)) {
            return $this->json(['error' => 'Format non supporté. Utilisez JPG, PNG, WebP ou SVG.'], Response::HTTP_BAD_REQUEST);
        }

        $maxSize = 2 * 1024 * 1024; // 2MB
        if ($file->getSize() > $maxSize) {
            return $this->json(['error' => 'Logo trop volumineux. Maximum 2MB.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Delete old logo from S3 if present
        if ($tenant->getLogoUrl() !== null) {
            try {
                $this->fileUploadService->delete($tenant->getLogoUrl());
            } catch (\Throwable) {
                // Non-bloquant si l'ancien fichier n'existe plus
            }
        }

        $path = $this->fileUploadService->upload($file, sprintf('logos/%s', $tenant->getId()->toString()));
        $tenant->setLogoUrl($path);
        $this->entityManager->flush();

        $signedUrl = $this->fileUploadService->getSignedUrl($path, 86400);

        return $this->json(['logoUrl' => $signedUrl]);
    }
}
