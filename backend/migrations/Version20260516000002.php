<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260516000002 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajout champs signature sur documents';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE documents ADD signed_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql('ALTER TABLE documents ADD signer_name VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE documents ADD signer_ip VARCHAR(45) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE documents DROP signed_at');
        $this->addSql('ALTER TABLE documents DROP signer_name');
        $this->addSql('ALTER TABLE documents DROP signer_ip');
    }
}
