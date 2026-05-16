<?php

declare(strict_types=1);

namespace App\Controller;

use App\Repository\ChantierRepository;
use App\Service\TenantContext;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api')]
#[IsGranted('ROLE_USER')]
class IcsController extends AbstractController
{
    public function __construct(
        private readonly ChantierRepository $chantierRepository,
        private readonly TenantContext $tenantContext,
    ) {}

    #[Route('/chantiers/{id}/jalons.ics', name: 'jalon_ics', methods: ['GET'])]
    public function chantierIcs(string $id): Response
    {
        $tenant   = $this->tenantContext->getTenant();
        $chantier = $this->chantierRepository->find($id);

        if ($chantier === null || !$chantier->getTenant()->getId()->equals($tenant->getId())) {
            return new Response('Not found', Response::HTTP_NOT_FOUND);
        }

        $lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Artisan Portal//FR',
            'CALSCALE:GREGORIAN',
            'X-WR-CALNAME:' . $this->escapeIcs($chantier->getTitle()),
            'X-WR-TIMEZONE:Europe/Paris',
        ];

        foreach ($chantier->getJalons() as $jalon) {
            if ($jalon->getDate() === null) {
                continue;
            }
            $stamp = (new \DateTimeImmutable())->format('Ymd\THis\Z');
            $date  = $jalon->getDate()->format('Ymd');
            $uid   = $jalon->getId()->toString() . '@artisan-portal.fr';

            $lines[] = 'BEGIN:VEVENT';
            $lines[] = 'UID:' . $uid;
            $lines[] = 'DTSTAMP:' . $stamp;
            $lines[] = 'DTSTART;VALUE=DATE:' . $date;
            $lines[] = 'DTEND;VALUE=DATE:' . $date;
            $lines[] = 'SUMMARY:' . $this->escapeIcs($jalon->getTitle());
            $lines[] = 'DESCRIPTION:' . $this->escapeIcs($chantier->getTitle() . ' — ' . ($jalon->isDone() ? '✓ Terminé' : 'En cours'));
            $lines[] = 'STATUS:' . ($jalon->isDone() ? 'COMPLETED' : 'CONFIRMED');
            $lines[] = 'END:VEVENT';
        }

        $lines[] = 'END:VCALENDAR';

        $ics = implode("\r\n", $lines) . "\r\n";

        return new Response($ics, Response::HTTP_OK, [
            'Content-Type'        => 'text/calendar; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="chantier-' . $chantier->getId()->toString() . '.ics"',
        ]);
    }

    private function escapeIcs(string $text): string
    {
        return str_replace([',', ';', '\\', "\n"], ['\\,', '\\;', '\\\\', '\\n'], $text);
    }
}
