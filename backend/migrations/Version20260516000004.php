<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260516000004 extends AbstractMigration
{
    public function getDescription(): string { return 'Add notifications table'; }

    public function up(Schema $schema): void
    {
        $this->addSql("CREATE TABLE notifications (
            id UUID NOT NULL DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            user_id UUID NULL,
            type VARCHAR(64) NOT NULL,
            title VARCHAR(255) NOT NULL,
            body TEXT NULL,
            url VARCHAR(512) NULL,
            read_at TIMESTAMP(0) WITHOUT TIME ZONE NULL,
            created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
            PRIMARY KEY (id),
            CONSTRAINT fk_notif_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
            CONSTRAINT fk_notif_user   FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE SET NULL
        )");
        $this->addSql('CREATE INDEX idx_notif_tenant ON notifications (tenant_id, read_at)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE notifications');
    }
}
