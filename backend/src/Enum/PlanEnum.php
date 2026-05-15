<?php

declare(strict_types=1);

namespace App\Enum;

enum PlanEnum: string
{
    case STARTER = 'starter';
    case PRO = 'pro';
    case BUSINESS = 'business';

    public function allowsSms(): bool
    {
        return match($this) {
            self::PRO, self::BUSINESS => true,
            self::STARTER => false,
        };
    }

    public function label(): string
    {
        return match($this) {
            self::STARTER => 'Starter',
            self::PRO => 'Pro',
            self::BUSINESS => 'Business',
        };
    }
}
