<?php
declare(strict_types=1);
namespace DoctrineMigrations;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260516000008 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Corrections schéma : Lead tenant, colonnes manquantes, index client_tokens';
    }

    public function up(Schema $schema): void
    {
        // Ajouter tenant_id sur leads
        $this->addSql('ALTER TABLE leads ADD tenant_id UUID NOT NULL DEFAULT gen_random_uuid()');
        $this->addSql('ALTER TABLE leads ALTER COLUMN tenant_id DROP DEFAULT');
        $this->addSql('ALTER TABLE leads ADD CONSTRAINT fk_lead_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE');
        $this->addSql('CREATE INDEX idx_lead_tenant ON leads (tenant_id)');

        // Renommer uploaded_at en created_at sur documents si elle existe
        $this->addSql("
            DO \$\$
            BEGIN
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='uploaded_at') THEN
                    ALTER TABLE documents RENAME COLUMN uploaded_at TO created_at;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='created_at') THEN
                    ALTER TABLE documents ADD created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW();
                END IF;
            END \$\$
        ");

        // Ajouter created_at sur jalons si manquant
        $this->addSql("
            DO \$\$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jalons' AND column_name='created_at') THEN
                    ALTER TABLE jalons ADD created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW();
                END IF;
            END \$\$
        ");

        // Ajouter created_at sur clients si manquant
        $this->addSql("
            DO \$\$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='created_at') THEN
                    ALTER TABLE clients ADD created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW();
                END IF;
            END \$\$
        ");

        // Ajouter updated_at (nullable) sur chantiers si manquant
        $this->addSql("
            DO \$\$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chantiers' AND column_name='updated_at') THEN
                    ALTER TABLE chantiers ADD updated_at TIMESTAMP(0) WITHOUT TIME ZONE NULL;
                END IF;
            END \$\$
        ");

        // Corriger le DEFAULT de users.role
        $this->addSql("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'admin'");

        // Index sur client_tokens.expires_at
        $this->addSql("
            DO \$\$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='client_tokens' AND indexname='idx_client_tokens_expires') THEN
                    CREATE INDEX idx_client_tokens_expires ON client_tokens (expires_at);
                END IF;
            END \$\$
        ");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE leads DROP CONSTRAINT IF EXISTS fk_lead_tenant');
        $this->addSql('DROP INDEX IF EXISTS idx_lead_tenant');
        $this->addSql('ALTER TABLE leads DROP COLUMN IF EXISTS tenant_id');
        $this->addSql('DROP INDEX IF EXISTS idx_client_tokens_expires');
    }
}
