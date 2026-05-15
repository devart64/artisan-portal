.PHONY: install migrate test jwt cache

install:
	composer install
	php bin/console doctrine:migrations:migrate --no-interaction

migrate:
	php bin/console doctrine:migrations:diff
	php bin/console doctrine:migrations:migrate --no-interaction

jwt:
	php bin/console lexik:jwt:generate-keypair --overwrite

test:
	php bin/phpunit --testdox

cache:
	php bin/console cache:clear
