<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Tenant;
use App\Entity\User;
use App\Service\StripeService;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Twig\Environment;

#[Route('/api/auth')]
class AuthController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly JWTTokenManagerInterface $jwtTokenManager,
        private readonly ValidatorInterface $validator,
        private readonly MailerInterface $mailer,
        private readonly Environment $twig,
        private readonly StripeService $stripeService,
    ) {}

    #[Route('/register', name: 'auth_register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            return $this->json(['error' => 'Invalid JSON body.'], Response::HTTP_BAD_REQUEST);
        }

        $constraints = new Assert\Collection([
            'name'     => [new Assert\NotBlank(), new Assert\Length(['min' => 2, 'max' => 255])],
            'email'    => [new Assert\NotBlank(), new Assert\Email()],
            'password' => [new Assert\NotBlank(), new Assert\Length(['min' => 8])],
            'slug'     => new Assert\Optional([new Assert\Length(['min' => 2, 'max' => 100]), new Assert\Regex('/^[a-z0-9-]+$/')]),
        ]);

        $violations = $this->validator->validate($data, $constraints);
        if (count($violations) > 0) {
            $errors = [];
            foreach ($violations as $violation) {
                $errors[$violation->getPropertyPath()] = $violation->getMessage();
            }
            return $this->json(['errors' => $errors], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Check for existing email
        $existingUser = $this->entityManager->getRepository(User::class)->findOneBy(['email' => $data['email']]);
        if ($existingUser !== null) {
            return $this->json(['error' => 'This email address is already in use.'], Response::HTTP_CONFLICT);
        }

        // Generate slug from name if not provided
        $slug = $data['slug'] ?? $this->generateSlug($data['name']);

        // Ensure slug is unique
        $existingTenant = $this->entityManager->getRepository(Tenant::class)->findOneBy(['slug' => $slug]);
        if ($existingTenant !== null) {
            $slug .= '-' . bin2hex(random_bytes(3));
        }

        // Create Tenant
        $tenant = new Tenant();
        $tenant->setName($data['name']);
        $tenant->setSlug($slug);
        $this->entityManager->persist($tenant);

        // Create Stripe customer if configured
        try {
            $stripeCustomerId = $this->stripeService->createCustomer($tenant);
            $tenant->setStripeCustomerId($stripeCustomerId);
        } catch (\Throwable) {
            // Stripe not configured in dev — continue without it
        }

        // Create User
        $user = new User();
        $user->setTenant($tenant);
        $user->setEmail($data['email']);
        $user->setPassword($this->passwordHasher->hashPassword($user, $data['password']));
        $this->entityManager->persist($user);

        $this->entityManager->flush();

        // Send welcome email
        try {
            $this->sendWelcomeEmail($user, $tenant);
        } catch (\Throwable) {
            // Non-blocking
        }

        // Generate JWT
        $token = $this->jwtTokenManager->create($user);

        return $this->json([
            'token'  => $token,
            'tenant' => [
                'id'         => $tenant->getId()->toString(),
                'name'       => $tenant->getName(),
                'slug'       => $tenant->getSlug(),
                'plan'       => $tenant->getPlan()->value,
                'planStatus' => $tenant->getPlanStatus()->value,
            ],
            'user' => [
                'id'    => $user->getId()->toString(),
                'email' => $user->getEmail(),
                'role'  => $user->getRole()->value,
            ],
        ], Response::HTTP_CREATED);
    }

    #[Route('/login', name: 'auth_login', methods: ['POST'])]
    public function login(): JsonResponse
    {
        // This route is intercepted by LexikJWT before hitting the controller.
        // This method will only be reached if JWT auth is misconfigured.
        return $this->json(['error' => 'Invalid credentials.'], Response::HTTP_UNAUTHORIZED);
    }

    private function generateSlug(string $name): string
    {
        $slug = mb_strtolower($name);
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug) ?? '';
        return trim($slug, '-');
    }

    private function sendWelcomeEmail(User $user, Tenant $tenant): void
    {
        $htmlContent = $this->twig->render('emails/welcome.html.twig', [
            'user'   => $user,
            'tenant' => $tenant,
        ]);

        $email = (new Email())
            ->from(new Address('noreply@artisan-portal.fr', 'Artisan Portal'))
            ->to(new Address($user->getEmail()))
            ->subject('Bienvenue sur Artisan Portal !')
            ->html($htmlContent);

        $this->mailer->send($email);
    }
}
