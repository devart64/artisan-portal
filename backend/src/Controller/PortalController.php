<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Document;
use App\Entity\Message;
use App\Entity\User;
use App\Enum\DocumentStatusEnum;
use App\Repository\ClientTokenRepository;
use App\Repository\DocumentRepository;
use App\Repository\JalonRepository;
use App\Repository\MessageRepository;
use App\Repository\PhotoRepository;
use App\Security\ClientUser;
use App\Service\AuditService;
use App\Service\FileUploadService;
use App\Service\NotificationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/portal')]
class PortalController extends AbstractController
{
    public function __construct(
        private readonly ClientTokenRepository $clientTokenRepository,
        private readonly DocumentRepository $documentRepository,
        private readonly JalonRepository $jalonRepository,
        private readonly MessageRepository $messageRepository,
        private readonly PhotoRepository $photoRepository,
        private readonly FileUploadService $fileUploadService,
        private readonly NotificationService $notificationService,
        private readonly EntityManagerInterface $entityManager,
        private readonly AuditService $auditService,
    ) {}

    /**
     * GET /api/portal/{token}
     * Returns chantier summary and tenant branding for the client portal.
     */
    #[Route('/{token}', name: 'portal_summary', methods: ['GET'])]
    public function summary(string $token, #[CurrentUser] ClientUser $clientUser): JsonResponse
    {
        $chantier = $clientUser->getChantier();
        $tenant = $clientUser->getTenant();
        $client = $clientUser->getClient();

        return $this->json([
            'tenant'   => [
                'name'       => $tenant->getName(),
                'logoUrl'    => $tenant->getLogoUrl(),
                'brandColor' => $tenant->getBrandColor(),
            ],
            'client'   => [
                'id'   => $client->getId()->toString(),
                'name' => $client->getName(),
            ],
            'chantier' => [
                'id'          => $chantier->getId()->toString(),
                'title'       => $chantier->getTitle(),
                'description' => $chantier->getDescription(),
                'status'      => $chantier->getStatus()->value,
                'statusLabel' => $chantier->getStatus()->label(),
                'address'     => $chantier->getAddress(),
                'startDate'   => $chantier->getStartDate()?->format(\DateTimeInterface::ATOM),
                'endDate'     => $chantier->getEndDate()?->format(\DateTimeInterface::ATOM),
            ],
        ]);
    }

    /**
     * GET /api/portal/{token}/documents
     * Returns the list of documents for the chantier.
     */
    #[Route('/{token}/documents', name: 'portal_documents', methods: ['GET'])]
    public function documents(string $token, #[CurrentUser] ClientUser $clientUser): JsonResponse
    {
        $chantier = $clientUser->getChantier();
        $documents = $this->documentRepository->findByChantier($chantier);

        $data = array_map(fn ($doc) => [
            'id'        => $doc->getId()->toString(),
            'label'     => $doc->getLabel(),
            'type'      => $doc->getType()->value,
            'typeLabel' => $doc->getType()->label(),
            'status'    => $doc->getStatus()?->value,
            'createdAt' => $doc->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ], $documents);

        return $this->json($data);
    }

    /**
     * GET /api/portal/{token}/documents/{docId}/download
     * Returns a pre-signed S3 URL for the document download.
     */
    #[Route('/{token}/documents/{docId}/download', name: 'portal_document_download', methods: ['GET'])]
    public function documentDownload(string $token, string $docId, #[CurrentUser] ClientUser $clientUser): JsonResponse
    {
        $chantier = $clientUser->getChantier();
        $documents = $this->documentRepository->findByChantier($chantier);

        $document = null;
        foreach ($documents as $doc) {
            if ($doc->getId()->toString() === $docId) {
                $document = $doc;
                break;
            }
        }

        if ($document === null) {
            return $this->json(['error' => 'Document not found.'], Response::HTTP_NOT_FOUND);
        }

        $signedUrl = $this->fileUploadService->getSignedUrl($document->getFilePath(), 3600);

        return $this->json(['url' => $signedUrl, 'expiresInSeconds' => 3600]);
    }

    /**
     * GET /api/portal/{token}/photos
     * Returns the list of photos for the chantier.
     */
    #[Route('/{token}/photos', name: 'portal_photos', methods: ['GET'])]
    public function photos(string $token, #[CurrentUser] ClientUser $clientUser): JsonResponse
    {
        $chantier = $clientUser->getChantier();
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
     * GET /api/portal/{token}/planning
     * Returns the list of jalons (milestones) for the chantier.
     */
    #[Route('/{token}/planning', name: 'portal_planning', methods: ['GET'])]
    public function planning(string $token, #[CurrentUser] ClientUser $clientUser): JsonResponse
    {
        $chantier = $clientUser->getChantier();
        $jalons = $this->jalonRepository->findByChantier($chantier);

        $data = array_map(fn ($jalon) => [
            'id'        => $jalon->getId()->toString(),
            'title'     => $jalon->getTitle(),
            'date'      => $jalon->getDate()?->format(\DateTimeInterface::ATOM),
            'done'      => $jalon->isDone(),
            'createdAt' => $jalon->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ], $jalons);

        return $this->json($data);
    }

    /**
     * GET /api/portal/{token}/messages
     * Returns the list of messages for the chantier.
     */
    #[Route('/{token}/messages', name: 'portal_messages_list', methods: ['GET'])]
    public function messages(string $token, #[CurrentUser] ClientUser $clientUser): JsonResponse
    {
        $chantier = $clientUser->getChantier();
        $messages = $this->messageRepository->findByChantier($chantier);

        $data = array_map(fn ($msg) => [
            'id'         => $msg->getId()->toString(),
            'senderType' => $msg->getSenderType(),
            'senderName' => $msg->getSenderName(),
            'content'    => $msg->getContent(),
            'read'       => $msg->isRead(),
            'createdAt'  => $msg->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ], $messages);

        return $this->json($data);
    }

    /**
     * POST /api/portal/{token}/messages
     * Client sends a message to the artisan.
     */
    #[Route('/{token}/messages', name: 'portal_messages_create', methods: ['POST'])]
    public function createMessage(string $token, Request $request, #[CurrentUser] ClientUser $clientUser): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!is_array($data) || empty($data['content'])) {
            return $this->json(['error' => 'Message content is required.'], Response::HTTP_BAD_REQUEST);
        }

        $content = trim((string) $data['content']);
        if (empty($content)) {
            return $this->json(['error' => 'Message content cannot be empty.'], Response::HTTP_BAD_REQUEST);
        }

        if (strlen($content) > 5000) {
            return $this->json(['error' => 'Message trop long (max 5000 caractères).'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $chantier = $clientUser->getChantier();
        $client = $clientUser->getClient();

        $message = new Message();
        $message->setChantier($chantier);
        $message->setSenderType('client');
        $message->setSenderName($client->getName());
        $message->setContent($content);

        $this->entityManager->persist($message);
        $this->entityManager->flush();

        // Notify the artisan (non-blocking)
        try {
            // We need an artisan user to notify — find the first admin of the tenant
            $artisanUsers = $this->entityManager->getRepository(\App\Entity\User::class)
                ->findBy(['tenant' => $clientUser->getTenant()]);

            foreach ($artisanUsers as $artisan) {
                $this->notificationService->notifyArtisanNewMessageFromClient($artisan, $chantier);
                break; // Notify only the first admin
            }
        } catch (\Throwable) {
            // Non-blocking
        }

        return $this->json([
            'id'         => $message->getId()->toString(),
            'senderType' => $message->getSenderType(),
            'senderName' => $message->getSenderName(),
            'content'    => $message->getContent(),
            'read'       => $message->isRead(),
            'createdAt'  => $message->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ], Response::HTTP_CREATED);
    }

    /**
     * POST /api/portal/{token}/documents/{documentId}/sign
     * Client signs a document electronically.
     */
    #[Route('/{token}/documents/{documentId}/sign', name: 'portal_document_sign', methods: ['POST'])]
    public function signDocument(
        string $token,
        string $documentId,
        Request $request,
        #[CurrentUser] ClientUser $clientUser,
    ): JsonResponse {
        $chantier = $clientUser->getChantier();

        $document = $this->entityManager->find(Document::class, $documentId);
        if (!$document || $document->getChantier()->getId() !== $chantier->getId()) {
            return $this->json(['error' => 'Document introuvable'], Response::HTTP_NOT_FOUND);
        }

        if ($document->getStatus() === DocumentStatusEnum::Signe) {
            return $this->json(['error' => 'Document déjà signé'], Response::HTTP_CONFLICT);
        }

        $data          = json_decode($request->getContent(), true);
        $signerName    = trim($data['signerName'] ?? '');
        $signatureData = $data['signatureData'] ?? ''; // base64 PNG

        if (!$signerName || !$signatureData) {
            return $this->json(['error' => 'Nom du signataire et signature requis'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if (strlen($signatureData) > 500_000) {
            return $this->json(['error' => 'Données de signature trop volumineuses.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Stocker l'image de signature sur S3
        if (str_starts_with($signatureData, 'data:image/png;base64,')) {
            $signatureData = substr($signatureData, strlen('data:image/png;base64,'));
        }
        $pngData = base64_decode($signatureData);
        if ($pngData) {
            $tmpFile = tempnam(sys_get_temp_dir(), 'sig_') . '.png';
            try {
                file_put_contents($tmpFile, $pngData);
                $uploaded = new UploadedFile(
                    $tmpFile, 'signature.png', 'image/png', null, true
                );
                $this->fileUploadService->upload($uploaded, "signatures/{$documentId}");
            } finally {
                if (isset($tmpFile) && file_exists($tmpFile)) {
                    @unlink($tmpFile);
                }
            }
        }

        // Mettre à jour le document
        $document->setStatus(DocumentStatusEnum::Signe);
        $document->setSignedAt(new \DateTimeImmutable());
        $document->setSignerName($signerName);
        $document->setSignerIp($request->getClientIp() ?? '');
        $this->entityManager->flush();

        // Audit log
        $signerIp = $request->getClientIp() ?? '';
        $this->auditService->log(
            $document->getChantier()->getTenant(),
            'document.signed',
            'document',
            $document->getId()->toString(),
            ['signer_name' => $signerName, 'signer_ip' => $signerIp],
        );

        // Notifier l'artisan
        $this->notificationService->notifyDocumentSigned($document, $chantier, $signerName);

        return $this->json([
            'id'         => $document->getId()->toString(),
            'status'     => $document->getStatus()->value,
            'signedAt'   => $document->getSignedAt()?->format(\DateTimeInterface::ATOM),
            'signerName' => $document->getSignerName(),
        ]);
    }
}
