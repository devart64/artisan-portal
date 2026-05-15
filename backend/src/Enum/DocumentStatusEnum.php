<?php

declare(strict_types=1);

namespace App\Enum;

enum DocumentStatusEnum: string
{
    case EN_ATTENTE = 'en_attente';
    case ACCEPTE = 'accepte';
    case REFUSE = 'refuse';
    case PAYE = 'paye';
    case EN_RETARD = 'en_retard';

    public function label(): string
    {
        return match($this) {
            self::EN_ATTENTE => 'En attente',
            self::ACCEPTE => 'Accepté',
            self::REFUSE => 'Refusé',
            self::PAYE => 'Payé',
            self::EN_RETARD => 'En retard',
        };
    }
}
