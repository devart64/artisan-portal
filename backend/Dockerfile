FROM php:8.3-fpm-alpine AS base

# Extensions système
RUN apk add --no-cache \
    bash \
    git \
    unzip \
    libpq-dev \
    libzip-dev \
    icu-dev \
    oniguruma-dev \
    linux-headers \
    $PHPIZE_DEPS

# Extensions PHP
RUN docker-php-ext-install \
    pdo_pgsql \
    zip \
    intl \
    opcache \
    mbstring \
    && pecl install apcu \
    && docker-php-ext-enable apcu

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# PHP config
COPY docker/php.ini /usr/local/etc/php/conf.d/app.ini

WORKDIR /app

# ── Dev ──────────────────────────────────────────────────────────────────────
FROM base AS dev
ENV APP_ENV=dev

COPY composer.json composer.lock* ./
RUN composer install --no-scripts --no-autoloader --prefer-dist

COPY . .
RUN composer dump-autoload --optimize

EXPOSE 9000
CMD ["php-fpm"]

# ── Prod ─────────────────────────────────────────────────────────────────────
FROM base AS prod
ENV APP_ENV=prod

COPY composer.json composer.lock* ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --optimize-autoloader

COPY . .
RUN composer dump-autoload --optimize --no-dev \
    && php bin/console cache:warmup

EXPOSE 9000
CMD ["php-fpm"]
