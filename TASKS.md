# TASKS.md — Artisan Portal

Claude Code : traite les tâches dans l'ordre. Coche chaque tâche terminée `[x]` avant de passer à la suivante. Ne passe pas à un sprint suivant sans que toutes les tâches du sprint courant soient cochées.

---

## 📌 État réel (mis à jour le 2026-06-17)

Le code est **déjà bien plus avancé que ce planning initial** (itérations V2 → V4 :
PDF, IA devis, ICS, clés API, push, 2FA, audit, export compta…). Ce fichier a été
réaligné sur la réalité.

**Vérifié dans cette passe (backend)** :
- `composer install` OK, kernel Symfony 7.2 boote.
- 9 migrations Doctrine s'appliquent sans erreur sur PostgreSQL 16.
- Suite de tests **verte : 41 tests / 86 assertions** (auth, isolation tenant,
  voters, magic link portail, leads).
- Bugs de bootstrap corrigés : env de test (`APP_ENV`), défauts `CORS_ALLOW_ORIGIN`
  et `LOCK_DSN`, instanciation paresseuse des clients Stripe & WebPush, isolation
  du rate-limiter en test.

**Pas (encore) vérifié dans cette passe** : le frontend Next.js, et les intégrations
externes réelles (S3, Stripe live, SMTP, Twilio) — leur code existe et est câblé,
mais n'a pas été testé en conditions réelles ici. Ces points restent `[ ]` ou sont
annotés _(code présent, intégration non testée)_.

---

## 🎯 MVP — le cœur irréductible

Le but n'est pas de tout faire, mais de résoudre un problème concret : **le suivi
client et la perte de temps administrative**. Ce qu'un premier client payant a
réellement besoin de voir :

1. **Espace client par magic link** (lecture seule, sans compte à créer) ✅ backend
2. **Suivi du chantier** : statut + avancement (jalons / %) ✅ backend
3. **Documents** : devis & factures consultables / téléchargeables ✅ backend
4. **Photos d'avancement** ✅ backend
5. **Notification basique** (email à chaque nouveauté) ✅ backend

> Tout le reste — messagerie bidirectionnelle, SMS, branding, multi-collaborateurs,
> IA, 2FA, export compta, clés API — est **post-MVP**. Utile pour vendre plus cher,
> mais pas pour valider que des artisans paient. Ne pas laisser ces features retarder
> la confrontation au premier vrai client.

---

## SPRINT 1 — Fondations backend (Sem. 1-2) ✅

### Setup
- [x] Initialiser Symfony 7 dans `backend/` avec le skeleton minimal
- [x] Installer toutes les dépendances listées dans `backend/composer.json`
- [x] Configurer PostgreSQL dans `backend/.env` (depuis `.env.example`)
- [x] Générer les clés JWT : `php bin/console lexik:jwt:generate-keypair`

### Entités Doctrine
- [x] Créer l'enum `PlanEnum` (starter, pro, business)
- [x] Créer l'enum `PlanStatusEnum` (trialing, active, past_due, canceled)
- [x] Créer l'enum `UserRoleEnum` (admin, collaborator)
- [x] Créer l'enum `ChantierStatusEnum` (en_attente, en_cours, termine, annule)
- [x] Créer l'enum `DocumentTypeEnum` (devis, facture, plan, autre)
- [x] Créer l'enum `DocumentStatusEnum` (en_attente, accepte, refuse, paye, en_retard)
- [x] Créer l'entité `Tenant` avec tous ses champs
- [x] Créer l'entité `User` (implements UserInterface + PasswordAuthenticatedUserInterface)
- [x] Créer l'entité `Client`
- [x] Créer l'entité `Chantier` avec relations OneToMany
- [x] Créer l'entité `Jalon`
- [x] Créer l'entité `Document`
- [x] Créer l'entité `Photo`
- [x] Créer l'entité `Message`
- [x] Créer l'entité `ClientToken` (token = bin2hex(random_bytes(32)), expires +30j)

### Multi-tenant
- [x] Créer `TenantFilter` Doctrine (filtre global sur `tenant_id`)
- [x] Créer `TenantFilterSubscriber` (active le filtre sur chaque requête authentifiée)
- [x] Créer `TenantContext` service (résout le tenant depuis le JWT courant)

### Auth
- [x] Configurer `security.yaml` : firewall JWT pour `/api/` sauf `/api/auth/`
- [x] Créer `AuthController` : `POST /api/auth/register` (crée tenant + user + hash password)
- [x] Créer `AuthController` : `POST /api/auth/login` (retourne JWT via LexikJWT)
- [x] Créer `ClientTokenAuthenticator` (authentifie les requêtes portail via token URL)

### Migrations & CI
- [x] Générer la migration initiale : `php bin/console doctrine:migrations:diff`
- [x] Vérifier que `doctrine:migrations:migrate` passe sans erreur
- [x] Créer `backend/Makefile` avec les commandes courantes (install, migrate, test, jwt)

---

## SPRINT 2 — CRUD chantiers & uploads (Sem. 3-4) ✅

### Sécurité
- [x] Créer `ChantierVoter` (view, edit, delete — vérifie tenant)
- [x] Créer `ClientVoter`
- [x] Créer `DocumentVoter`

### API Platform — Chantiers
- [x] Exposer `Chantier` via API Platform (GET collection, GET item, POST, PATCH, DELETE)
- [x] Filtrer automatiquement par tenant (via TenantFilter + TenantContext)
- [ ] Créer DTO `ChantierInput` avec validation Symfony (Assert) _(pas de DTO dédié ; validation via contraintes Assert sur l'entité/contrôleur)_
- [x] Ajouter les endpoints jalons : GET/POST `/api/chantiers/{id}/jalons`, PATCH `/api/jalons/{id}`

### API Platform — Clients
- [x] Exposer `Client` via API Platform (GET, POST, PATCH, DELETE)
- [x] Isoler par tenant

### Uploads — Flysystem S3 _(code présent, intégration S3 non testée ici)_
- [x] Configurer Flysystem dans `flysystem.yaml` (bucket S3 privé)
- [x] Créer `FileUploadService` : upload, suppression, génération URL pré-signée (TTL 1h)
- [x] Endpoint `POST /api/chantiers/{id}/documents` (multipart/form-data → S3 → Document en BDD)
- [x] Endpoint `GET /api/documents/{id}/download` (retourne URL pré-signée)
- [x] Endpoint `PATCH /api/documents/{id}` (changer statut)
- [x] Endpoint `POST /api/chantiers/{id}/photos` (upload + compression si nécessaire)
- [x] Endpoint `GET /api/chantiers/{id}/photos`

### Messagerie
- [x] Endpoint `GET /api/chantiers/{id}/messages`
- [x] Endpoint `POST /api/chantiers/{id}/messages`

---

## SPRINT 3 — Portail client magic link (Sem. 5) ✅

### Magic link _(envoi email non testé en réel ici)_
- [x] Créer `MagicLinkService` : génère `ClientToken`, envoie email via Symfony Mailer
- [x] Endpoint `POST /api/auth/magic-link` (body: client_id + chantier_id → envoie email)
- [x] Email template magic link (HTML, lien vers `frontend/portal/{token}`)

### Portail client (auth par token)
- [x] `ClientTokenAuthenticator` valide le token (expiration + client/chantier match)
- [x] Endpoint `GET /api/portal/{token}` — résumé chantier (titre, statut, dates, % jalons)
- [x] Endpoint `GET /api/portal/{token}/documents` — liste docs (sans file_path exposé)
- [x] Endpoint `GET /api/portal/{token}/documents/{id}/download` — URL pré-signée S3
- [x] Endpoint `GET /api/portal/{token}/photos` — liste avec URL pré-signées
- [x] Endpoint `GET /api/portal/{token}/planning` — jalons
- [x] Endpoint `GET /api/portal/{token}/messages`
- [x] Endpoint `POST /api/portal/{token}/messages` — client répond
- [x] Rate limiting sur `/api/portal/` (symfony/rate-limiter, 60 req/min)

---

## SPRINT 4 — Notifications & dashboard frontend (Sem. 6)

### Notifications backend _(code présent, envoi réel email/SMS non testé ici)_
- [x] Créer `NotificationService` (Symfony Mailer + Twilio SMS conditionnel selon plan)
- [x] Email : nouveau document uploadé → notifier client
- [x] Email : statut chantier changé → notifier client
- [x] Email : nouveau message artisan → notifier client
- [x] Email : nouveau message client → notifier artisan
- [x] SMS (plan Pro+) : jalon atteint → notifier client
- [x] Créer les templates email (HTML Twig)

### Frontend Next.js — Setup _(non vérifié dans cette passe)_
- [ ] Initialiser Next.js 15 dans `frontend/` avec TypeScript + Tailwind + App Router
- [ ] Installer shadcn/ui et configurer le thème
- [ ] Configurer `lib/api.ts` (fetch wrapper avec JWT auto depuis cookie HttpOnly)
- [ ] Configurer `middleware.ts` (protège `/dashboard/*`, redirige vers `/login` si non auth)
- [ ] Configurer `lib/auth.ts` (login → stocke JWT en cookie HttpOnly, logout)

### Frontend — Auth _(non vérifié dans cette passe)_
- [ ] Page `/login` (form email/password → POST `/api/auth/login` → cookie JWT)
- [ ] Page `/register` (form → POST `/api/auth/register`)

### Frontend — Dashboard artisan _(non vérifié dans cette passe)_
- [ ] Layout dashboard (sidebar nav : Chantiers, Clients, Paramètres)
- [ ] Page `/dashboard` (chantiers actifs, messages non lus, docs récents)
- [ ] Page `/chantiers` (liste avec statut + client)
- [ ] Page `/chantiers/new` (formulaire création)
- [ ] Page `/chantiers/[id]` (détail : onglets Documents / Photos / Planning / Messages)
- [ ] Upload documents (drag & drop, progress bar)
- [ ] Upload photos (drag & drop, galerie)
- [ ] Planning jalons (liste + toggle done)
- [ ] Messagerie (fil de discussion)
- [ ] Page `/clients` (liste + création)
- [ ] Bouton "Envoyer portail" → POST `/api/auth/magic-link`

---

## SPRINT 5 — Billing & onboarding (Sem. 7)

### Stripe backend _(code présent, intégration Stripe live non testée ici)_
- [x] Créer `StripeService` (créer customer, créer subscription, lien portail client)
- [x] `StripeWebhookController` : gérer `customer.subscription.updated`, `invoice.payment_failed`, `customer.subscription.deleted`
- [x] Mettre à jour `tenant.plan` et `tenant.plan_status` selon les events Stripe
- [x] Endpoint `GET /api/stripe/portal-url` (retourne lien Stripe Customer Portal)

### Stripe frontend _(non vérifié dans cette passe)_
- [ ] Page `/settings/billing` (plan courant, lien → Stripe Customer Portal)
- [ ] Guard plan dans l'UI (désactiver SMS si plan < Pro, etc.)

### Branding tenant _(non vérifié dans cette passe)_
- [ ] Page `/settings` (upload logo, couleur principale, nom affiché)
- [ ] Le portail client utilise `tenant.brandColor` et `tenant.logoUrl`

### Portail client frontend _(non vérifié dans cette passe)_
- [ ] Page `/portal/[token]` (résumé chantier : branding artisan, statut, % progression)
- [ ] Onglet Documents (liste + download)
- [ ] Onglet Photos (galerie)
- [ ] Onglet Planning (jalons)
- [ ] Onglet Messages (fil + réponse client)
- [ ] Page 404/expired si token invalide ou expiré

### Onboarding _(non vérifié dans cette passe)_
- [ ] Tunnel inscription : register → créer premier chantier → inviter premier client
- [ ] Email de bienvenue artisan après register

---

## SPRINT 6 — Beta & stabilisation (Sem. 8)

- [x] Écrire tests PHPUnit sur les Voters et Services critiques _(41 tests verts)_
- [x] Vérifier l'isolation tenant (test cross-tenant impossible) _(couvert par les tests)_
- [x] Vérifier l'expiration des magic links _(couvert par PortalControllerTest)_
- [ ] Vérifier les URLs pré-signées S3 (expiration 1h) _(nécessite credentials S3)_
- [ ] Tester le webhook Stripe en local (`stripe listen`)
- [x] Audit CORS (autoriser uniquement le domaine frontend) _(CorsSubscriber + CORS_ALLOW_ORIGIN)_
- [ ] Ajouter Sentry backend (PHP) et frontend (JS)
- [x] Vérifier les rate limiters portail et auth _(testés)_
- [x] Créer `docker-compose.yml` pour dev local (PostgreSQL + Redis)

---

## SPRINT 7 — Launch (Sem. 9-10)

- [ ] Configurer déploiement Railway (backend Symfony + PostgreSQL)
- [ ] Configurer déploiement Vercel (frontend Next.js)
- [ ] Configurer GitHub Actions CI (tests PHP + build Next.js)
- [ ] Variables d'environnement production injectées dans Railway + Vercel
- [ ] Créer landing page (`/` hors dashboard)
- [ ] Configurer domaine custom (`api.artisanportal.fr` + `app.artisanportal.fr`)
- [ ] Tests end-to-end parcours artisan complet
- [ ] Tests end-to-end parcours client (magic link → portail)
- [ ] 🚀 Lancement

---

## ⏭️ Prochaine étape recommandée

Le backend est solide et vérifié. Le maillon non confirmé, c'est le **frontend** :
1. Lancer `cd frontend && pnpm install && pnpm dev` et vérifier qu'il build.
2. Confirmer le parcours bout-en-bout du MVP : register artisan → créer chantier →
   uploader une photo + un devis → envoyer le magic link → ouvrir le portail client.
3. Mettre en place la CI (Sprint 7) pour que `composer test` + build Next.js tournent
   automatiquement et évitent les régressions de bootstrap comme celles corrigées ici.
