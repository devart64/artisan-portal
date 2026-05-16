<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Chantier;
use App\Entity\Client;
use App\Entity\Document;
use App\Entity\Notification;
use App\Entity\Tenant;
use App\Entity\User;
use App\Repository\ClientTokenRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;
use Twig\Environment;

class NotificationService
{
    public function __construct(
        private readonly MailerInterface $mailer,
        private readonly Environment $twig,
        private readonly MagicLinkService $magicLinkService,
        private readonly ClientTokenRepository $clientTokenRepository,
        private readonly EntityManagerInterface $em,
        private readonly string $twilioAccountSid,
        private readonly string $twilioAuthToken,
        private readonly string $twilioPhoneNumber,
    ) {}

    /**
     * Notify a client that a new document has been uploaded to their chantier.
     */
    public function notifyClientNewDocument(Client $client, Chantier $chantier, Document $document): void
    {
        if ($client->getEmail() !== null) {
            $this->sendNewDocumentEmail($client, $chantier, $document);
        }

        if ($client->getPhone() !== null && $chantier->getTenant()->getPlan()->allowsSms()) {
            $this->sendSms(
                $client->getPhone(),
                sprintf(
                    '[%s] Nouveau document disponible sur votre chantier "%s" : %s. Consultez votre portail.',
                    $chantier->getTenant()->getName(),
                    $chantier->getTitle(),
                    $document->getLabel()
                )
            );
        }
    }

    /**
     * Notify a client that the status of their chantier has changed.
     */
    public function notifyClientStatusChanged(Client $client, Chantier $chantier): void
    {
        if ($client->getEmail() !== null) {
            $portalUrl = $this->getClientPortalUrl($client, $chantier);

            $htmlContent = $this->twig->render('emails/magic_link.html.twig', [
                'client'     => $client,
                'chantier'   => $chantier,
                'tenant'     => $chantier->getTenant(),
                'portal_url' => $portalUrl,
                'subject'    => 'Mise à jour de votre chantier',
                'custom_message' => sprintf(
                    'Le statut de votre chantier "%s" a été mis à jour : %s.',
                    $chantier->getTitle(),
                    $chantier->getStatus()->label()
                ),
            ]);

            $email = (new Email())
                ->from(new Address('noreply@artisan-portal.fr', $chantier->getTenant()->getName()))
                ->to(new Address($client->getEmail(), $client->getName()))
                ->subject(sprintf('Mise à jour de votre chantier : %s', $chantier->getTitle()))
                ->html($htmlContent);

            $this->mailer->send($email);
        }

        if ($client->getPhone() !== null && $chantier->getTenant()->getPlan()->allowsSms()) {
            $this->sendSms(
                $client->getPhone(),
                sprintf(
                    '[%s] Le statut de votre chantier "%s" est maintenant : %s.',
                    $chantier->getTenant()->getName(),
                    $chantier->getTitle(),
                    $chantier->getStatus()->label()
                )
            );
        }
    }

    /**
     * Notify a client that the artisan has sent a new message.
     */
    public function notifyClientNewMessageFromArtisan(Client $client, Chantier $chantier): void
    {
        if ($client->getEmail() !== null) {
            $portalUrl = $this->getClientPortalUrl($client, $chantier);

            $htmlContent = $this->twig->render('emails/magic_link.html.twig', [
                'client'         => $client,
                'chantier'       => $chantier,
                'tenant'         => $chantier->getTenant(),
                'portal_url'     => $portalUrl,
                'subject'        => 'Nouveau message de votre artisan',
                'custom_message' => sprintf(
                    'Vous avez reçu un nouveau message concernant votre chantier "%s".',
                    $chantier->getTitle()
                ),
            ]);

            $email = (new Email())
                ->from(new Address('noreply@artisan-portal.fr', $chantier->getTenant()->getName()))
                ->to(new Address($client->getEmail(), $client->getName()))
                ->subject(sprintf('Nouveau message concernant : %s', $chantier->getTitle()))
                ->html($htmlContent);

            $this->mailer->send($email);
        }

        if ($client->getPhone() !== null && $chantier->getTenant()->getPlan()->allowsSms()) {
            $this->sendSms(
                $client->getPhone(),
                sprintf(
                    '[%s] Nouveau message de votre artisan concernant "%s". Connectez-vous à votre portail.',
                    $chantier->getTenant()->getName(),
                    $chantier->getTitle()
                )
            );
        }
    }

    /**
     * Notify an artisan that a client has sent a new message.
     */
    public function notifyArtisanNewMessageFromClient(User $artisan, Chantier $chantier): void
    {
        $htmlContent = sprintf(
            '<p>Un client a envoyé un nouveau message concernant le chantier <strong>%s</strong>.</p>
             <p>Connectez-vous à votre portail artisan pour répondre.</p>',
            htmlspecialchars($chantier->getTitle())
        );

        $email = (new Email())
            ->from(new Address('noreply@artisan-portal.fr', 'Artisan Portal'))
            ->to(new Address($artisan->getEmail()))
            ->subject(sprintf('[Action requise] Nouveau message client - %s', $chantier->getTitle()))
            ->html($htmlContent);

        $this->mailer->send($email);
    }

    /**
     * Notify artisan users of the tenant that a document has been electronically signed.
     */
    public function notifyDocumentSigned(
        Document $document,
        Chantier $chantier,
        string $signerName,
    ): void {
        $tenant = $chantier->getTenant();
        try {
            $htmlContent = $this->twig->render('emails/document_signed.html.twig', [
                'document_label' => $document->getLabel(),
                'signer_name'    => $signerName,
                'signed_at'      => (new \DateTimeImmutable())->format('d/m/Y à H:i'),
                'chantier_title' => $chantier->getTitle(),
            ]);

            $users = $this->em->getRepository(User::class)->findBy(['tenant' => $tenant]);
            foreach ($users as $user) {
                $email = (new Email())
                    ->from(new Address('noreply@artisan-portal.fr', 'Artisan Portal'))
                    ->to(new Address($user->getEmail()))
                    ->subject("✅ {$document->getLabel()} a été signé par {$signerName}")
                    ->html($htmlContent);

                $this->mailer->send($email);
            }
        } catch (\Throwable) {
            // Ne pas bloquer si l'email échoue
        }

        $this->create(
            $chantier->getTenant(),
            'document_signed',
            'Document signé : ' . $document->getLabel(),
            $document->getSignerName() . ' a signé le document.',
            '/chantiers/' . $document->getChantier()->getId()->toString() . '/documents',
        );
    }

    public function create(
        Tenant  $tenant,
        string  $type,
        string  $title,
        ?string $body = null,
        ?string $url  = null,
    ): void {
        $notification = new Notification();
        $notification->setTenant($tenant);
        $notification->setType($type);
        $notification->setTitle($title);
        $notification->setBody($body);
        $notification->setUrl($url);
        $this->em->persist($notification);
        $this->em->flush();
    }

    private function sendNewDocumentEmail(Client $client, Chantier $chantier, Document $document): void
    {
        $portalUrl = $this->getClientPortalUrl($client, $chantier);

        $htmlContent = $this->twig->render('emails/new_document.html.twig', [
            'client'     => $client,
            'chantier'   => $chantier,
            'tenant'     => $chantier->getTenant(),
            'document'   => $document,
            'portal_url' => $portalUrl,
        ]);

        $email = (new Email())
            ->from(new Address('noreply@artisan-portal.fr', $chantier->getTenant()->getName()))
            ->to(new Address($client->getEmail(), $client->getName()))
            ->subject(sprintf('Nouveau document disponible - %s', $chantier->getTitle()))
            ->html($htmlContent);

        $this->mailer->send($email);
    }

    private function getClientPortalUrl(Client $client, Chantier $chantier): string
    {
        $token = $this->clientTokenRepository->findByClientAndChantier($client, $chantier);
        if ($token !== null && $token->isValid()) {
            return $this->magicLinkService->generateTokenUrl($token->getToken());
        }

        // No valid token — return a generic portal URL
        return $this->magicLinkService->generateTokenUrl('');
    }

    private function sendSms(string $phone, string $message): void
    {
        if (empty($this->twilioAccountSid) || empty($this->twilioAuthToken) || empty($this->twilioPhoneNumber)) {
            // Twilio not configured — skip SMS silently
            return;
        }

        $client = new \Twilio\Rest\Client($this->twilioAccountSid, $this->twilioAuthToken);
        $client->messages->create($phone, [
            'from' => $this->twilioPhoneNumber,
            'body' => $message,
        ]);
    }
}
