<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260516000005 extends AbstractMigration
{
    public function getDescription(): string { return 'Add api_keys table'; }

    public function up(Schema $schema): void
    {
        $this->addSql("CREATE TABLE api_keys (
            id UUID NOT NULL DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            name VARCHAR(255) NOT NULL,
            key_hash VARCHAR(255) NOT NULL,
            key_prefix VARCHAR(8) NOT NULL,
            last_used_at TIMESTAMP(0) WITHOUT TIME ZONE NULL,
            created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
            PRIMARY KEY (id),
            CONSTRAINT fk_apikey_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
        )");
        $this->addSql('CREATE UNIQUE INDEX uniq_api_key_hash ON api_keys (key_hash)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE api_keys');
    }
}
