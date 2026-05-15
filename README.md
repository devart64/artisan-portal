# Artisan Portal

> Le portail client SaaS pour artisans. Devis, factures, photos, planning — tout en un. Fini les appels de suivi.

---

## Démarrage rapide

```bash
git clone https://github.com/devart64/artisan-portal
cd artisan-portal
make install
```

C'est tout. En 2 minutes vous avez :

| Service | URL |
|---------|-----|
| **Application** (Next.js) | http://localhost:3000 |
| **API** (Symfony) | http://localhost:8000 |
| **Emails** (Mailpit) | http://localhost:8025 |

---

## Stack technique

```
┌─────────────────────────────────────────────────────────┐
│  Frontend          Next.js 15 · TypeScript · Tailwind   │
│  UI                shadcn/ui · Radix UI                  │
├─────────────────────────────────────────────────────────┤
│  Backend           Symfony 7.2 · PHP 8.3                │
│  API               API Platform 3.3 (REST + JSON-LD)    │
│  Auth              LexikJWT · Magic links               │
│  ORM               Doctrine 3 · PostgreSQL 16           │
│  Fichiers          Flysystem · AWS S3                   │
├─────────────────────────────────────────────────────────┤
│  Infra             Docker Compose · Nginx · Redis       │
│  Emails (dev)      Mailpit                              │
│  Paiement          Stripe Subscriptions                 │
│  SMS               Twilio (plan Pro+)                   │
└─────────────────────────────────────────────────────────┘
```

---

## Architecture

### Multi-tenant
Chaque artisan est un **Tenant** isolé. Toutes les données sont filtrées automatiquement par `tenant_id` via un filtre Doctrine global — aucune donnée cross-tenant n'est possible.

### Auth dual
- **Artisan / Collaborateur** → JWT (cookie HttpOnly, TTL 1h)
- **Client final** → Magic link (token unique 30j, sans compte à créer)

### Portail client
Le client reçoit un lien unique par email (`/portal/{token}`). Il accède à son chantier en lecture : documents, photos, planning, messagerie. Aucune inscription requise.

---

## Commandes Make

```bash
make install        # Premier lancement (copie .env, build, démarre tout)
make dev            # Affiche les logs en direct
make stop           # Arrête les conteneurs
make restart        # Redémarre tous les services

make shell-backend  # Shell PHP dans le conteneur
make shell-frontend # Shell Node dans le conteneur
make shell-db       # psql direct

make migrate        # Joue les migrations Doctrine
make migrate-diff   # Génère une migration depuis les entités
make jwt            # Régénère les clés JWT

make test           # Tests PHPUnit
make lint           # ESLint frontend
make typecheck      # Vérification TypeScript

make logs-backend   # Logs Symfony + Nginx
make logs-frontend  # Logs Next.js
make clean          # Supprime les conteneurs (données conservées)
make reset          # ⚠️  Repart de zéro (données supprimées)
```

---

## Structure du monorepo

```
artisan-portal/
├── backend/                   # Symfony 7
│   ├── src/
│   │   ├── Controller/        # AuthController, PortalController...
│   │   ├── Entity/            # Tenant, User, Chantier, Document...
│   │   ├── Enum/              # PlanEnum, ChantierStatusEnum...
│   │   ├── Service/           # FileUploadService, MagicLinkService...
│   │   ├── Voter/             # ChantierVoter, DocumentVoter...
│   │   └── Security/          # ClientTokenAuthenticator
│   ├── config/
│   ├── docker/                # nginx.conf, php.ini, entrypoint.sh
│   └── Dockerfile
│
├── frontend/                  # Next.js 15
│   ├── app/
│   │   ├── (auth)/            # /login  /register
│   │   ├── (dashboard)/       # /dashboard  /chantiers  /clients  /settings
│   │   └── portal/[token]/    # Portail client public
│   ├── components/
│   │   ├── ui/                # shadcn/ui
│   │   ├── chantier/          # Composants métier
│   │   └── shared/            # Sidebar, Header, DropZone
│   ├── lib/                   # api.ts, auth.ts, portal.ts, types.ts
│   └── Dockerfile
│
├── docker-compose.yml
├── Makefile
└── README.md
```

---

## Variables d'environnement

Le fichier `backend/.env` est généré automatiquement depuis `.env.example` au premier `make install`. Modifiez-le pour configurer :

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Connexion PostgreSQL (pré-configuré pour Docker) |
| `JWT_PASSPHRASE` | Passphrase des clés JWT |
| `MAILER_DSN` | SMTP (Mailpit en dev, Resend/SES en prod) |
| `AWS_*` | Credentials S3 pour le stockage fichiers |
| `STRIPE_SECRET_KEY` | Clé Stripe pour la facturation |
| `TWILIO_*` | Credentials SMS (plan Pro+) |
| `FRONTEND_URL` | URL du frontend (pour les liens dans les emails) |

---

## Plans & fonctionnalités

| | Starter · 29€/mois | Pro · 59€/mois | Business · 99€/mois |
|--|--|--|--|
| Chantiers | 5 actifs | Illimité | Illimité |
| Documents & photos | ✓ | ✓ | ✓ |
| Portail client magic link | ✓ | ✓ | ✓ |
| Notifications email | ✓ | ✓ | ✓ |
| Planning & jalons | — | ✓ | ✓ |
| SMS notifications | — | ✓ | ✓ |
| Messagerie artisan/client | — | ✓ | ✓ |
| Branding personnalisé | — | ✓ | ✓ |
| Multi-collaborateurs | — | — | ✓ |
| API publique | — | — | ✓ |

---

## Déploiement production

**Backend** → [Railway](https://railway.app) (PHP + PostgreSQL)
```bash
# Variables d'env à configurer dans Railway
APP_ENV=prod
DATABASE_URL=postgresql://...
JWT_PASSPHRASE=...
AWS_ACCESS_KEY_ID=...
```

**Frontend** → [Vercel](https://vercel.com)
```bash
# Variable d'env Vercel
NEXT_PUBLIC_API_URL=https://api.artisanportal.fr
```

---

## Licence

Propriétaire — tous droits réservés.
