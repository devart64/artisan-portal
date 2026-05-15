<?php

declare(strict_types=1);

namespace App\Enum;

enum PlanStatusEnum: string
{
    case TRIALING = 'trialing';
    case ACTIVE = 'active';
    case PAST_DUE = 'past_due';
    case CANCELED = 'canceled';

    public function label(): string
    {
        return match($this) {
            self::TRIALING => 'En période d\'essai',
            self::ACTIVE => 'Actif',
            self::PAST_DUE => 'Paiement en retard',
            self::CANCELED => 'Annulé',
        };
    }

    public function isActive(): bool
    {
        return match($this) {
            self::TRIALING, self::ACTIVE => true,
            self::PAST_DUE, self::CANCELED => false,
        };
    }
}
