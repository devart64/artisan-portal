<?php
declare(strict_types=1);
namespace App\Controller;

use App\Enum\LeadStatusEnum;
use App\Repository\LeadRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/webhooks/lead')]
class WebhookLeadController extends AbstractController
{
    public function __construct(
        private LeadRepository $leads,
        private EntityManagerInterface $em,
        #[Autowire('%env(FRONTEND_URL)%')]
        private string $frontendUrl,
    ) {}

    #[Route('/interested/{id}', methods: ['GET'])]
    public function interested(string $id): Response
    {
        $lead = $this->leads->find($id);
        if ($lead && $lead->getStatus() !== LeadStatusEnum::Converted && $lead->getStatus() !== LeadStatusEnum::Lost) {
            $lead->setStatus(LeadStatusEnum::Replied);
            $lead->setLastContactedAt(new \DateTimeImmutable());
            $this->em->flush();
        }

        // Redirige vers la page d'inscription avec un paramètre UTM
        return $this->redirect("{$this->frontendUrl}/register?utm_source=email&utm_campaign=agents_ia&ref={$id}");
    }

    #[Route('/unsubscribe/{id}', methods: ['GET'])]
    public function unsubscribe(string $id): Response
    {
        $lead = $this->leads->find($id);
        if ($lead) {
            $lead->setStatus(LeadStatusEnum::Lost);
            $lead->setNotes(($lead->getNotes() ?? '') . ' | Désinscrit le ' . date('d/m/Y'));
            $this->em->flush();
        }

        return new Response(
            <<<'HTML'
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Désinscription confirmée — Artisan Portal</title>
                <style>
                    body { font-family: Inter, Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; color: #1e293b; }
                    .card { background: white; border-radius: 12px; padding: 48px; max-width: 480px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                    h1 { font-size: 1.5rem; margin-bottom: 8px; }
                    p { color: #64748b; line-height: 1.6; }
                    a { color: #f97316; text-decoration: none; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div style="font-size:3rem;margin-bottom:16px">✅</div>
                    <h1>Désinscription confirmée</h1>
                    <p>Vous ne recevrez plus de messages de notre part.<br>
                    Si vous changez d'avis, <a href="/register">essayez Artisan Portal gratuitement</a>.</p>
                </div>
            </body>
            </html>
            HTML,
            200,
            ['Content-Type' => 'text/html']
        );
    }
}
