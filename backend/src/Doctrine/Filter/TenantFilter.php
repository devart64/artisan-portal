<?php

declare(strict_types=1);

namespace App\Doctrine\Filter;

use Doctrine\ORM\Mapping\ClassMetadata;
use Doctrine\ORM\Query\Filter\SQLFilter;

class TenantFilter extends SQLFilter
{
    public function addFilterConstraint(ClassMetadata $targetEntity, string $targetTableAlias): string
    {
        // Check if the entity has a 'tenant' association
        if (!$targetEntity->hasAssociation('tenant')) {
            return '';
        }

        try {
            $tenantId = $this->getParameter('tenantId');
        } catch (\InvalidArgumentException) {
            return '';
        }

        // Get the column name for the tenant association
        $tenantColumnName = $targetEntity->getSingleAssociationJoinColumnName('tenant');

        return sprintf('%s.%s = %s', $targetTableAlias, $tenantColumnName, $tenantId);
    }
}
