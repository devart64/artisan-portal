# BACKEND — Artisan Portal

Documentation complète du backend Symfony 7.2.

---

## Stack technique

| Composant | Version | Rôle |
|-----------|---------|------|
| PHP | 8.3 | Langage |
| Symfony | 7.2 | Framework |
| API Platform | 3.3 | Exposition REST/JSON-LD automatique |
| Doctrine ORM | 3 | ORM PostgreSQL |
| LexikJWT | 3.x | Authentification JWT artisan |
| Flysystem + AWS S3 | 3.x | Stockage fichiers |
| Stripe PHP SDK | 15.x | Abonnements |
| Twilio SDK | 8.x | Notifications SMS |
| dompdf/dompdf | 3.x | Génération PDF |
| minishlink/web-push | 6.x | Notifications push Web (VAPID) |
| spomky-labs/otphp | 11.x | 2FA TOTP (Google Authenticator) |
| PHPUnit | 11 | Tests |

---

## Entités

### Tenant

Table : `tenants` — Représente un compte artisan (un abonné).

| Champ | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | uuid | non | Identifiant unique |
| name | string(255) | non | Nom de l'entreprise |
| slug | string(100) | non | Identifiant URL unique (ex: `martin-plomberie`) |
| logoUrl | string(500) | oui | URL S3 du logo |
| brandColor | string(7) | non | Couleur hex (#1A56A0 par défaut) |
| stripeCustomerId | string(255) | oui | ID client Stripe |
| plan | PlanEnum | non | Plan actif (starter/pro/business) |
| planStatus | PlanStatusEnum | non | Statut (trialing/active/past_due/canceled) |
| createdAt | datetime | non | Date de création |

---

### User

Table : `users` — Artisan ou collaborateur authentifié par JWT.

| Champ | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | uuid | non | Identifiant unique |
| tenant | Tenant | non | Tenant propriétaire |
| email | string(180) | non | Email unique (login) |
| password | string(255) | non | Hash bcrypt |
| role | UserRoleEnum | non | ROLE_ARTISAN ou ROLE_COLLABORATEUR |
| totpSecret | string(255) | oui | Clé secrète TOTP pour la 2FA |
| totpEnabled | boolean | non | 2FA activée ? (défaut false) |

Implémente `UserInterface` et `PasswordAuthenticatedUserInterface`.
`getRoles()` retourne toujours `['ROLE_USER']` pour Symfony Security.

---

### Client

Table : `clients` — Client final d'un artisan.

| Champ | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | uuid | non | Identifiant unique |
| tenant | Tenant | non | Tenant propriétaire (TenantFilter actif) |
| name | string(255) | non | Nom complet du client |
| email | string(180) | oui | Email pour les magic links |
| phone | string(30) | oui | Téléphone pour les SMS |

Exposé via API Platform (`/api/clients`).

---

### Chantier

Table : `chantiers` — Chantier/projet d'un artisan.

| Champ | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | uuid | non | Identifiant unique |
| tenant | Tenant | non | Tenant propriétaire |
| client | Client | oui | Client associé |
| title | string(255) | non | Titre du chantier |
| description | text | oui | Description |
| status | ChantierStatusEnum | non | en_attente / en_cours / termine / archive |
| startDate | datetime | oui | Date de début |
| endDate | datetime | oui | Date de fin prévue |
| address | string(512) | oui | Adresse du chantier |
| createdAt | datetime | non | Date de création |
| updatedAt | datetime | oui | Dernière modification |

Relations OneToMany : jalons, documents, photos, messages.
Exposé via API Platform avec voter security.

---

### Jalon

Table : `jalons` — Étape d'avancement d'un chantier.

| Champ | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | uuid | non | Identifiant unique |
| chantier | Chantier | non | Chantier parent |
| title | string(255) | non | Intitulé de l'étape |
| date | date | oui | Date prévue |
| done | boolean | non | Complété ? (défaut false) |

---

### Document

Table : `documents` — Document uploadé sur un chantier.

| Champ | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | uuid | non | Identifiant unique |
| chantier | Chantier | non | Chantier parent |
| type | DocumentTypeEnum | non | devis / facture / plan / contrat / autre |
| label | string(255) | non | Nom affiché |
| filePath | string(500) | non | Chemin S3 (jamais exposé directement) |
| status | DocumentStatusEnum | oui | en_attente / signe / refuse |
| uploadedAt | datetime | non | Date d'upload |

---

### Photo

Table : `photos` — Photo d'un chantier.

| Champ | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | uuid | non | Identifiant unique |
| chantier | Chantier | non | Chantier parent |
| filePath | string(500) | non | Chemin S3 |
| caption | string(255) | oui | Légende |
| uploadedAt | datetime | non | Date d'upload |

---

### Message

Table : `messages` — Message artisan ↔ client sur un chantier.

| Champ | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | uuid | non | Identifiant unique |
| chantier | Chantier | non | Chantier parent |
| senderType | string(10) | non | `artisan` ou `client` |
| senderName | string(255) | non | Nom de l'expéditeur |
| content | text | non | Contenu du message |
| isRead | boolean | non | Lu ? (défaut false) |
| createdAt | datetime | non | Date d'envoi |

---

### ClientToken

Table : `client_tokens` — Token de magic link pour l'accès portail client.

| Champ | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | uuid | non | Identifiant unique |
| client | Client | non | Client concerné |
| chantier | Chantier | non | Chantier accessible |
| token | string(64) | non | Jeton unique `bin2hex(random_bytes(32))` |
| expiresAt | datetime | non | Expiration (+30 jours à la création) |
| createdAt | datetime | non | Date de création |

`isValid()` : retourne `true` si `expiresAt > now()`.

---

### Lead

Table : `leads` — Prospect artisan pour les agents IA marketing.

| Champ | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | uuid | non | Identifiant unique |
| name | string(255) | non | Nom du contact |
| email | string(255) | oui | Email (enrichi via Hunter.io) |
| phone | string(30) | oui | Téléphone |
| trade | string(100) | non | Métier (plombier, électricien...) |
| city | string(100) | oui | Ville |
| source | string(100) | oui | Source (sirene_api, prospection...) |
| score | smallint | non | Score qualification 0-100 |
| status | LeadStatusEnum | non | new/qualified/contacted/replied/converted/lost |
| notes | text | oui | Notes libres |
| lastContactedAt | datetime | oui | Dernier contact |
| createdAt | datetime | non | Date de création |

---

### Notification

Table : `notifications` — Notifications in-app pour les artisans.

| Champ | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | uuid | non | Identifiant unique |
| tenant | Tenant | non | Tenant destinataire |
| type | string(100) | non | Type (new_message, document_signed, etc.) |
| title | string(255) | non | Titre de la notification |
| body | text | oui | Corps du message |
| isRead | boolean | non | Lue ? (défaut false) |
| relatedId | uuid | oui | ID de la ressource liée (chantier, document…) |
| createdAt | datetime | non | Date de création |

---

### AuditLog

Table : `audit_logs` — Journal d'activité traçant les actions importantes.

| Champ | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | uuid | non | Identifiant unique |
| tenant | Tenant | non | Tenant concerné |
| user | User | oui | Utilisateur ayant effectué l'action |
| action | string(100) | non | Action effectuée (chantier.create, document.sign, etc.) |
| resourceType | string(100) | oui | Type de ressource (Chantier, Document…) |
| resourceId | uuid | oui | ID de la ressource |
| context | json | oui | Données contextuelles libres |
| ipAddress | string(45) | oui | IP de l'utilisateur |
| createdAt | datetime | non | Date de l'action |

---

### PushSubscription

Table : `push_subscriptions` — Abonnements Web Push (VAPID) des navigateurs.

| Champ | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | uuid | non | Identifiant unique |
| tenant | Tenant | non | Tenant propriétaire |
| user | User | non | Utilisateur abonné |
| endpoint | string(2000) | non | URL d'endpoint Push du navigateur |
| p256dh | string(255) | non | Clé publique P-256 du navigateur |
| auth | string(255) | non | Clé d'authentification |
| createdAt | datetime | non | Date d'inscription |

---

### ApiKey

Table : `api_keys` — Clés API pour intégrations tierces (plan Business).

| Champ | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | uuid | non | Identifiant unique |
| tenant | Tenant | non | Tenant propriétaire |
| name | string(255) | non | Nom descriptif de la clé |
| keyHash | string(255) | non | Hash SHA-256 de la clé (la clé brute n'est stockée qu'au moment de la création) |
| prefix | string(8) | non | Préfixe visible (ex: `ap_live_`) |
| lastUsedAt | datetime | oui | Dernière utilisation |
| createdAt | datetime | non | Date de création |

---

## Enums

### PlanEnum
```
starter   → "Débutant" (29€/mois, 5 chantiers max, pas de SMS, pas d'API keys)
pro       → "Professionnel" (59€/mois, illimité, SMS inclus)
business  → "Entreprise" (99€/mois, multi-collab, API keys, agents IA)
```
Méthode `allowsSms()` : retourne `true` pour `pro` et `business`.
Méthode `allowsApiKeys()` : retourne `true` pour `business` uniquement.
Méthode `label()` : retourne le nom commercial.

### PlanStatusEnum
```
trialing   → Période d'essai gratuite (14 jours)
active     → Abonnement actif et payé
past_due   → Paiement en retard
canceled   → Résilié
```

### UserRoleEnum
```
ROLE_ARTISAN        → Artisan propriétaire du compte (accès complet)
ROLE_COLLABORATEUR  → Collaborateur (upload photos/docs uniquement)
```

### ChantierStatusEnum
```
en_attente → Chantier créé, pas encore démarré
en_cours   → En cours de réalisation
termine    → Terminé
archive    → Archivé (masqué du dashboard principal)
```

### DocumentTypeEnum
```
devis    → Devis (label: "Devis")
facture  → Facture (label: "Facture")
plan     → Plan (label: "Plan")
contrat  → Contrat (label: "Contrat")
autre    → Autre (label: "Document")
```

### DocumentStatusEnum
```
en_attente → En attente de signature
signe      → Signé
refuse     → Refusé
```

### LeadStatusEnum
```
new        → Nouveau lead non traité
qualified  → Qualifié par l'agent IA
contacted  → Email/SMS envoyé
replied    → A cliqué sur "Je suis intéressé"
converted  → S'est inscrit et paie
lost       → Perdu (désabonné ou score trop bas)
```

---

## Routes API

### AuthController — `/api/auth/`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/api/auth/register` | Public | Crée un Tenant + User, retourne JWT |
| POST | `/api/auth/login` | Public | Login email/password, retourne JWT |
| POST | `/api/auth/forgot-password` | Public | Envoie un email de réinitialisation |
| POST | `/api/auth/reset-password` | Public | Réinitialise le mot de passe via token |
| POST | `/api/auth/invitation/accept/{token}` | Public | Accepte une invitation collaborateur |
| POST | `/api/auth/2fa/setup` | ROLE_USER | Génère le QR code TOTP |
| POST | `/api/auth/2fa/enable` | ROLE_USER | Active la 2FA (vérifie le premier code) |
| POST | `/api/auth/2fa/disable` | ROLE_USER | Désactive la 2FA |
| GET | `/api/auth/2fa/status` | ROLE_USER | Retourne si la 2FA est activée |

**POST /api/auth/register**
```json
Body: { "name": "Martin Plomberie", "email": "martin@example.com", "password": "secret123" }
Réponse 201: { "token": "eyJ..." }
```

**POST /api/auth/login**
```json
Body: { "email": "martin@example.com", "password": "secret123" }
Réponse 200: { "token": "eyJ..." }
Réponse 401: { "message": "Invalid credentials" }
```

---

### BillingController — `/api/billing`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/billing` | ROLE_USER | Infos abonnement actuel |
| POST | `/api/stripe/checkout` | ROLE_USER | Crée une session Stripe Checkout |
| GET | `/api/stripe/portal-url` | ROLE_USER | URL du portail de facturation Stripe |

---

### ChantierController (API Platform) — `/api/chantiers`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/chantiers` | ROLE_USER | Liste les chantiers du tenant |
| POST | `/api/chantiers` | ROLE_USER | Crée un chantier (tenant injecté automatiquement) |
| GET | `/api/chantiers/{id}` | Voter `view` | Détail d'un chantier |
| PATCH | `/api/chantiers/{id}` | Voter `edit` | Modifie un chantier |
| DELETE | `/api/chantiers/{id}` | Voter `delete` | Supprime un chantier |

---

### JalonController — `/api/chantiers/{id}/jalons`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/chantiers/{id}/jalons` | ROLE_USER | Liste les jalons |
| POST | `/api/chantiers/{id}/jalons` | ROLE_USER | Crée un jalon |
| PATCH | `/api/chantiers/{id}/jalons/{jalonId}` | ROLE_USER | Modifie un jalon (titre, date, done) |
| DELETE | `/api/chantiers/{id}/jalons/{jalonId}` | ROLE_USER | Supprime un jalon |
| GET | `/api/chantiers/{id}/jalons.ics` | ROLE_USER | Export iCalendar des jalons (Google Calendar) |

---

### MessageController — `/api/chantiers/{id}/messages`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/chantiers/{id}/messages` | ROLE_USER | Messages d'un chantier |
| POST | `/api/chantiers/{id}/messages` | ROLE_USER | Envoie un message |
| GET | `/api/messages?unread=true` | ROLE_USER | Messages non lus de tous les chantiers |

---

### ClientController — `/api/clients`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/clients` | ROLE_USER | Liste les clients du tenant |
| POST | `/api/clients` | ROLE_USER | Crée un client |
| GET | `/api/clients/{id}` | Voter `view` | Détail client |
| PATCH | `/api/clients/{id}` | Voter `edit` | Modifie un client |
| DELETE | `/api/clients/{id}` | Voter `delete` | Supprime un client |

---

### DocumentController — `/api/`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/documents` | ROLE_USER | Liste tous les documents du tenant |
| POST | `/api/chantiers/{id}/documents` | ROLE_USER | Upload un document (multipart) |
| GET | `/api/documents/{id}/download` | ROLE_USER | Génère une URL S3 pré-signée (TTL 1h) |
| GET | `/api/documents/{id}/pdf` | ROLE_USER | Génère et retourne le PDF via dompdf |
| PATCH | `/api/documents/{id}` | ROLE_USER | Met à jour le statut d'un document |
| POST | `/api/chantiers/{id}/photos` | ROLE_USER | Upload une photo |
| GET | `/api/chantiers/{id}/photos` | ROLE_USER | Liste les photos |

---

### CollaboratorController — `/api/team`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/team` | ROLE_ARTISAN | Liste les collaborateurs du tenant |
| POST | `/api/team/invite` | ROLE_ARTISAN | Invite un collaborateur par email (token 7j) |
| DELETE | `/api/team/{id}` | ROLE_ARTISAN | Supprime un collaborateur |

---

### StatsController — `/api/stats`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/stats` | ROLE_USER | Statistiques du dashboard (chantiers, messages, docs) |

---

### NotificationController — `/api/notifications`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/notifications` | ROLE_USER | Liste les notifications (non lues en premier) |
| PATCH | `/api/notifications/{id}/read` | ROLE_USER | Marque une notification comme lue |
| POST | `/api/notifications/read-all` | ROLE_USER | Marque toutes les notifications comme lues |

---

### PushController — `/api/push`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/push/vapid-public-key` | ROLE_USER | Retourne la clé publique VAPID |
| POST | `/api/push/subscribe` | ROLE_USER | Enregistre un abonnement push navigateur |
| POST | `/api/push/unsubscribe` | ROLE_USER | Supprime un abonnement push |

---

### ExportController — `/api/export`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/export/chantiers.csv` | ROLE_USER | Export CSV de tous les chantiers |
| GET | `/api/export/documents.csv` | ROLE_USER | Export CSV de tous les documents |

---

### AuditController — `/api/audit`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/audit` | ROLE_ARTISAN | Journal d'activité du tenant (50 entrées par page) |

---

### AiController — `/api/ai`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/ai/chantiers/{id}/devis` | ROLE_USER | Génère un brouillon de devis via Claude (plan Business) |

---

### ApiKeyController — `/api/api-keys`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/api-keys` | ROLE_ARTISAN | Liste les clés API du tenant |
| POST | `/api/api-keys` | ROLE_ARTISAN | Crée une clé API (retourne la clé en clair une seule fois) |
| DELETE | `/api/api-keys/{id}` | ROLE_ARTISAN | Révoque une clé API |

---

### AccountController — `/api/account`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/account/export` | ROLE_ARTISAN | Export RGPD des données personnelles (JSON) |
| DELETE | `/api/account` | ROLE_ARTISAN | Suppression du compte et de toutes les données |

---

### OnboardingController — `/api/onboarding`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/onboarding/checklist` | ROLE_USER | Checklist d'onboarding du tenant |

---

### IcsController

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/chantiers/{id}/jalons.ics` | ROLE_USER | Fichier iCalendar pour Google Calendar |

---

### MagicLinkController — `/api/auth/`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/api/auth/magic-link` | ROLE_USER | Envoie un magic link au client |

```json
Body: { "clientId": "uuid", "chantierId": "uuid" }
Réponse 200: { "message": "Magic link envoyé" }
```

---

### PortalController — `/api/portal/`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/portal/{token}` | Token URL | Données du portail client |
| GET | `/api/portal/{token}/documents` | Token URL | Documents du chantier |
| GET | `/api/portal/{token}/documents/{id}/download` | Token URL | URL pré-signée S3 |
| POST | `/api/portal/{token}/documents/{id}/sign` | Token URL | Signature d'un document (canvas) |
| GET | `/api/portal/{token}/photos` | Token URL | Photos du chantier |
| GET | `/api/portal/{token}/planning` | Token URL | Jalons du chantier |
| GET | `/api/portal/{token}/messages` | Token URL | Messages du chantier |
| POST | `/api/portal/{token}/messages` | Token URL | Envoie un message (client → artisan) |

---

### TenantController — `/api/settings`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/settings` | ROLE_USER | Paramètres du tenant (nom, logo, couleur) |
| PATCH | `/api/settings` | ROLE_USER | Met à jour les paramètres |
| POST | `/api/settings/logo` | ROLE_USER | Upload logo (supprime l'ancien sur S3) |

---

### LeadController — `/api/leads`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/leads` | ROLE_USER | Liste les leads (filtre ?status=) |
| GET | `/api/leads/pending` | ROLE_USER | Leads new/qualified triés par score |
| POST | `/api/leads` | ROLE_USER | Crée un lead |
| PATCH | `/api/leads/{id}` | ROLE_USER | Met à jour un lead |

---

### StripeWebhookController — `/api/stripe/`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/api/stripe/webhook` | Public (signature Stripe) | Reçoit les events Stripe |

---

### WebhookLeadController — `/api/webhooks/lead/`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/webhooks/lead/interested/{id}` | Public | Lead intéressé → status `replied` + redirect /register |
| GET | `/api/webhooks/lead/unsubscribe/{id}` | Public | Désinscription → status `lost` + page HTML |

---

### AdminController — `/admin/api/`

Accès restreint par HTTP Basic Auth (variables `ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH`). Réservé au super-admin de la plateforme.

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/admin/api/tenants` | HTTP Basic | Liste tous les tenants |
| PATCH | `/admin/api/tenants/{id}` | HTTP Basic | Modifie un tenant (plan, statut) |
| GET | `/admin/api/stats` | HTTP Basic | Statistiques globales de la plateforme |

```bash
# Exemple d'accès super-admin
curl -u admin:password https://backend.railway.app/admin/api/tenants
```

---

## Services

### TenantContext

**Fichier** : `src/Service/TenantContext.php`

Donne accès au tenant et à l'utilisateur courant depuis n'importe quel service.

| Méthode | Retour | Description |
|---------|--------|-------------|
| `getTenant()` | `?Tenant` | Tenant de l'utilisateur connecté |
| `getCurrentUser()` | `?User` | Utilisateur connecté |
| `hasTenant()` | `bool` | Est-ce qu'un tenant est actif ? |

---

### PlanLimitChecker

**Fichier** : `src/Service/PlanLimitChecker.php`

Vérifie les limites selon le plan du tenant.

| Méthode | Description |
|---------|-------------|
| `checkChantierLimit(Tenant)` | Lève une exception si le quota de chantiers est atteint (plan Starter : 5 max) |
| `checkSmsAllowed(Tenant)` | Lève une exception si le plan ne permet pas les SMS |
| `checkApiKeyAllowed(Tenant)` | Lève une exception si le plan n'est pas Business |

---

### FileUploadService

**Fichier** : `src/Service/FileUploadService.php`

Gestion des fichiers sur AWS S3 via Flysystem.

| Méthode | Signature | Description |
|---------|-----------|-------------|
| `upload` | `(UploadedFile $file, string $dir): string` | Upload un fichier, retourne le chemin S3 |
| `getSignedUrl` | `(string $path, int $ttl = 3600): string` | Génère une URL pré-signée AWS |
| `delete` | `(string $path): void` | Supprime un fichier S3 |
| `exists` | `(string $path): bool` | Vérifie l'existence d'un fichier |

---

### MagicLinkService

**Fichier** : `src/Service/MagicLinkService.php`

Génère et envoie les magic links aux clients.

| Méthode | Description |
|---------|-------------|
| `send(Client, Chantier)` | Crée un `ClientToken`, envoie l'email avec le lien `{FRONTEND_URL}/portal/{token}` |

---

### AuditService

**Fichier** : `src/Service/AuditService.php`

Enregistre les actions importantes dans la table `audit_logs`.

| Méthode | Description |
|---------|-------------|
| `log(string $action, ?object $resource, array $context)` | Crée une entrée dans le journal d'audit avec l'utilisateur courant, l'IP et la ressource concernée |

Actions enregistrées : `chantier.create`, `chantier.delete`, `document.upload`, `document.sign`, `user.login`, `user.2fa_enable`, `api_key.create`, `api_key.revoke`, `account.delete`, etc.

---

### PushService

**Fichier** : `src/Service/PushService.php`

Envoi de notifications Web Push via le protocole VAPID (minishlink/web-push).

| Méthode | Description |
|---------|-------------|
| `notify(Tenant, string $title, string $body, array $data)` | Envoie une notification push à tous les abonnements actifs d'un tenant |
| `subscribe(User, array $subscription)` | Enregistre un nouvel abonnement push |
| `unsubscribe(string $endpoint)` | Supprime un abonnement push |

---

### PdfService

**Fichier** : `src/Service/PdfService.php`

Génération de PDF via dompdf.

| Méthode | Description |
|---------|-------------|
| `generate(string $html): string` | Génère un PDF à partir d'un template HTML, retourne le binaire PDF |
| `generateDocument(Document): string` | Génère le PDF d'un document avec mise en page artisan (logo, couleur de marque) |

---

### AiService

**Fichier** : `src/Service/AiService.php`

Intégration Claude via l'API Anthropic (plan Business uniquement).

| Méthode | Description |
|---------|-------------|
| `generateDevis(Chantier): string` | Génère un brouillon de devis au format Markdown à partir des informations du chantier |

---

### NotificationService

**Fichier** : `src/Service/NotificationService.php`

Notifications email, SMS et push conditionnelles selon le plan.

| Méthode | Description |
|---------|-------------|
| `notifyNewDocument(Chantier, Document)` | Email au client + SMS si plan Pro/Business + push navigateur |
| `notifyNewMessage(Chantier, Message)` | Notification de nouveau message (email + push) |
| `createInApp(Tenant, string $type, string $title, string $body, ?string $relatedId)` | Crée une notification in-app en base |

---

### StripeService

**Fichier** : `src/Service/StripeService.php`

Intégration Stripe pour les abonnements.

| Méthode | Description |
|---------|-------------|
| `createCustomer(Tenant)` | Crée un client Stripe |
| `createCheckoutSession(Tenant, string $plan)` | Crée une session Stripe Checkout |
| `getPortalUrl(Tenant)` | Retourne l'URL du portail de facturation |
| `handleWebhook(payload, signature)` | Traite les events Stripe (mise à jour plan/status) |

---

## Commandes console

### `app:send-document-reminders`

**Fichier** : `src/Command/SendDocumentRemindersCommand.php`

Envoie des rappels email aux clients pour les documents non signés depuis N jours.

```bash
# Documents non signés depuis 3 jours (valeur par défaut)
php bin/console app:send-document-reminders

# Personnaliser le délai
php bin/console app:send-document-reminders --days=7
```

**À planifier en cron** (exemple : tous les jours à 9h) :
```
0 9 * * * php /var/www/html/bin/console app:send-document-reminders --days=3
```

---

## Migrations

| Migration | Description |
|-----------|-------------|
| `Version20260516000001` | Schéma initial : tenants, users, clients, chantiers, jalons, documents, photos, messages, client_tokens, leads |
| `Version20260516000002` | Ajout de la table notifications |
| `Version20260516000003` | Ajout de la table audit_logs |
| `Version20260516000004` | Ajout de la table push_subscriptions |
| `Version20260516000005` | Ajout de la table api_keys |
| `Version20260516000006` | Ajout colonnes onboarding au tenant |
| `Version20260516000007` | Ajout colonnes 2FA TOTP à users (totp_secret, totp_enabled) |

---

## Sécurité

### Firewalls

```yaml
dev:    # Désactivé pour le Profiler Symfony
admin:  # Pattern ^/admin/ → HTTP Basic Auth (ADMIN_USERNAME / ADMIN_PASSWORD_HASH)
portal: # Pattern ^/api/portal/ → ClientTokenAuthenticator
api:    # Pattern ^/api/ → JWT (LexikJWT)
main:   # Session classique (non utilisé en production)
```

### Access Control

```
/api/auth/*         → PUBLIC (register, login, magic-link, 2fa/*, forgot-password, reset-password, invitation/*)
/api/portal/*       → PUBLIC (authentification via ClientToken dans l'URL)
/api/webhooks/*     → PUBLIC (webhooks leads)
/api/stripe/webhook → PUBLIC (signature Stripe vérifiée dans le controller)
/admin/*            → IS_AUTHENTICATED_FULLY (HTTP Basic via ADMIN_USERNAME)
/api/*              → ROLE_USER (toutes les autres routes)
```

### 2FA TOTP

Implémenté avec `spomky-labs/otphp`. La 2FA est optionnelle par utilisateur.

Flux d'activation :
1. `POST /api/auth/2fa/setup` → génère un secret TOTP + QR code URI
2. L'utilisateur scanne avec Google Authenticator
3. `POST /api/auth/2fa/enable` avec le premier code → active la 2FA
4. Lors du login suivant, le JWT n'est retourné que si le code TOTP est valide

### Voters

**ChantierVoter** : `view`, `edit`, `delete`
- `view` : tenant du chantier === tenant de l'utilisateur connecté
- `edit` : même condition + plan actif
- `delete` : même condition

**ClientVoter** : `view`, `edit`, `delete`
- Même logique par tenant

**DocumentVoter** : `view`, `download`, `edit`
- Vérifie le tenant via le chantier parent

**PhotoVoter** : `view`, `delete`
- Vérifie le tenant via le chantier parent

### ClientTokenAuthenticator

Extrait le token depuis le pattern d'URL `/api/portal/{token}/...` via regex, cherche le `ClientToken` en base, vérifie `isValid()`, retourne un `ClientUser` (non-persisté) si valide.

---

## Tests

### Lancer les tests

```bash
# Via Docker
make test

# Directement (avec .env.test configuré)
cd backend && php bin/phpunit --testdox
```

### Fichiers de tests

| Fichier | Ce qui est testé |
|---------|-----------------|
| `tests/Security/ClientTokenTest.php` | Token valide/expiré, unicité, longueur 64 chars |
| `tests/Service/TenantContextTest.php` | getTenant(), getCurrentUser(), hasTenant() |
| `tests/Voter/ChantierVoterTest.php` | 6 cas : view/edit/delete avec bon et mauvais tenant |
| `tests/Voter/ClientVoterTest.php` | 4 cas : access control par tenant |
| `tests/Controller/AuthControllerTest.php` | Register, double email, login, mauvais password |
| `tests/Controller/LeadControllerTest.php` | CRUD leads avec/sans JWT |
| `tests/Controller/PortalControllerTest.php` | Token invalide/expiré/valide |
| `tests/Controller/ChantierControllerTest.php` | Auth requise, isolation multi-tenant |

### Ajouter un test

```php
// tests/Controller/MonControllerTest.php
namespace App\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class MonControllerTest extends WebTestCase
{
    public function testMonEndpoint(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/mon-endpoint', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getJwt($client),
        ]);
        $this->assertResponseIsSuccessful();
    }
}
```
