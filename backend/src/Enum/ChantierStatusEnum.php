<?php

declare(strict_types=1);

namespace App\Enum;

enum ChantierStatusEnum: string
{
    case EN_ATTENTE = 'en_attente';
    case EN_COURS = 'en_cours';
    case TERMINE = 'termine';
    case ANNULE = 'annule';
    case Archive = 'archive';

    public function label(): string
    {
        return match($this) {
            self::EN_ATTENTE => 'En attente',
            self::EN_COURS => 'En cours',
            self::TERMINE => 'Terminé',
            self::ANNULE => 'Annulé',
            self::Archive => 'Archivé',
        };
    }
}
