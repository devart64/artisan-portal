<?php

declare(strict_types=1);

namespace App\Voter;

use App\Entity\Chantier;
use App\Entity\User;
use App\Enum\UserRoleEnum;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * @extends Voter<string, Chantier>
 */
class ChantierVoter extends Voter
{
    public const VIEW   = 'view';
    public const EDIT   = 'edit';
    public const DELETE = 'delete';

    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT, self::DELETE], true)
            && $subject instanceof Chantier;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();

        if (!$user instanceof User) {
            return false;
        }

        /** @var Chantier $chantier */
        $chantier = $subject;

        // Must be same tenant
        if ($chantier->getTenant()->getId()->toString() !== $user->getTenant()->getId()->toString()) {
            return false;
        }

        return match ($attribute) {
            self::VIEW   => true,
            self::EDIT   => $user->getRole() === UserRoleEnum::ADMIN,
            self::DELETE => $user->getRole() === UserRoleEnum::ADMIN,
            default      => false,
        };
    }
}
