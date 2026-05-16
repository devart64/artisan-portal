# Documentation — Artisan Portal

Bienvenue dans la documentation technique complète d'Artisan Portal.

---

## Index

| Document | Contenu |
|----------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Vue d'ensemble, schéma BDD, multi-tenancy, flux d'auth, PWA, push, audit |
| [BACKEND.md](./BACKEND.md) | Entités, enums, routes API, services, 2FA, push, audit, commandes, migrations, tests |
| [FRONTEND.md](./FRONTEND.md) | Pages, composants, PWA, notifications, lib/, middleware, SEO |
| [AGENTS.md](./AGENTS.md) | Agents IA marketing, scheduler, services email/SMS/scraping |
| [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) | Docker, Makefile, CI/CD GitHub Actions |
| [CONFIGURATION.md](./CONFIGURATION.md) | Toutes les variables d'environnement (VAPID, admin, Stripe, Anthropic…) |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Déploiement Railway, Vercel, AWS S3, Stripe, checklist de lancement |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Installation locale, workflow, commandes utiles, résolution de problèmes |

---

## Démarrage rapide

```bash
git clone https://github.com/devart64/artisan-portal.git
cd artisan-portal
make install   # Installe tout et lance les services
```

Puis ouvrir http://localhost:3000

---

## Architecture en un coup d'œil

```
Backend  : Symfony 7.2 + API Platform + PostgreSQL (multi-tenant par SQL filter)
Frontend : Next.js 15 App Router + Tailwind + shadcn/ui (PWA installable)
Agents   : Node.js + Claude API + Resend + Twilio + Sirene API
Auth     : JWT (artisans) + Magic Link 30j (clients finaux) + 2FA TOTP (optionnel)
Fichiers : AWS S3 (pre-signed URLs uniquement)
Push     : Web Push API / VAPID (minishlink/web-push)
PDF      : dompdf (génération côté serveur)
```

---

## Par où commencer ?

- **Nouveau sur le projet** → [ARCHITECTURE.md](./ARCHITECTURE.md) puis [DEVELOPMENT.md](./DEVELOPMENT.md)
- **Développer une feature backend** → [BACKEND.md](./BACKEND.md)
- **Développer une page frontend** → [FRONTEND.md](./FRONTEND.md)
- **Configurer les agents IA** → [AGENTS.md](./AGENTS.md)
- **Déployer en production** → [CONFIGURATION.md](./CONFIGURATION.md) puis [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Problème de démarrage** → [DEVELOPMENT.md — Résolution de problèmes](./DEVELOPMENT.md#résolution-de-problèmes-courants)
