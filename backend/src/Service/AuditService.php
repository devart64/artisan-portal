<?php
declare(strict_types=1);
namespace App\Service;

use App\Entity\AuditLog;
use App\Entity\Tenant;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

class AuditService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
    ) {}

    public function log(
        Tenant  $tenant,
        string  $action,
        string  $resource,
        ?string $resourceId = null,
        ?array  $meta = null,
        ?User   $user = null,
    ): void {
        $log = new AuditLog();
        $log->setTenant($tenant);
        $log->setAction($action);
        $log->setResource($resource);
        $log->setResourceId($resourceId);
        $log->setMeta($meta);
        $log->setUser($user);

        $this->em->persist($log);
        $this->em->flush();
    }
}
