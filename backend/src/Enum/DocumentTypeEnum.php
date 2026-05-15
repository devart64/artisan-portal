<?php

declare(strict_types=1);

namespace App\Enum;

enum DocumentTypeEnum: string
{
    case DEVIS = 'devis';
    case FACTURE = 'facture';
    case PLAN = 'plan';
    case AUTRE = 'autre';

    public function label(): string
    {
        return match($this) {
            self::DEVIS => 'Devis',
            self::FACTURE => 'Facture',
            self::PLAN => 'Plan',
            self::AUTRE => 'Autre',
        };
    }
}
