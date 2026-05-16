<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260516000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Initial schema — tenants, users, clients, chantiers, jalons, documents, photos, messages, client_tokens, leads';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            CREATE TABLE tenants (
                id UUID NOT NULL,
                name VARCHAR(255) NOT NULL,
                slug VARCHAR(100) NOT NULL,
                logo_url VARCHAR(500) DEFAULT NULL,
                brand_color VARCHAR(7) NOT NULL DEFAULT '#1A56A0',
                stripe_customer_id VARCHAR(255) DEFAULT NULL,
                plan VARCHAR(20) NOT NULL DEFAULT 'starter',
                plan_status VARCHAR(20) NOT NULL DEFAULT 'trialing',
                created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                PRIMARY KEY(id)
            )
        SQL);
        $this->addSql('CREATE UNIQUE INDEX UNIQ_TENANTS_SLUG ON tenants (slug)');

        $this->addSql(<<<'SQL'
            CREATE TABLE users (
                id UUID NOT NULL,
                tenant_id UUID NOT NULL,
                email VARCHAR(180) NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(30) NOT NULL DEFAULT 'ROLE_ARTISAN',
                PRIMARY KEY(id)
            )
        SQL);
        $this->addSql('CREATE UNIQUE INDEX UNIQ_USERS_EMAIL ON users (email)');
        $this->addSql('CREATE INDEX IDX_USERS_TENANT ON users (tenant_id)');
        $this->addSql('ALTER TABLE users ADD CONSTRAINT FK_USERS_TENANT FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql(<<<'SQL'
            CREATE TABLE clients (
                id UUID NOT NULL,
                tenant_id UUID NOT NULL,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(180) DEFAULT NULL,
                phone VARCHAR(30) DEFAULT NULL,
                PRIMARY KEY(id)
            )
        SQL);
        $this->addSql('CREATE INDEX IDX_CLIENTS_TENANT ON clients (tenant_id)');
        $this->addSql('ALTER TABLE clients ADD CONSTRAINT FK_CLIENTS_TENANT FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql(<<<'SQL'
            CREATE TABLE chantiers (
                id UUID NOT NULL,
                tenant_id UUID NOT NULL,
                client_id UUID DEFAULT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT DEFAULT NULL,
                status VARCHAR(30) NOT NULL DEFAULT 'en_cours',
                start_date DATE DEFAULT NULL,
                end_date DATE DEFAULT NULL,
                address VARCHAR(500) DEFAULT NULL,
                created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                PRIMARY KEY(id)
            )
        SQL);
        $this->addSql('CREATE INDEX IDX_CHANTIERS_TENANT ON chantiers (tenant_id)');
        $this->addSql('CREATE INDEX IDX_CHANTIERS_CLIENT ON chantiers (client_id)');
        $this->addSql('ALTER TABLE chantiers ADD CONSTRAINT FK_CHANTIERS_TENANT FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE chantiers ADD CONSTRAINT FK_CHANTIERS_CLIENT FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql(<<<'SQL'
            CREATE TABLE jalons (
                id UUID NOT NULL,
                chantier_id UUID NOT NULL,
                title VARCHAR(255) NOT NULL,
                date DATE DEFAULT NULL,
                done BOOLEAN NOT NULL DEFAULT FALSE,
                PRIMARY KEY(id)
            )
        SQL);
        $this->addSql('CREATE INDEX IDX_JALONS_CHANTIER ON jalons (chantier_id)');
        $this->addSql('ALTER TABLE jalons ADD CONSTRAINT FK_JALONS_CHANTIER FOREIGN KEY (chantier_id) REFERENCES chantiers (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql(<<<'SQL'
            CREATE TABLE documents (
                id UUID NOT NULL,
                chantier_id UUID NOT NULL,
                type VARCHAR(30) NOT NULL,
                label VARCHAR(255) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                status VARCHAR(30) DEFAULT NULL,
                uploaded_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                PRIMARY KEY(id)
            )
        SQL);
        $this->addSql('CREATE INDEX IDX_DOCUMENTS_CHANTIER ON documents (chantier_id)');
        $this->addSql('ALTER TABLE documents ADD CONSTRAINT FK_DOCUMENTS_CHANTIER FOREIGN KEY (chantier_id) REFERENCES chantiers (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql(<<<'SQL'
            CREATE TABLE photos (
                id UUID NOT NULL,
                chantier_id UUID NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                caption VARCHAR(255) DEFAULT NULL,
                uploaded_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                PRIMARY KEY(id)
            )
        SQL);
        $this->addSql('CREATE INDEX IDX_PHOTOS_CHANTIER ON photos (chantier_id)');
        $this->addSql('ALTER TABLE photos ADD CONSTRAINT FK_PHOTOS_CHANTIER FOREIGN KEY (chantier_id) REFERENCES chantiers (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql(<<<'SQL'
            CREATE TABLE messages (
                id UUID NOT NULL,
                chantier_id UUID NOT NULL,
                sender_type VARCHAR(10) NOT NULL,
                sender_name VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                is_read BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                PRIMARY KEY(id)
            )
        SQL);
        $this->addSql('CREATE INDEX IDX_MESSAGES_CHANTIER ON messages (chantier_id)');
        $this->addSql('ALTER TABLE messages ADD CONSTRAINT FK_MESSAGES_CHANTIER FOREIGN KEY (chantier_id) REFERENCES chantiers (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql(<<<'SQL'
            CREATE TABLE client_tokens (
                id UUID NOT NULL,
                client_id UUID NOT NULL,
                chantier_id UUID NOT NULL,
                token VARCHAR(64) NOT NULL,
                expires_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                PRIMARY KEY(id)
            )
        SQL);
        $this->addSql('CREATE UNIQUE INDEX UNIQ_CLIENT_TOKENS_TOKEN ON client_tokens (token)');
        $this->addSql('CREATE INDEX IDX_CLIENT_TOKENS_CLIENT ON client_tokens (client_id)');
        $this->addSql('CREATE INDEX IDX_CLIENT_TOKENS_CHANTIER ON client_tokens (chantier_id)');
        $this->addSql('ALTER TABLE client_tokens ADD CONSTRAINT FK_CLIENT_TOKENS_CLIENT FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE client_tokens ADD CONSTRAINT FK_CLIENT_TOKENS_CHANTIER FOREIGN KEY (chantier_id) REFERENCES chantiers (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql(<<<'SQL'
            CREATE TABLE leads (
                id UUID NOT NULL,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) DEFAULT NULL,
                phone VARCHAR(30) DEFAULT NULL,
                trade VARCHAR(100) NOT NULL DEFAULT '',
                city VARCHAR(100) DEFAULT NULL,
                source VARCHAR(100) DEFAULT NULL,
                score SMALLINT NOT NULL DEFAULT 0,
                status VARCHAR(20) NOT NULL DEFAULT 'new',
                notes TEXT DEFAULT NULL,
                last_contacted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL,
                created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                PRIMARY KEY(id)
            )
        SQL);
        $this->addSql('CREATE INDEX IDX_LEADS_STATUS ON leads (status)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE leads');
        $this->addSql('DROP TABLE client_tokens');
        $this->addSql('DROP TABLE messages');
        $this->addSql('DROP TABLE photos');
        $this->addSql('DROP TABLE documents');
        $this->addSql('DROP TABLE jalons');
        $this->addSql('DROP TABLE chantiers');
        $this->addSql('DROP TABLE clients');
        $this->addSql('DROP TABLE users');
        $this->addSql('DROP TABLE tenants');
    }
}
