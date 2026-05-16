# INFRASTRUCTURE — Artisan Portal

Documentation Docker, CI/CD, Makefile et configuration serveur.

---

## Docker Compose

Fichier : `docker-compose.yml` à la racine du projet.

### Services

#### `postgres` — Base de données

```yaml
image: postgres:16-alpine
ports: 5432:5432
environment:
  POSTGRES_DB: artisan_portal
  POSTGRES_USER: artisan
  POSTGRES_PASSWORD: artisan
volumes: postgres_data:/var/lib/postgresql/data
healthcheck: pg_isready -U artisan (interval: 5s, retries: 10)
```

#### `redis` — Cache et sessions

```yaml
image: redis:7-alpine
ports: 6379:6379
```
Utilisé par le rate limiter Symfony (`config/packages/rate_limiter.yaml`).

#### `mailpit` — Email de développement

```yaml
image: axllent/mailpit:latest
ports:
  - 1025:1025   # SMTP (MAILER_DSN=smtp://mailpit:1025)
  - 8025:8025   # Interface web : http://localhost:8025
```
Intercepte tous les emails envoyés en développement. Interface web pour consulter les emails.

#### `backend` — API Symfony (PHP-FPM)

```yaml
build: ./backend (Dockerfile multi-stage)
volumes:
  - ./backend:/var/www/html
  - backend_vendor:/var/www/html/vendor
  - jwt_keys:/var/www/html/config/jwt
depends_on:
  postgres: { condition: service_healthy }
healthcheck: php-fpm -t (interval: 10s, retries: 5)
entrypoint: docker/entrypoint.sh
```

#### `nginx` — Reverse proxy

```yaml
image: nginx:alpine
ports: 8000:80
volumes:
  - ./backend/docker/nginx.conf:/etc/nginx/conf.d/default.conf
  - ./backend:/var/www/html
depends_on: [backend]
```
Proxy vers PHP-FPM sur le port 9000. Sert les fichiers statiques directement.

#### `frontend` — App Next.js

```yaml
build: ./frontend (Dockerfile multi-stage)
ports: 3000:3000
volumes:
  - ./frontend:/app
  - frontend_node_modules:/app/node_modules
environment:
  NEXT_PUBLIC_API_URL: http://nginx
depends_on:
  backend: { condition: service_healthy }
  nginx: { condition: service_started }
healthcheck: wget -qO- http://localhost:3000/ (interval: 15s, retries: 5)
```

### Volumes

| Volume | Contenu | Pourquoi un volume |
|--------|---------|--------------------|
| `postgres_data` | Données PostgreSQL | Persister entre les redémarrages |
| `backend_vendor` | Dépendances Composer | Éviter de réinstaller à chaque rebuild |
| `frontend_node_modules` | Dépendances npm | Éviter de réinstaller à chaque rebuild |
| `jwt_keys` | Clés RSA JWT | Générées une seule fois, partagées backend/worker |

---

## Séquence de démarrage (`docker/entrypoint.sh`)

Exécuté au démarrage du conteneur backend :

```bash
1. Boucle PHP : attend que PostgreSQL réponde (PDO connect)
   → Empêche Symfony de démarrer avant que la DB soit prête

2. php bin/console lexik:jwt:generate-keypair --skip-if-exists
   → Génère config/jwt/private.pem et public.pem si absents
   → --skip-if-exists : idempotent, ne régénère pas à chaque restart

3. php bin/console doctrine:migrations:migrate --no-interaction
   → Applique toutes les migrations non encore jouées
   → Si la DB est vide : applique tout depuis Version20260516000001

4. exec php-fpm
   → Lance PHP-FPM en foreground (PID 1)
```

**Si le démarrage échoue** :
```bash
docker compose logs backend   # Voir les erreurs
docker compose exec backend bash  # Entrer dans le conteneur
```

---

## Configuration Nginx (`docker/nginx.conf`)

```nginx
server {
    listen 80;
    root /var/www/html/public;
    
    # Try files → index.php (Front Controller Symfony)
    location / {
        try_files $uri /index.php$is_args$args;
    }
    
    # PHP-FPM
    location ~ ^/index\.php(/|$) {
        fastcgi_pass backend:9000;
        fastcgi_split_path_info ...
    }
    
    # Bloquer l'accès aux autres .php
    location ~ \.php$ { return 404; }
    
    client_max_body_size 50M;  # Pour les uploads documents/photos
}
```

---

## Makefile — Toutes les commandes

### Root (`Makefile`)

| Commande | Description | Quand l'utiliser |
|----------|-------------|-----------------|
| `make install` | Installation complète (Docker build + deps + migrations) | Premier lancement, après un clone |
| `make dev` | Lance tous les services Docker en arrière-plan | Développement quotidien |
| `make stop` | Arrête tous les services | En fin de journée |
| `make restart` | Redémarre tous les services | Après modif docker-compose.yml |
| `make migrate` | Joue les migrations Doctrine | Après création d'une entité |
| `make migrate-diff` | Génère une migration depuis les entités | Après modif d'entité |
| `make test` | Lance PHPUnit (backend) | Avant chaque commit |
| `make lint` | ESLint frontend | Vérification qualité code |
| `make typecheck` | TypeScript check frontend | Avant déploiement |
| `make shell-backend` | Ouvre un shell dans le conteneur backend | Debug PHP |
| `make shell-frontend` | Ouvre un shell dans le conteneur frontend | Debug Node |
| `make jwt` | Régénère les clés JWT | Si les clés sont corrompues |
| `make reset` | ⚠️ Supprime tout (volumes, conteneurs) et réinstalle | Reset complet dev |
| `make logs` | Suit les logs de tous les services | Debug |

### Backend (`backend/Makefile`)

| Commande | Description |
|----------|-------------|
| `make install` | `composer install` |
| `make migrate` | `doctrine:migrations:migrate` |
| `make migrate-diff` | `doctrine:migrations:diff` |
| `make jwt` | `lexik:jwt:generate-keypair` |
| `make test` | `php bin/phpunit --testdox` |
| `make cache` | `cache:clear` |

---

## CI/CD — GitHub Actions

Fichier : `.github/workflows/ci.yml`

### Déclencheurs

```yaml
on:
  push:
    branches: [main, develop, "claude/*"]
  pull_request:
    branches: [main, develop]
```

### Job 1 : Backend (PHP)

```
ubuntu-latest + PHP 8.3 + Service PostgreSQL 16

Étapes :
1. Checkout code
2. Setup PHP 8.3 (extensions: pdo_pgsql, intl, zip, mbstring, apcu)
3. Cache Composer (key: composer-{hash(composer.lock)})
4. composer install --no-interaction --prefer-dist --no-scripts
5. Générer clés JWT (openssl genrsa + rsa -pubout)
6. php bin/phpunit --testdox
```

**Variables d'environnement CI** :
```
APP_ENV=test
DATABASE_URL=postgresql://artisan:artisan@localhost:5432/artisan_portal_test
JWT_SECRET_KEY=config/jwt/private.pem
JWT_PUBLIC_KEY=config/jwt/public.pem
JWT_PASSPHRASE=ci_passphrase
MAILER_DSN=null://null
AWS_ACCESS_KEY_ID=dummy
AWS_SECRET_ACCESS_KEY=dummy
STRIPE_SECRET_KEY=dummy
TWILIO_ACCOUNT_SID=dummy
FRONTEND_URL=http://localhost:3000
```

### Job 2 : Frontend (Node.js)

```
ubuntu-latest + Node 20 + pnpm

Étapes :
1. Checkout code
2. Setup Node 20 + corepack enable
3. Cache pnpm (.pnpm-store)
4. pnpm install --frozen-lockfile
5. pnpm typecheck  (tsc --noEmit)
6. pnpm lint       (next lint)
7. pnpm build      (next build)
```

### Job 3 : Deploy (main uniquement)

```
needs: [backend, frontend]
if: github.ref == 'refs/heads/main'

→ Affiche les instructions de déploiement Railway/Vercel
→ À étendre avec les vraies commandes CLI de déploiement
```

### Déboguer un job CI

```bash
# Voir les logs complets d'un job
# → onglet "Actions" dans GitHub → cliquer sur le job

# Reproduire en local
cd backend && php bin/phpunit --testdox
cd frontend && pnpm typecheck && pnpm lint && pnpm build
```

---

## Configuration PHP (`docker/php.ini`)

```ini
upload_max_filesize = 50M   # Documents et photos artisans
post_max_size = 55M
memory_limit = 256M
max_execution_time = 120
date.timezone = Europe/Paris

; OPcache (production)
opcache.enable = 1
opcache.memory_consumption = 128
opcache.validate_timestamps = 0  ; désactivé en prod
```

---

## .dockerignore

**Backend** (`backend/.dockerignore`) :
```
vendor/           # Réinstallé via composer install
var/cache/        # Régénéré
var/log/          # Logs locaux
config/jwt/       # Générés via entrypoint
.env              # Jamais dans l'image
tests/            # Pas en production
.git/
```

**Frontend** (`frontend/.dockerignore`) :
```
node_modules/     # Réinstallé
.next/            # Rebuild en prod
.pnpm-store/      # Cache pnpm
.env              # Variables injectées au runtime
.git/
```
