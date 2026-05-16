# ARCHITECTURE — Artisan Portal

Documentation de l'architecture globale du projet.

---

## Vue d'ensemble

Artisan Portal est un SaaS B2B multi-tenant pour les artisans français. Il permet à chaque artisan de partager avec ses clients un portail personnalisé donnant accès aux documents, photos, jalons et messages d'un chantier.

```
┌─────────────────────────────────────────────────────────────────┐
│                        ARTISAN PORTAL                           │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │  Frontend    │    │   Backend    │    │   Agents IA      │   │
│  │  Next.js 15  │◄──►│  Symfony 7.2 │◄──►│  Marketing       │   │
│  │  :3000 (PWA) │    │  :8000       │    │  (Node.js)       │   │
│  └──────────────┘    └──────┬───────┘    └──────────────────┘   │
│                             │                                    │
│              ┌──────────────┼──────────────┐                    │
│              ▼              ▼              ▼                    │
│        ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│        │PostgreSQL│  │  Redis   │  │  AWS S3  │               │
│        │  :5432   │  │  :6379   │  │  (files) │               │
│        └──────────┘  └──────────┘  └──────────┘               │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Services externes                                        │  │
│  │  Stripe · Twilio · Resend · Anthropic · Web Push (VAPID) │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Monorepo

```
artisan-portal/
├── backend/          # API Symfony 7.2
├── frontend/         # App Next.js 15 (PWA)
├── agents/           # Système d'agents IA marketing
├── docs/             # Documentation (ce dossier)
├── docker-compose.yml
├── Makefile
├── CLAUDE.md         # Instructions pour Claude Code
└── TASKS.md          # Sprints de développement
```

---

## Multi-tenancy

Chaque artisan est un **Tenant**. Toutes les données (clients, chantiers, documents, photos, messages, notifications, audit logs) appartiennent à un tenant et sont strictement isolées.

### Mécanisme : Doctrine SQL Filter

Le filtre SQL est déclaré dans `config/packages/doctrine.yaml` :

```yaml
doctrine:
  orm:
    filters:
      tenant_filter:
        class: App\Filter\TenantFilter
        enabled: false  # désactivé par défaut
```

Le `TenantFilterSubscriber` active le filtre sur **chaque requête authentifiée** :

```
Requête HTTP → Firewall JWT → TenantFilterSubscriber::onKernelRequest()
                                   └── $em->getFilters()->enable('tenant_filter')
                                   └── filtre->setParameter('tenantId', $tenant->getId())
```

Résultat : chaque requête Doctrine ajoute automatiquement `WHERE tenant_id = :tenantId` à toutes les entités marquées avec le filtre.

### Isolation des Voters

En complément du filtre SQL, les Voters Symfony vérifient l'appartenance au tenant avant toute action `view`, `edit`, `delete` sur une ressource.

---

## Flux d'authentification

### 1. Artisan (JWT)

```
POST /api/auth/login
  │  { email, password }
  ▼
AuthController::login()
  │  vérification bcrypt password
  │  si 2FA activée : vérification code TOTP
  ▼
LexikJWT::create(User)
  │  JWT signé RS256 (private.pem)
  ▼
Réponse { token: "eyJ..." }
  │
  ▼ Frontend stocke en cookie HttpOnly "jwt_token"
  │
  ▼ Requêtes suivantes : Authorization: Bearer eyJ...
```

**Durée** : configurable dans `config/packages/lexik_jwt_authentication.yaml` (défaut 3600s)

### 2. Client final (Magic Link)

```
Artisan → POST /api/auth/magic-link { clientId, chantierId }
  │
  ▼
MagicLinkService::send()
  │  crée ClientToken { token: bin2hex(random_bytes(32)), expiresAt: +30j }
  ▼
Email envoyé au client : https://artisan-portal.fr/portal/{token}
  │
  ▼ Client clique → GET /api/portal/{token}
  │
  ▼
ClientTokenAuthenticator::authenticate()
  │  extrait {token} de l'URL via regex
  │  ClientTokenRepository::findValidByToken(token)
  │  vérifie expiresAt > now()
  ▼
ClientUser (non-persisté) créé → accès lecture seule au portail
```

**Durée** : 30 jours. Pas de compte à créer côté client.

### 3. Collaborateur (invitation)

```
Artisan → POST /api/team/invite { email }
  │
  ▼
CollaboratorController → génère token 7j → email d'invitation
  │
  ▼ Collaborateur clique → /invitation/{token}
  │
  ▼
POST /api/auth/invitation/accept/{token}
  │  crée User { role: ROLE_COLLABORATEUR, tenant: artisan.tenant }
  ▼
JWT retourné → accès au dashboard (upload photos/docs uniquement)
```

### 4. 2FA TOTP (optionnel)

```
Artisan → POST /api/auth/2fa/setup
  │  génère secret TOTP + QR code URI
  ▼
Artisan scanne avec Google Authenticator
  │
  ▼
POST /api/auth/2fa/enable { code: "123456" }
  │  vérifie le code TOTP avec spomky-labs/otphp
  │  persiste totpSecret + totpEnabled = true
  ▼
Lors du login suivant : AuthController vérifie le code TOTP avant d'émettre le JWT
```

---

## Schéma de base de données

```
┌─────────────┐
│   tenants   │
│─────────────│
│ id (uuid)   │◄────────────────────────────────────────────────────┐
│ name        │                                                     │
│ slug        │                                                     │
│ logo_url    │                                                     │
│ brand_color │                                                     │
│ plan        │                                                     │
│ plan_status │                                                     │
│ created_at  │                                                     │
└─────────────┘                                                     │
      │                                                             │
      ├───────────────────────────────────────────────────────      │
      ▼                                                             │
┌──────────┐      ┌────────────┐      ┌─────────────┐              │
│  users   │      │  clients   │      │  chantiers  │              │
│──────────│      │────────────│      │─────────────│              │
│ id       │      │ id         │      │ id          │              │
│ tenant_id│──FK──│ tenant_id  │──FK──│ tenant_id   │──────────────┘
│ email    │      │ name       │      │ client_id   │──FK──► clients
│ password │      │ email      │      │ title       │
│ role     │      │ phone      │      │ description │
│totp_secrt│      └────────────┘      │ status      │
│totp_enbl │            │             │ start_date  │
└──────────┘            │             │ end_date    │
      │                 │             │ address     │
      │                 │             │ created_at  │
      │                 │             └─────────────┘
      │                 │                    │
      │                 │        ┌───────────┼───────────┬──────────────┐
      │                 │        ▼           ▼           ▼              ▼
      │                 │   ┌────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐
      │                 │   │ jalons │ │documents │ │ photos │ │messages  │
      │                 │   │────────│ │──────────│ │────────│ │──────────│
      │                 │   │ id     │ │ id       │ │ id     │ │ id       │
      │                 │   │chant_id│ │ chant_id │ │chant_id│ │ chant_id │
      │                 │   │ title  │ │ type     │ │file_pth│ │sender_typ│
      │                 │   │ date   │ │ label    │ │caption │ │content   │
      │                 │   │ done   │ │ file_path│ │upl_at  │ │ is_read  │
      │                 │   └────────┘ │ status   │ └────────┘ └──────────┘
      │                 │             └──────────┘
      │                 │
      │                 ▼
      │          ┌──────────────┐
      │          │ client_tokens│
      │          │──────────────│
      │          │ id           │
      │          │ client_id    │──FK──► clients
      │          │ chantier_id  │──FK──► chantiers
      │          │ token (64chr)│
      │          │ expires_at   │
      │          └──────────────┘
      │
      ├──────────────────────────────────────────────────────────────
      ▼
┌───────────────────┐  ┌───────────────┐  ┌──────────────────────┐
│  notifications    │  │  audit_logs   │  │  push_subscriptions  │
│───────────────────│  │───────────────│  │──────────────────────│
│ id                │  │ id            │  │ id                   │
│ tenant_id   (FK)  │  │ tenant_id(FK) │  │ tenant_id (FK)       │
│ type              │  │ user_id  (FK) │  │ user_id   (FK)       │
│ title             │  │ action        │  │ endpoint             │
│ body              │  │ resource_type │  │ p256dh               │
│ is_read           │  │ resource_id   │  │ auth                 │
│ related_id        │  │ context (json)│  │ created_at           │
│ created_at        │  │ ip_address    │  └──────────────────────┘
└───────────────────┘  │ created_at    │
                       └───────────────┘

┌──────────┐    ┌────────┐
│ api_keys │    │ leads  │  (table indépendante pour les agents IA marketing)
│──────────│    │────────│
│ id       │    │ id     │
│ tenant_id│    │ name   │
│ name     │    │ email  │
│ key_hash │    │ phone  │
│ prefix   │    │ trade  │
│ last_used│    │ city   │
│ created  │    │ score  │
└──────────┘    │ status │
                │ notes  │
                └────────┘
```

---

## Stockage fichiers S3

Les fichiers (documents, photos, logo tenant) ne sont **jamais exposés publiquement**.

```
Upload :
  Client → Frontend → POST /api/chantiers/{id}/documents
    │  multipart/form-data
    ▼
  DocumentController → FileUploadService::upload()
    │  stocke sur S3 : chantiers/{uuid}/{filename}
    │  retourne le path S3 (ex: "chantiers/abc123/devis.pdf")
    ▼
  DB : Document { file_path: "chantiers/abc123/devis.pdf" }

Téléchargement :
  Client → GET /api/documents/{id}/download
    ▼
  DocumentController → FileUploadService::getSignedUrl(path, ttl=3600)
    │  génère une URL pré-signée AWS valable 1h
    ▼
  Réponse { url: "https://s3.amazonaws.com/...?X-Amz-Signature=..." }
    │
    ▼ Client télécharge directement depuis S3 (pas via le backend)
```

**Avantage** : si une URL est interceptée, elle expire après 1h. Le path S3 brut n'est jamais exposé.

---

## Push notifications (Web Push / VAPID)

```
Artisan active les notifications dans /settings/account
  │
  ▼
PushNotifSetup (frontend) → GET /api/push/vapid-public-key
  │  Navigateur demande la permission
  │  ServiceWorker.pushManager.subscribe({ applicationServerKey: vapidPublicKey })
  ▼
POST /api/push/subscribe { endpoint, p256dh, auth }
  │  PushService::subscribe() → persiste PushSubscription en base
  │
  ▼ Événement déclencheur (ex: nouveau message client)
  │
  ▼
NotificationService::notifyNewMessage()
  │
  ▼
PushService::notify(tenant, title, body)
  │  minishlink/web-push → envoie à tous les endpoints du tenant
  │
  ▼ Service Worker (sw.js) reçoit l'événement push
  │  self.registration.showNotification(title, { body, icon })
  ▼
Notification système affichée sur l'appareil de l'artisan
```

---

## Rôles et accès

| Rôle | Auth | Accès |
|------|------|-------|
| **Artisan (Admin)** | Email + password → JWT | Dashboard complet : chantiers, clients, documents, photos, paramètres, facturation, équipe, audit, API keys |
| **Collaborateur** | Email + password → JWT | Upload photos/docs sur les chantiers |
| **Client final** | Magic link (token 30j) | Portail lecture seule : documents (+ signature), photos, jalons, messagerie |
| **Super-admin** | HTTP Basic | Console d'administration `/admin/api/` : gestion de tous les tenants |

---

## Plans et limites

| Plan | Prix | Chantiers | SMS | Collaborateurs | API keys | Devis IA |
|------|------|-----------|-----|----------------|----------|----------|
| Starter | 29€/mois | 5 max | ✗ | 1 | ✗ | ✗ |
| Pro | 59€/mois | Illimité | ✓ | 3 | ✗ | ✗ |
| Business | 99€/mois | Illimité | ✓ | Illimité | ✓ | ✓ |

Les limites sont vérifiées par `PlanLimitChecker` et dans `PlanEnum` (`allowsSms()`, `allowsApiKeys()`).

---

## PWA — Application Web Progressive

Le frontend est une PWA installable sur mobile et desktop :

- **`manifest.json`** : métadonnées de l'app (nom, icônes, couleur, mode `standalone`)
- **`sw.js`** : Service Worker avec stratégie cache-first pour les assets statiques
- **Push handler** : le Service Worker intercepte les événements push et affiche les notifications système
- **Installable** : bouton "Ajouter à l'écran d'accueil" sur mobile, invite d'installation sur Chrome desktop

---

## Audit log

Chaque action importante est tracée dans la table `audit_logs` via `AuditService::log()` :

| Catégorie | Actions tracées |
|-----------|----------------|
| Auth | `user.login`, `user.2fa_enable`, `user.2fa_disable` |
| Chantiers | `chantier.create`, `chantier.update`, `chantier.delete` |
| Documents | `document.upload`, `document.sign`, `document.delete` |
| Équipe | `collaborator.invite`, `collaborator.remove` |
| API keys | `api_key.create`, `api_key.revoke` |
| Compte | `account.export`, `account.delete` |

Le journal est consultable par l'artisan dans `/settings/audit` et par le super-admin dans `/admin/api/`.
