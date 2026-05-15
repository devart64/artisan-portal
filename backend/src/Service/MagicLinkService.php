<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Chantier;
use App\Entity\Client;
use App\Entity\ClientToken;
use App\Repository\ClientTokenRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;
use Twig\Environment;

class MagicLinkService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly ClientTokenRepository $clientTokenRepository,
        private readonly MailerInterface $mailer,
        private readonly Environment $twig,
        private readonly string $frontendUrl,
    ) {}

    /**
     * Generate a ClientToken and send a magic link email to the client.
     */
    public function sendMagicLink(Client $client, Chantier $chantier): void
    {
        if ($client->getEmail() === null) {
            throw new \InvalidArgumentException('Cannot send magic link: client has no email address.');
        }

        // Invalidate existing token for this client/chantier pair if one exists
        $existingToken = $this->clientTokenRepository->findByClientAndChantier($client, $chantier);
        if ($existingToken !== null) {
            $this->entityManager->remove($existingToken);
            $this->entityManager->flush();
        }

        // Create a new token
        $clientToken = new ClientToken();
        $clientToken->setClient($client);
        $clientToken->setChantier($chantier);

        $this->entityManager->persist($clientToken);
        $this->entityManager->flush();

        $portalUrl = $this->generateTokenUrl($clientToken->getToken());
        $artisan = $chantier->getTenant();

        $htmlContent = $this->twig->render('emails/magic_link.html.twig', [
            'client'      => $client,
            'chantier'    => $chantier,
            'tenant'      => $artisan,
            'portal_url'  => $portalUrl,
            'expires_at'  => $clientToken->getExpiresAt(),
        ]);

        $email = (new Email())
            ->from(new Address('noreply@artisan-portal.fr', $artisan->getName()))
            ->to(new Address($client->getEmail(), $client->getName()))
            ->subject(sprintf('Accédez à votre chantier : %s', $chantier->getTitle()))
            ->html($htmlContent);

        $this->mailer->send($email);
    }

    /**
     * Generate the portal URL for a given token.
     */
    public function generateTokenUrl(string $token): string
    {
        return rtrim($this->frontendUrl, '/') . '/portal/' . $token;
    }
}
