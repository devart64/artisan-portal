<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Chantier;
use App\Entity\Document;
use App\Entity\Photo;
use App\Enum\DocumentStatusEnum;
use App\Enum\DocumentTypeEnum;
use App\Repository\ChantierRepository;
use App\Repository\DocumentRepository;
use App\Repository\PhotoRepository;
use App\Service\FileUploadService;
use App\Service\NotificationService;
use App\Service\PdfService;
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
class DocumentController extends AbstractController
{
    public function __construct(
        private readonly TenantContext $tenantContext,
        private readonly ChantierRepository $chantierRepository,
        private readonly DocumentRepository $documentRepository,
        private readonly PhotoRepository $photoRepository,
        private readonly FileUploadService $fileUploadService,
        private readonly NotificationService $notificationService,
        private readonly EntityManagerInterface $entityManager,
    ) {}

    /**
     * POST /api/chantiers/{id}/documents
     * Upload a document for a specific chantier.
     */
    #[Route('/chantiers/{id}/documents', name: 'document_upload', methods: ['POST'])]
    public function uploadDocument(string $id, Request $request): JsonResponse
    {
        $tenant = $this->tenantContext->getTenant();
        $chantier = $this->findChantierOrFail($id, $tenant);

        if ($chantier === null) {
            return $this->json(['error' => 'Chantier not found.'], Response::HTTP_NOT_FOUND);
        }

        $this->denyAccessUnlessGranted('view', $chantier);

        $uploadedFile = $request->files->get('file');
        if ($uploadedFile === null) {
            return $this->json(['error' => 'No file uploaded.'], Response::HTTP_BAD_REQUEST);
        }

        $allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!in_array($uploadedFile->getMimeType(), $allowedMimes, true)) {
            return $this->json(['error' => 'Type de fichier non autorisé. Formats acceptés : PDF, JPG, PNG, WEBP, DOC, DOCX.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
        $maxSize = 20 * 1024 * 1024; // 20MB
        if ($uploadedFile->getSize() > $maxSize) {
            return $this->json(['error' => 'Fichier trop volumineux. Maximum 20MB.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $label = $request->request->get('label');
        $typeValue = $request->request->get('type', DocumentTypeEnum::AUTRE->value);

        if (empty($label)) {
            return $this->json(['error' => 'Document label is required.'], Response::HTTP_BAD_REQUEST);
        }

        $type = DocumentTypeEnum::tryFrom($typeValue);
        if ($type === null) {
            return $this->json(['error' => 'Invalid document type.'], Response::HTTP_BAD_REQUEST);
        }

        $filePath = $this->fileUploadService->upload($uploadedFile, sprintf('documents/%s', $chantier->getId()->toString()));

        $document = new Document();
        $document->setChantier($chantier);
        $document->setType($type);
        $document->setLabel($label);
        $document->setFilePath($filePath);

        $this->entityManager->persist($document);
        $this->entityManager->flush();

        // Notify client if any (non-blocking)
        if ($chantier->getClient() !== null) {
            try {
                $this->notificationService->notifyClientNewDocument($chantier->getClient(), $chantier, $document);
            } catch (\Throwable) {
                // Non-blocking
            }
        }

        return $this->json([
            'id'        => $document->getId()->toString(),
            'label'     => $document->getLabel(),
            'type'      => $document->getType()->value,
            'typeLabel' => $document->getType()->label(),
            'status'    => $document->getStatus()?->value,
            'createdAt' => $document->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ], Response::HTTP_CREATED);
    }

    /**
     * GET /api/documents
     * List the tenant's most recent documents (used by the dashboard).
     */
    #[Route('/documents', name: 'document_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $tenant = $this->tenantContext->getTenant();

        $limit = (int) $request->query->get('limit', 5);
        $limit = max(1, min($limit, 50));

        $documents = $this->documentRepository->findRecentForTenant($tenant, $limit);

        $data = array_map(fn (Document $document) => [
            'id'         => $document->getId()->toString(),
            'label'      => $document->getLabel(),
            'type'       => $document->getType()->value,
            'typeLabel'  => $document->getType()->label(),
            'status'     => $document->getStatus()?->value,
            'createdAt'  => $document->getCreatedAt()->format(\DateTimeInterface::ATOM),
            'chantierId' => $document->getChantier()->getId()->toString(),
        ], $documents);

        return $this->json($data);
    }

    /**
     * GET /api/documents/{id}/download
     * Get a pre-signed S3 URL for downloading the document.
     */
    #[Route('/documents/{id}/download', name: 'document_download', methods: ['GET'])]
    public function download(string $id): JsonResponse
    {
        $tenant = $this->tenantContext->getTenant();
        $document = $this->documentRepository->find($id);

        if ($document === null || $document->getChantier()->getTenant()->getId()->toString() !== $tenant->getId()->toString()) {
            return $this->json(['error' => 'Document not found.'], Response::HTTP_NOT_FOUND);
        }

        $this->denyAccessUnlessGranted('view', $document);

        $signedUrl = $this->fileUploadService->getSignedUrl($document->getFilePath(), 3600);

        return $this->json(['url' => $signedUrl, 'expiresInSeconds' => 3600]);
    }

    /**
     * PATCH /api/documents/{id}
     * Update the status of a document.
     */
    #[Route('/documents/{id}', name: 'document_update', methods: ['PATCH'])]
    public function update(string $id, Request $request): JsonResponse
    {
        $tenant = $this->tenantContext->getTenant();
        $document = $this->documentRepository->find($id);

        if ($document === null || $document->getChantier()->getTenant()->getId()->toString() !== $tenant->getId()->toString()) {
            return $this->json(['error' => 'Document not found.'], Response::HTTP_NOT_FOUND);
        }

        $this->denyAccessUnlessGranted('edit', $document);

        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            return $this->json(['error' => 'Invalid JSON body.'], Response::HTTP_BAD_REQUEST);
        }

        if (isset($data['status'])) {
            $status = DocumentStatusEnum::tryFrom($data['status']);
            if ($status === null && $data['status'] !== null) {
                return $this->json(['error' => 'Invalid document status.'], Response::HTTP_BAD_REQUEST);
            }
            $document->setStatus($status);
        }

        if (isset($data['label'])) {
            $document->setLabel((string) $data['label']);
        }

        $this->entityManager->flush();

        return $this->json([
            'id'        => $document->getId()->toString(),
            'label'     => $document->getLabel(),
            'type'      => $document->getType()->value,
            'typeLabel' => $document->getType()->label(),
            'status'    => $document->getStatus()?->value,
            'createdAt' => $document->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ]);
    }

    /**
     * POST /api/chantiers/{id}/photos
     * Upload a photo for a chantier.
     */
    #[Route('/chantiers/{id}/photos', name: 'photo_upload', methods: ['POST'])]
    public function uploadPhoto(string $id, Request $request): JsonResponse
    {
        $tenant = $this->tenantContext->getTenant();
        $chantier = $this->findChantierOrFail($id, $tenant);

        if ($chantier === null) {
            return $this->json(['error' => 'Chantier not found.'], Response::HTTP_NOT_FOUND);
        }

        $this->denyAccessUnlessGranted('view', $chantier);

        $uploadedFile = $request->files->get('file');
        if ($uploadedFile === null) {
            return $this->json(['error' => 'No file uploaded.'], Response::HTTP_BAD_REQUEST);
        }

        $allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
        if (!in_array($uploadedFile->getMimeType(), $allowedMimes, true)) {
            return $this->json(['error' => 'Format image non autorisé. Formats acceptés : JPG, PNG, WEBP, HEIC.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
        $maxSize = 10 * 1024 * 1024; // 10MB
        if ($uploadedFile->getSize() > $maxSize) {
            return $this->json(['error' => 'Image trop volumineuse. Maximum 10MB.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $caption = $request->request->get('caption');

        $filePath = $this->fileUploadService->upload($uploadedFile, sprintf('photos/%s', $chantier->getId()->toString()));

        $photo = new Photo();
        $photo->setChantier($chantier);
        $photo->setFilePath($filePath);
        $photo->setCaption($caption ?: null);

        $this->entityManager->persist($photo);
        $this->entityManager->flush();

        return $this->json([
            'id'         => $photo->getId()->toString(),
            'caption'    => $photo->getCaption(),
            'uploadedAt' => $photo->getUploadedAt()->format(\DateTimeInterface::ATOM),
        ], Response::HTTP_CREATED);
    }

    /**
     * GET /api/chantiers/{id}/photos
     * List all photos for a chantier with pre-signed URLs.
     */
    #[Route('/chantiers/{id}/photos', name: 'photo_list', methods: ['GET'])]
    public function listPhotos(string $id): JsonResponse
    {
        $tenant = $this->tenantContext->getTenant();
        $chantier = $this->findChantierOrFail($id, $tenant);

        if ($chantier === null) {
            return $this->json(['error' => 'Chantier not found.'], Response::HTTP_NOT_FOUND);
        }

        $this->denyAccessUnlessGranted('view', $chantier);

        $photos = $this->photoRepository->findByChantier($chantier);

        $data = array_map(fn ($photo) => [
            'id'         => $photo->getId()->toString(),
            'caption'    => $photo->getCaption(),
            'signedUrl'  => $this->fileUploadService->getSignedUrl($photo->getFilePath(), 3600),
            'uploadedAt' => $photo->getUploadedAt()->format(\DateTimeInterface::ATOM),
        ], $photos);

        return $this->json($data);
    }

    /**
     * GET /api/documents/{id}/pdf
     * Generate a PDF for the document and return it as a binary download.
     */
    #[Route('/documents/{id}/pdf', name: 'document_pdf', methods: ['GET'])]
    public function pdf(string $id, PdfService $pdfService): Response
    {
        $tenant = $this->tenantContext->getTenant();
        $document = $this->documentRepository->find($id);

        if ($document === null || $document->getChantier()->getTenant()->getId()->toString() !== $tenant->getId()->toString()) {
            return $this->json(['error' => 'Document introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $this->denyAccessUnlessGranted('view', $document);

        $chantier = $document->getChantier();

        $pdfContent = $pdfService->generateDocumentPdf(
            document:        $document,
            tenantName:      $tenant->getName(),
            brandColor:      $tenant->getBrandColor(),
            chantierTitle:   $chantier->getTitle(),
            clientName:      $chantier->getClient()?->getName() ?? '',
            chantierAddress: $chantier->getAddress(),
        );

        return new Response(
            $pdfContent,
            Response::HTTP_OK,
            [
                'Content-Type'        => 'application/pdf',
                'Content-Disposition' => sprintf('attachment; filename="%s.pdf"', urlencode($document->getLabel())),
            ]
        );
    }

    private function findChantierOrFail(string $id, \App\Entity\Tenant $tenant): ?Chantier
    {
        $chantier = $this->chantierRepository->find($id);

        if ($chantier === null || $chantier->getTenant()->getId()->toString() !== $tenant->getId()->toString()) {
            return null;
        }

        return $chantier;
    }
}
