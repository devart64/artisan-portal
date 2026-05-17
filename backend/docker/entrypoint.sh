#!/bin/bash
set -e

echo "⏳ Waiting for PostgreSQL..."
until php -r "new PDO('pgsql:host=postgres;dbname=${POSTGRES_DB:-artisan_portal}', '${POSTGRES_USER:-artisan}', '${POSTGRES_PASSWORD:-artisan}');" 2>/dev/null; do
    sleep 1
done
echo "✅ PostgreSQL ready"

echo "📦 Ensuring dependencies are up to date..."
composer install --no-interaction --no-scripts --quiet

echo "🔑 Generating JWT keys (if missing)..."
php bin/console lexik:jwt:generate-keypair --skip-if-exists --quiet

echo "📦 Running migrations..."
php bin/console doctrine:migrations:migrate --no-interaction --quiet

echo "🚀 Starting PHP-FPM..."
exec php-fpm
