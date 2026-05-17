<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260517084337 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE api_keys ALTER id DROP DEFAULT');
        $this->addSql('ALTER TABLE api_keys ALTER created_at DROP DEFAULT');
        $this->addSql('ALTER INDEX uniq_api_key_hash RENAME TO UNIQ_9579321F57BFB971');
        $this->addSql('DROP INDEX idx_audit_tenant');
        $this->addSql('ALTER TABLE audit_logs ALTER id DROP DEFAULT');
        $this->addSql('ALTER TABLE audit_logs ALTER meta TYPE JSON');
        $this->addSql('ALTER TABLE audit_logs ALTER created_at DROP DEFAULT');
        $this->addSql('ALTER TABLE chantiers ALTER status TYPE VARCHAR(255)');
        $this->addSql('ALTER TABLE chantiers ALTER status DROP DEFAULT');
        $this->addSql('ALTER TABLE chantiers ALTER start_date TYPE TIMESTAMP(0) WITHOUT TIME ZONE');
        $this->addSql('ALTER TABLE chantiers ALTER end_date TYPE TIMESTAMP(0) WITHOUT TIME ZONE');
        $this->addSql('ALTER TABLE chantiers ALTER address TYPE VARCHAR(512)');
        $this->addSql('ALTER INDEX idx_chantiers_tenant RENAME TO IDX_4FB3F7059033212A');
        $this->addSql('ALTER INDEX idx_chantiers_client RENAME TO IDX_4FB3F70519EB6921');
        $this->addSql('DROP INDEX idx_client_tokens_expires');
        $this->addSql('ALTER TABLE client_tokens ALTER token TYPE VARCHAR(128)');
        $this->addSql('ALTER INDEX uniq_client_tokens_token RENAME TO UNIQ_FFFC5A3D5F37A13B');
        $this->addSql('ALTER INDEX idx_client_tokens_client RENAME TO IDX_FFFC5A3D19EB6921');
        $this->addSql('ALTER INDEX idx_client_tokens_chantier RENAME TO IDX_FFFC5A3DD0C0049D');
        $this->addSql('ALTER TABLE clients ALTER email TYPE VARCHAR(255)');
        $this->addSql('ALTER TABLE clients ALTER phone TYPE VARCHAR(50)');
        $this->addSql('ALTER TABLE clients ALTER created_at DROP DEFAULT');
        $this->addSql('ALTER INDEX idx_clients_tenant RENAME TO IDX_C82E749033212A');
        $this->addSql('ALTER TABLE documents ALTER type TYPE VARCHAR(255)');
        $this->addSql('ALTER TABLE documents ALTER file_path TYPE VARCHAR(1024)');
        $this->addSql('ALTER TABLE documents ALTER status TYPE VARCHAR(255)');
        $this->addSql('ALTER INDEX idx_documents_chantier RENAME TO IDX_A2B07288D0C0049D');
        $this->addSql('ALTER TABLE jalons ALTER date TYPE TIMESTAMP(0) WITHOUT TIME ZONE');
        $this->addSql('ALTER TABLE jalons ALTER done DROP DEFAULT');
        $this->addSql('ALTER TABLE jalons ALTER created_at DROP DEFAULT');
        $this->addSql('ALTER INDEX idx_jalons_chantier RENAME TO IDX_BCF6716BD0C0049D');
        $this->addSql('DROP INDEX idx_leads_status');
        $this->addSql('ALTER TABLE leads ALTER trade DROP DEFAULT');
        $this->addSql('ALTER TABLE leads ALTER status TYPE VARCHAR(255)');
        $this->addSql('ALTER INDEX idx_lead_tenant RENAME TO IDX_179045529033212A');
        $this->addSql('ALTER TABLE messages ADD read BOOLEAN NOT NULL');
        $this->addSql('ALTER TABLE messages DROP is_read');
        $this->addSql('ALTER TABLE messages ALTER sender_type TYPE VARCHAR(20)');
        $this->addSql('ALTER TABLE messages ALTER sender_name DROP NOT NULL');
        $this->addSql('ALTER INDEX idx_messages_chantier RENAME TO IDX_DB021E96D0C0049D');
        $this->addSql('DROP INDEX idx_notif_tenant');
        $this->addSql('ALTER TABLE notifications ALTER id DROP DEFAULT');
        $this->addSql('ALTER TABLE notifications ALTER created_at DROP DEFAULT');
        $this->addSql('ALTER TABLE photos ALTER file_path TYPE VARCHAR(1024)');
        $this->addSql('ALTER TABLE photos ALTER caption TYPE VARCHAR(512)');
        $this->addSql('ALTER INDEX idx_photos_chantier RENAME TO IDX_876E0D9D0C0049D');
        $this->addSql('ALTER TABLE push_subscriptions ALTER id DROP DEFAULT');
        $this->addSql('ALTER TABLE push_subscriptions ALTER created_at DROP DEFAULT');
        $this->addSql('ALTER INDEX uniq_push_endpoint RENAME TO UNIQ_3FEC449DC4420F7B');
        $this->addSql('ALTER TABLE tenants ALTER slug TYPE VARCHAR(255)');
        $this->addSql('ALTER TABLE tenants ALTER logo_url TYPE VARCHAR(512)');
        $this->addSql('ALTER TABLE tenants ALTER brand_color DROP DEFAULT');
        $this->addSql('ALTER TABLE tenants ALTER plan TYPE VARCHAR(255)');
        $this->addSql('ALTER TABLE tenants ALTER plan DROP DEFAULT');
        $this->addSql('ALTER TABLE tenants ALTER plan_status TYPE VARCHAR(255)');
        $this->addSql('ALTER TABLE tenants ALTER plan_status DROP DEFAULT');
        $this->addSql('ALTER INDEX uniq_tenants_slug RENAME TO UNIQ_B8FC96BB989D9B62');
        $this->addSql('ALTER TABLE users ADD created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL');
        $this->addSql('ALTER TABLE users ALTER email TYPE VARCHAR(255)');
        $this->addSql('ALTER TABLE users ALTER role TYPE VARCHAR(255)');
        $this->addSql('ALTER TABLE users ALTER role DROP DEFAULT');
        $this->addSql('ALTER TABLE users ALTER name DROP DEFAULT');
        $this->addSql('ALTER TABLE users ALTER totp_enabled DROP DEFAULT');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_1483A5E933FC351A ON users (invitation_token)');
        $this->addSql('ALTER INDEX uniq_users_email RENAME TO UNIQ_1483A5E9E7927C74');
        $this->addSql('ALTER INDEX idx_users_tenant RENAME TO IDX_1483A5E99033212A');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE api_keys ALTER id SET DEFAULT \'gen_random_uuid()\'');
        $this->addSql('ALTER TABLE api_keys ALTER created_at SET DEFAULT \'now()\'');
        $this->addSql('ALTER INDEX uniq_9579321f57bfb971 RENAME TO uniq_api_key_hash');
        $this->addSql('ALTER TABLE audit_logs ALTER id SET DEFAULT \'gen_random_uuid()\'');
        $this->addSql('ALTER TABLE audit_logs ALTER meta TYPE JSONB');
        $this->addSql('ALTER TABLE audit_logs ALTER created_at SET DEFAULT \'now()\'');
        $this->addSql('CREATE INDEX idx_audit_tenant ON audit_logs (tenant_id, created_at)');
        $this->addSql('ALTER TABLE chantiers ALTER status TYPE VARCHAR(30)');
        $this->addSql('ALTER TABLE chantiers ALTER status SET DEFAULT \'en_cours\'');
        $this->addSql('ALTER TABLE chantiers ALTER start_date TYPE DATE');
        $this->addSql('ALTER TABLE chantiers ALTER end_date TYPE DATE');
        $this->addSql('ALTER TABLE chantiers ALTER address TYPE VARCHAR(500)');
        $this->addSql('ALTER INDEX idx_4fb3f70519eb6921 RENAME TO idx_chantiers_client');
        $this->addSql('ALTER INDEX idx_4fb3f7059033212a RENAME TO idx_chantiers_tenant');
        $this->addSql('ALTER TABLE client_tokens ALTER token TYPE VARCHAR(64)');
        $this->addSql('CREATE INDEX idx_client_tokens_expires ON client_tokens (expires_at)');
        $this->addSql('ALTER INDEX idx_fffc5a3d19eb6921 RENAME TO idx_client_tokens_client');
        $this->addSql('ALTER INDEX uniq_fffc5a3d5f37a13b RENAME TO uniq_client_tokens_token');
        $this->addSql('ALTER INDEX idx_fffc5a3dd0c0049d RENAME TO idx_client_tokens_chantier');
        $this->addSql('ALTER TABLE clients ALTER email TYPE VARCHAR(180)');
        $this->addSql('ALTER TABLE clients ALTER phone TYPE VARCHAR(30)');
        $this->addSql('ALTER TABLE clients ALTER created_at SET DEFAULT \'now()\'');
        $this->addSql('ALTER INDEX idx_c82e749033212a RENAME TO idx_clients_tenant');
        $this->addSql('ALTER TABLE documents ALTER type TYPE VARCHAR(30)');
        $this->addSql('ALTER TABLE documents ALTER file_path TYPE VARCHAR(500)');
        $this->addSql('ALTER TABLE documents ALTER status TYPE VARCHAR(30)');
        $this->addSql('ALTER INDEX idx_a2b07288d0c0049d RENAME TO idx_documents_chantier');
        $this->addSql('ALTER TABLE jalons ALTER date TYPE DATE');
        $this->addSql('ALTER TABLE jalons ALTER done SET DEFAULT false');
        $this->addSql('ALTER TABLE jalons ALTER created_at SET DEFAULT \'now()\'');
        $this->addSql('ALTER INDEX idx_bcf6716bd0c0049d RENAME TO idx_jalons_chantier');
        $this->addSql('ALTER TABLE leads ALTER trade SET DEFAULT \'\'');
        $this->addSql('ALTER TABLE leads ALTER status TYPE VARCHAR(20)');
        $this->addSql('CREATE INDEX idx_leads_status ON leads (status)');
        $this->addSql('ALTER INDEX idx_179045529033212a RENAME TO idx_lead_tenant');
        $this->addSql('ALTER TABLE messages ADD is_read BOOLEAN DEFAULT false NOT NULL');
        $this->addSql('ALTER TABLE messages DROP read');
        $this->addSql('ALTER TABLE messages ALTER sender_type TYPE VARCHAR(10)');
        $this->addSql('ALTER TABLE messages ALTER sender_name SET NOT NULL');
        $this->addSql('ALTER INDEX idx_db021e96d0c0049d RENAME TO idx_messages_chantier');
        $this->addSql('ALTER TABLE notifications ALTER id SET DEFAULT \'gen_random_uuid()\'');
        $this->addSql('ALTER TABLE notifications ALTER created_at SET DEFAULT \'now()\'');
        $this->addSql('CREATE INDEX idx_notif_tenant ON notifications (tenant_id, read_at)');
        $this->addSql('ALTER TABLE photos ALTER file_path TYPE VARCHAR(500)');
        $this->addSql('ALTER TABLE photos ALTER caption TYPE VARCHAR(255)');
        $this->addSql('ALTER INDEX idx_876e0d9d0c0049d RENAME TO idx_photos_chantier');
        $this->addSql('ALTER TABLE push_subscriptions ALTER id SET DEFAULT \'gen_random_uuid()\'');
        $this->addSql('ALTER TABLE push_subscriptions ALTER created_at SET DEFAULT \'now()\'');
        $this->addSql('ALTER INDEX uniq_3fec449dc4420f7b RENAME TO uniq_push_endpoint');
        $this->addSql('ALTER TABLE tenants ALTER slug TYPE VARCHAR(100)');
        $this->addSql('ALTER TABLE tenants ALTER logo_url TYPE VARCHAR(500)');
        $this->addSql('ALTER TABLE tenants ALTER brand_color SET DEFAULT \'#1A56A0\'');
        $this->addSql('ALTER TABLE tenants ALTER plan TYPE VARCHAR(20)');
        $this->addSql('ALTER TABLE tenants ALTER plan SET DEFAULT \'starter\'');
        $this->addSql('ALTER TABLE tenants ALTER plan_status TYPE VARCHAR(20)');
        $this->addSql('ALTER TABLE tenants ALTER plan_status SET DEFAULT \'trialing\'');
        $this->addSql('ALTER INDEX uniq_b8fc96bb989d9b62 RENAME TO uniq_tenants_slug');
        $this->addSql('DROP INDEX UNIQ_1483A5E933FC351A');
        $this->addSql('ALTER TABLE users DROP created_at');
        $this->addSql('ALTER TABLE users ALTER email TYPE VARCHAR(180)');
        $this->addSql('ALTER TABLE users ALTER role TYPE VARCHAR(30)');
        $this->addSql('ALTER TABLE users ALTER role SET DEFAULT \'admin\'');
        $this->addSql('ALTER TABLE users ALTER name SET DEFAULT \'\'');
        $this->addSql('ALTER TABLE users ALTER totp_enabled SET DEFAULT false');
        $this->addSql('ALTER INDEX uniq_1483a5e9e7927c74 RENAME TO uniq_users_email');
        $this->addSql('ALTER INDEX idx_1483a5e99033212a RENAME TO idx_users_tenant');
    }
}
