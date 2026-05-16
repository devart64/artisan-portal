<?php
declare(strict_types=1);
namespace App\Controller;

use OTPHP\TOTP;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Doctrine\ORM\EntityManagerInterface;
use App\Repository\UserRepository;

#[Route('/api/auth/2fa')]
#[IsGranted('ROLE_USER')]
class TwoFactorController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserRepository $userRepository,
    ) {}

    #[Route('/setup', name: '2fa_setup', methods: ['POST'])]
    public function setup(): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();

        // Génère un nouveau secret
        $totp   = TOTP::generate();
        $secret = $totp->getSecret();

        // Stocke le secret sans activer encore
        $user->setTotpSecret($secret);
        $this->em->flush();

        $totp->setLabel($user->getEmail());
        $totp->setIssuer('Artisan Portal');

        return $this->json([
            'secret'     => $secret,
            'otpauthUrl' => $totp->getProvisioningUri(),
        ]);
    }

    #[Route('/enable', name: '2fa_enable', methods: ['POST'])]
    public function enable(Request $request): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user   = $this->getUser();
        $data   = json_decode($request->getContent(), true);
        $code   = $data['code'] ?? '';

        $secret = $user->getTotpSecret();
        if ($secret === null) {
            return $this->json(['error' => 'Setup 2FA d\'abord.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $totp = TOTP::createFromSecret($secret);

        if (!$totp->verify($code, null, 1)) {
            return $this->json(['error' => 'Code incorrect.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user->setTotpEnabled(true);
        $this->em->flush();

        return $this->json(['ok' => true]);
    }

    #[Route('/disable', name: '2fa_disable', methods: ['POST'])]
    public function disable(Request $request): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true);
        $code = $data['code'] ?? '';

        if ($user->isTotpEnabled()) {
            $totp = TOTP::createFromSecret($user->getTotpSecret());
            if (!$totp->verify($code, null, 1)) {
                return $this->json(['error' => 'Code incorrect.'], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
        }

        $user->setTotpSecret(null);
        $user->setTotpEnabled(false);
        $this->em->flush();

        return $this->json(['ok' => true]);
    }

    #[Route('/status', name: '2fa_status', methods: ['GET'])]
    public function status(): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();
        return $this->json(['enabled' => $user->isTotpEnabled()]);
    }
}
