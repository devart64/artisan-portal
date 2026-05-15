<?php

declare(strict_types=1);

namespace App\Enum;

enum UserRoleEnum: string
{
    case ADMIN = 'admin';
    case COLLABORATOR = 'collaborator';

    public function label(): string
    {
        return match($this) {
            self::ADMIN => 'Administrateur',
            self::COLLABORATOR => 'Collaborateur',
        };
    }
}
