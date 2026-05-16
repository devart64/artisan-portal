<?php
declare(strict_types=1);
namespace DoctrineMigrations;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260516000006 extends AbstractMigration
{
    public function getDescription(): string { return 'Add audit_logs and push_subscriptions tables'; }

    public function up(Schema $schema): void
    {
        $this->addSql("CREATE TABLE audit_logs (
            id UUID NOT NULL DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            user_id UUID NULL,
            action VARCHAR(64) NOT NULL,
            resource VARCHAR(64) NOT NULL,
            resource_id VARCHAR(64) NULL,
            meta JSONB NULL,
            created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
            PRIMARY KEY (id),
            CONSTRAINT fk_audit_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
            CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        )");
        $this->addSql('CREATE INDEX idx_audit_tenant ON audit_logs (tenant_id, created_at DESC)');

        $this->addSql("CREATE TABLE push_subscriptions (
            id UUID NOT NULL DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            user_id UUID NULL,
            endpoint TEXT NOT NULL,
            p256dh TEXT NOT NULL,
            auth TEXT NOT NULL,
            created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
            PRIMARY KEY (id),
            CONSTRAINT fk_push_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
            CONSTRAINT fk_push_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        )");
        $this->addSql('CREATE UNIQUE INDEX uniq_push_endpoint ON push_subscriptions (endpoint)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE audit_logs');
        $this->addSql('DROP TABLE push_subscriptions');
    }
}
