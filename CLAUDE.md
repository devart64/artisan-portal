# CLAUDE.md — Artisan Portal (Racine)

Projet SaaS B2B pour artisans français. Portail client multi-tenant avec magic links.

## Structure du monorepo

```
artisan-portal/
├── backend/    # Symfony 7.2 + API Platform + PostgreSQL
├── frontend/   # Next.js 15 + TypeScript + Tailwind + shadcn/ui
├── TASKS.md    # Sprints de développement
└── CLAUDE.md   # Ce fichier
```

Chaque sous-répertoire a son propre `CLAUDE.md` avec les conventions spécifiques.

## Architecture globale

- **Multi-tenant** : chaque artisan est un `Tenant`. Toutes les données sont isolées par tenant.
- **Auth artisan** : JWT via LexikJWT (stocké en cookie HttpOnly côté frontend)
- **Auth client final** : magic link (token en URL) → pas de compte à créer
- **Fichiers** : stockés sur S3 via Flysystem, jamais d'URL publique directe (pre-signed URLs)

## Rôles

| Rôle | Auth | Accès |
|------|------|-------|
| Artisan (Admin) | Email + password → JWT | Dashboard complet |
| Collaborateur | Email + password → JWT | Upload photos/docs |
| Client final | Magic link (token URL) | Portail lecture seule |

## Plans

| Plan | Prix | Limites |
|------|------|---------|
| Starter | 29€/mois | 5 chantiers, pas de SMS |
| Pro | 59€/mois | Illimité, SMS, branding |
| Business | 99€/mois | Multi-collaborateurs, API |

## Variables d'environnement clés

Backend : voir `backend/.env.example`
Frontend : `NEXT_PUBLIC_API_URL` → URL du backend Symfony

## Lancer en développement

```bash
# Backend
cd backend && make install && make jwt && make migrate
symfony serve  # ou php -S localhost:8000 public/index.php

# Frontend
cd frontend && pnpm install && pnpm dev
```
