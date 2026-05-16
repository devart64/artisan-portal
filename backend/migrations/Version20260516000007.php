<?php
declare(strict_types=1);
namespace DoctrineMigrations;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260516000007 extends AbstractMigration
{
    public function getDescription(): string { return 'Add TOTP 2FA fields to users + compta_exports table'; }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE users ADD totp_secret VARCHAR(64) NULL');
        $this->addSql('ALTER TABLE users ADD totp_enabled BOOLEAN NOT NULL DEFAULT FALSE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE users DROP totp_secret, DROP totp_enabled');
    }
}
