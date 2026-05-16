<?php

declare(strict_types=1);

namespace App\Command;

use App\Entity\Document;
use App\Repository\ClientTokenRepository;
use App\Repository\DocumentRepository;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Twig\Environment;

#[AsCommand(
    name: 'app:send-document-reminders',
    description: 'Envoie des rappels par email aux clients ayant des documents non signés.',
)]
class SendDocumentRemindersCommand extends Command
{
    public function __construct(
        private readonly DocumentRepository $documentRepository,
        private readonly ClientTokenRepository $clientTokenRepository,
        private readonly MailerInterface $mailer,
        private readonly Environment $twig,
        #[Autowire('%env(FRONTEND_URL)%')]
        private readonly string $frontendUrl,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('days', 'd', InputOption::VALUE_OPTIONAL, 'Rappel après X jours sans signature', 3);
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $days      = (int) $input->getOption('days');
        $threshold = new \DateTimeImmutable("-{$days} days");

        $documents = $this->documentRepository->findUnsignedOlderThan($threshold);

        $sent = 0;
        foreach ($documents as $document) {
            $chantier = $document->getChantier();
            $client   = $chantier->getClient();

            if ($client === null || $client->getEmail() === null) {
                continue;
            }

            // Retrieve the client token for this specific chantier
            $clientToken = $this->clientTokenRepository->findByClientAndChantier($client, $chantier);

            if ($clientToken === null || !$clientToken->isValid()) {
                continue;
            }

            $portalUrl = $this->frontendUrl . '/portal/' . $clientToken->getToken() . '/documents';

            try {
                $html = $this->twig->render('emails/document_reminder.html.twig', [
                    'client_name'    => $client->getName(),
                    'artisan_name'   => $chantier->getTenant()->getName(),
                    'document_label' => $document->getLabel(),
                    'chantier_title' => $chantier->getTitle(),
                    'portal_url'     => $portalUrl,
                ]);

                $mail = (new Email())
                    ->from('noreply@artisan-portal.fr')
                    ->to($client->getEmail())
                    ->subject('Document en attente de signature — ' . $document->getLabel())
                    ->html($html);

                $this->mailer->send($mail);
                $sent++;
            } catch (\Throwable $e) {
                $output->writeln('<error>Erreur: ' . $e->getMessage() . '</error>');
            }
        }

        $output->writeln("<info>$sent rappel(s) envoyé(s).</info>");
        return Command::SUCCESS;
    }
}
