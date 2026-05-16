<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Document;
use Dompdf\Dompdf;
use Dompdf\Options;
use Twig\Environment;

class PdfService
{
    public function __construct(
        private readonly Environment $twig,
    ) {}

    public function generateDocumentPdf(
        Document $document,
        string   $tenantName,
        string   $brandColor,
        string   $chantierTitle,
        string   $clientName,
        ?string  $chantierAddress,
    ): string {
        $html = $this->twig->render('pdf/document.html.twig', [
            'document'         => $document,
            'tenant_name'      => $tenantName,
            'brand_color'      => $brandColor,
            'chantier_title'   => $chantierTitle,
            'client_name'      => $clientName,
            'chantier_address' => $chantierAddress,
        ]);

        $options = new Options();
        $options->set('defaultFont', 'DejaVu Sans');
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', false);

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html, 'UTF-8');
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return $dompdf->output();
    }
}
