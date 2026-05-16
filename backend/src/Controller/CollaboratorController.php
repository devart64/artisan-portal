<?php
declare(strict_types=1);
namespace App\Controller;

use App\Entity\User;
use App\Enum\UserRoleEnum;
use App\Repository\UserRepository;
use App\Service\TenantContext;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Twig\Environment;

#[Route('/api/team')]
#[IsGranted('ROLE_ADMIN')]
class CollaboratorController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly TenantContext $tenantContext,
        private readonly UserRepository $userRepository,
        private readonly MailerInterface $mailer,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly Environment $twig,
        #[Autowire('%env(FRONTEND_URL)%')]
        private readonly string $frontendUrl,
    ) {}

    #[Route('', name: 'team_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $tenant = $this->tenantContext->getTenant();
        $users  = $this->userRepository->findBy(['tenant' => $tenant]);

        return $this->json(array_map(fn(User $u) => [
            'id'        => $u->getId()->toString(),
            'name'      => $u->getName(),
            'email'     => $u->getEmail(),
            'role'      => $u->getRole()->value,
            'createdAt' => $u->getCreatedAt()->format('c'),
            'pending'   => $u->getInvitationToken() !== null,
        ], $users));
    }

    #[Route('/invite', name: 'team_invite', methods: ['POST'])]
    public function invite(Request $request): JsonResponse
    {
        $tenant = $this->tenantContext->getTenant();
        $data   = json_decode($request->getContent(), true);

        $email = trim($data['email'] ?? '');
        $name  = trim($data['name']  ?? '');

        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->json(['error' => 'Email invalide.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if ($this->userRepository->findOneBy(['email' => $email]) !== null) {
            return $this->json(['error' => 'Cet email est déjà utilisé.'], Response::HTTP_CONFLICT);
        }

        $token = bin2hex(random_bytes(32));

        $user = new User();
        $user->setTenant($tenant);
        $user->setEmail($email);
        $user->setName($name);
        $user->setRole(UserRoleEnum::COLLABORATOR);
        $user->setPassword($this->passwordHasher->hashPassword($user, bin2hex(random_bytes(16))));
        $user->setInvitationToken($token);
        $user->setInvitedAt(new \DateTimeImmutable());

        $this->em->persist($user);
        $this->em->flush();

        $html = $this->twig->render('emails/collaborator_invite.html.twig', [
            'tenant_name'  => $tenant->getName(),
            'invitee_name' => $name,
            'accept_url'   => $this->frontendUrl . '/invitation/' . $token,
        ]);

        $mail = (new Email())
            ->from('noreply@artisan-portal.fr')
            ->to($email)
            ->subject('Invitation à rejoindre ' . $tenant->getName())
            ->html($html);

        try { $this->mailer->send($mail); } catch (\Throwable) {}

        return $this->json(['ok' => true, 'id' => $user->getId()->toString()], Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'team_remove', methods: ['DELETE'])]
    public function remove(string $id): JsonResponse
    {
        $tenant  = $this->tenantContext->getTenant();
        $current = $this->getUser();

        $user = $this->userRepository->find($id);
        if ($user === null || !$user->getTenant()->getId()->equals($tenant->getId())) {
            return $this->json(['error' => 'Introuvable.'], Response::HTTP_NOT_FOUND);
        }

        if ($user->getUserIdentifier() === $current->getUserIdentifier()) {
            return $this->json(['error' => 'Vous ne pouvez pas vous supprimer vous-même.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->em->remove($user);
        $this->em->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }
}
