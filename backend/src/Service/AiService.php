<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Chantier;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class AiService
{
    private const MODEL = 'claude-opus-4-7';
    private const API_URL = 'https://api.anthropic.com/v1/messages';

    public function __construct(
        private readonly HttpClientInterface $httpClient,
        #[Autowire('%env(ANTHROPIC_API_KEY)%')]
        private readonly string $anthropicApiKey,
    ) {}

    public function generateDevis(Chantier $chantier): string
    {
        $jalons = [];
        foreach ($chantier->getJalons() as $j) {
            $jalons[] = '- ' . $j->getTitle() . ($j->getDate() ? ' (' . $j->getDate()->format('d/m/Y') . ')' : '');
        }

        $prompt = sprintf(
            "Tu es un assistant pour artisans français. Génère un devis professionnel en français pour le chantier suivant.\n\n" .
            "Artisan : %s\n" .
            "Titre du chantier : %s\n" .
            "Description : %s\n" .
            "Adresse : %s\n" .
            "Jalons prévus :\n%s\n\n" .
            "Génère un devis structuré avec : description des travaux, liste des postes avec prix estimatifs, " .
            "conditions de paiement (30%% à la commande, 70%% à la livraison), et mentions légales obligatoires. " .
            "Format Markdown. Sois concis et professionnel.",
            $chantier->getTenant()->getName(),
            $chantier->getTitle(),
            $chantier->getDescription() ?? 'Non précisée',
            $chantier->getAddress() ?? 'Non précisée',
            implode("\n", $jalons) ?: '- Aucun jalon défini',
        );

        $response = $this->httpClient->request('POST', self::API_URL, [
            'headers' => [
                'x-api-key'         => $this->anthropicApiKey,
                'anthropic-version' => '2023-06-01',
                'content-type'      => 'application/json',
            ],
            'json' => [
                'model'      => self::MODEL,
                'max_tokens' => 2048,
                'messages'   => [
                    ['role' => 'user', 'content' => $prompt],
                ],
            ],
            'timeout' => 30,
        ]);

        $data = $response->toArray();
        return $data['content'][0]['text'] ?? '';
    }
}
