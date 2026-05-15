# TASKS.md — Artisan Portal

Claude Code : traite les tâches dans l'ordre. Coche chaque tâche terminée `[x]` avant de passer à la suivante. Ne passe pas à un sprint suivant sans que toutes les tâches du sprint courant soient cochées.

---

## SPRINT 1 — Fondations backend (Sem. 1-2)

### Setup
- [ ] Initialiser Symfony 7 dans `backend/` avec le skeleton minimal
- [ ] Installer toutes les dépendances listées dans `backend/composer.json`
- [ ] Configurer PostgreSQL dans `backend/.env` (depuis `.env.example`)
- [ ] Générer les clés JWT : `php bin/console lexik:jwt:generate-keypair`

### Entités Doctrine
- [ ] Créer l'enum `PlanEnum` (starter, pro, business)
- [ ] Créer l'enum `PlanStatusEnum` (trialing, active, past_due, canceled)
- [ ] Créer l'enum `UserRoleEnum` (admin, collaborator)
- [ ] Créer l'enum `ChantierStatusEnum` (en_attente, en_cours, termine, annule)
- [ ] Créer l'enum `DocumentTypeEnum` (devis, facture, plan, autre)
- [ ] Créer l'enum `DocumentStatusEnum` (en_attente, accepte, refuse, paye, en_retard)
- [ ] Créer l'entité `Tenant` avec tous ses champs
- [ ] Créer l'entité `User` (implements UserInterface + PasswordAuthenticatedUserInterface)
- [ ] Créer l'entité `Client`
- [ ] Créer l'entité `Chantier` avec relations OneToMany
- [ ] Créer l'entité `Jalon`
- [ ] Créer l'entité `Document`
- [ ] Créer l'entité `Photo`
- [ ] Créer l'entité `Message`
- [ ] Créer l'entité `ClientToken` (token = bin2hex(random_bytes(32)), expires +30j)

### Multi-tenant
- [ ] Créer `TenantFilter` Doctrine (filtre global sur `tenant_id`)
- [ ] Créer `TenantFilterSubscriber` (active le filtre sur chaque requête authentifiée)
- [ ] Créer `TenantContext` service (résout le tenant depuis le JWT courant)

### Auth
- [ ] Configurer `security.yaml` : firewall JWT pour `/api/` sauf `/api/auth/`
- [ ] Créer `AuthController` : `POST /api/auth/register` (crée tenant + user + hash password)
- [ ] Créer `AuthController` : `POST /api/auth/login` (retourne JWT via LexikJWT)
- [ ] Créer `ClientTokenAuthenticator` (authentifie les requêtes portail via token URL)

### Migrations & CI
- [ ] Générer la migration initiale : `php bin/console doctrine:migrations:diff`
- [ ] Vérifier que `doctrine:migrations:migrate` passe sans erreur
- [ ] Créer `backend/Makefile` avec les commandes courantes (install, migrate, test, jwt)

---

## SPRINT 2 — CRUD chantiers & uploads (Sem. 3-4)

### Sécurité
- [ ] Créer `ChantierVoter` (view, edit, delete — vérifie tenant)
- [ ] Créer `ClientVoter`
- [ ] Créer `DocumentVoter`

### API Platform — Chantiers
- [ ] Exposer `Chantier` via API Platform (GET collection, GET item, POST, PATCH, DELETE)
- [ ] Filtrer automatiquement par tenant (via TenantFilter + TenantContext)
- [ ] Créer DTO `ChantierInput` avec validation Symfony (Assert)
- [ ] Ajouter les endpoints jalons : GET/POST `/api/chantiers/{id}/jalons`, PATCH `/api/jalons/{id}`

### API Platform — Clients
- [ ] Exposer `Client` via API Platform (GET, POST, PATCH, DELETE)
- [ ] Isoler par tenant

### Uploads — Flysystem S3
- [ ] Configurer Flysystem dans `flysystem.yaml` (bucket S3 privé)
- [ ] Créer `FileUploadService` : upload, suppression, génération URL pré-signée (TTL 1h)
- [ ] Endpoint `POST /api/chantiers/{id}/documents` (multipart/form-data → S3 → Document en BDD)
- [ ] Endpoint `GET /api/documents/{id}/download` (retourne URL pré-signée)
- [ ] Endpoint `PATCH /api/documents/{id}` (changer statut)
- [ ] Endpoint `POST /api/chantiers/{id}/photos` (upload + compression si nécessaire)
- [ ] Endpoint `GET /api/chantiers/{id}/photos`

### Messagerie
- [ ] Endpoint `GET /api/chantiers/{id}/messages`
- [ ] Endpoint `POST /api/chantiers/{id}/messages`

---

## SPRINT 3 — Portail client magic link (Sem. 5)

### Magic link
- [ ] Créer `MagicLinkService` : génère `ClientToken`, envoie email via Symfony Mailer
- [ ] Endpoint `POST /api/auth/magic-link` (body: client_id + chantier_id → envoie email)
- [ ] Email template magic link (HTML, lien vers `frontend/portal/{token}`)

### Portail client (auth par token)
- [ ] `ClientTokenAuthenticator` valide le token (expiration + client/chantier match)
- [ ] Endpoint `GET /api/portal/{token}` — résumé chantier (titre, statut, dates, % jalons)
- [ ] Endpoint `GET /api/portal/{token}/documents` — liste docs (sans file_path exposé)
- [ ] Endpoint `GET /api/portal/{token}/documents/{id}/download` — URL pré-signée S3
- [ ] Endpoint `GET /api/portal/{token}/photos` — liste avec URL pré-signées
- [ ] Endpoint `GET /api/portal/{token}/planning` — jalons
- [ ] Endpoint `GET /api/portal/{token}/messages`
- [ ] Endpoint `POST /api/portal/{token}/messages` — client répond
- [ ] Rate limiting sur `/api/portal/` (symfony/rate-limiter, 60 req/min)

---

## SPRINT 4 — Notifications & dashboard frontend (Sem. 6)

### Notifications backend
- [ ] Créer `NotificationService` (Symfony Mailer + Twilio SMS conditionnel selon plan)
- [ ] Email : nouveau document uploadé → notifier client
- [ ] Email : statut chantier changé → notifier client
- [ ] Email : nouveau message artisan → notifier client
- [ ] Email : nouveau message client → notifier artisan
- [ ] SMS (plan Pro+) : jalon atteint → notifier client
- [ ] Créer les templates email (HTML Twig)

### Frontend Next.js — Setup
- [ ] Initialiser Next.js 15 dans `frontend/` avec TypeScript + Tailwind + App Router
- [ ] Installer shadcn/ui et configurer le thème
- [ ] Configurer `lib/api.ts` (fetch wrapper avec JWT auto depuis cookie HttpOnly)
- [ ] Configurer `middleware.ts` (protège `/dashboard/*`, redirige vers `/login` si non auth)
- [ ] Configurer `lib/auth.ts` (login → stocke JWT en cookie HttpOnly, logout)

### Frontend — Auth
- [ ] Page `/login` (form email/password → POST `/api/auth/login` → cookie JWT)
- [ ] Page `/register` (form → POST `/api/auth/register`)

### Frontend — Dashboard artisan
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

### Stripe backend
- [ ] Créer `StripeService` (créer customer, créer subscription, lien portail client)
- [ ] `StripeWebhookController` : gérer `customer.subscription.updated`, `invoice.payment_failed`, `customer.subscription.deleted`
- [ ] Mettre à jour `tenant.plan` et `tenant.plan_status` selon les events Stripe
- [ ] Endpoint `GET /api/stripe/portal-url` (retourne lien Stripe Customer Portal)

### Stripe frontend
- [ ] Page `/settings/billing` (plan courant, lien → Stripe Customer Portal)
- [ ] Guard plan dans l'UI (désactiver SMS si plan < Pro, etc.)

### Branding tenant
- [ ] Page `/settings` (upload logo, couleur principale, nom affiché)
- [ ] Le portail client utilise `tenant.brandColor` et `tenant.logoUrl`

### Portail client frontend
- [ ] Page `/portal/[token]` (résumé chantier : branding artisan, statut, % progression)
- [ ] Onglet Documents (liste + download)
- [ ] Onglet Photos (galerie)
- [ ] Onglet Planning (jalons)
- [ ] Onglet Messages (fil + réponse client)
- [ ] Page 404/expired si token invalide ou expiré

### Onboarding
- [ ] Tunnel inscription : register → créer premier chantier → inviter premier client
- [ ] Email de bienvenue artisan après register

---

## SPRINT 6 — Beta & stabilisation (Sem. 8)

- [ ] Écrire tests PHPUnit sur les Voters et Services critiques
- [ ] Vérifier l'isolation tenant (test cross-tenant impossible)
- [ ] Vérifier l'expiration des magic links
- [ ] Vérifier les URLs pré-signées S3 (expiration 1h)
- [ ] Tester le webhook Stripe en local (`stripe listen`)
- [ ] Audit CORS (autoriser uniquement le domaine frontend)
- [ ] Ajouter Sentry backend (PHP) et frontend (JS)
- [ ] Vérifier les rate limiters portail et auth
- [ ] Créer `docker-compose.yml` pour dev local (PostgreSQL + Redis)

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
