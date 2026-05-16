<?php
declare(strict_types=1);
namespace DoctrineMigrations;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260516000003 extends AbstractMigration
{
    public function getDescription(): string { return 'Add collaborator invitation fields + trial_ends_at to tenants'; }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE users ADD name VARCHAR(255) NOT NULL DEFAULT \'\'');
        $this->addSql('ALTER TABLE users ADD invitation_token VARCHAR(64) NULL');
        $this->addSql('ALTER TABLE users ADD invited_at TIMESTAMP(0) WITHOUT TIME ZONE NULL');
        $this->addSql('ALTER TABLE tenants ADD trial_ends_at TIMESTAMP(0) WITHOUT TIME ZONE NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE users DROP name, DROP invitation_token, DROP invited_at');
        $this->addSql('ALTER TABLE tenants DROP trial_ends_at');
    }
}
