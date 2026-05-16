<?php
declare(strict_types=1);
namespace App\Enum;

enum LeadStatusEnum: string
{
    case New       = 'new';
    case Qualified = 'qualified';
    case Contacted = 'contacted';
    case Replied   = 'replied';
    case Converted = 'converted';
    case Lost      = 'lost';

    public function label(): string
    {
        return match($this) {
            self::New       => 'Nouveau',
            self::Qualified => 'Qualifié',
            self::Contacted => 'Contacté',
            self::Replied   => 'A répondu',
            self::Converted => 'Converti',
            self::Lost      => 'Perdu',
        };
    }
}
