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
│  │  :3000       │    │  :8000       │    │  (Node.js)       │   │
│  └──────────────┘    └──────┬───────┘    └──────────────────┘   │
│                             │                                    │
│              ┌──────────────┼──────────────┐                    │
│              ▼              ▼              ▼                    │
│        ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│        │PostgreSQL│  │  Redis   │  │  AWS S3  │               │
│        │  :5432   │  │  :6379   │  │  (files) │               │
│        └──────────┘  └──────────┘  └──────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Monorepo

```
artisan-portal/
├── backend/          # API Symfony 7.2
├── frontend/         # App Next.js 15
├── agents/           # Système d'agents IA marketing
├── docs/             # Documentation (ce dossier)
├── docker-compose.yml
├── Makefile
├── CLAUDE.md         # Instructions pour Claude Code
└── TASKS.md          # Sprints de développement
```

---

## Multi-tenancy

Chaque artisan est un **Tenant**. Toutes les données (clients, chantiers, documents, photos, messages) appartiennent à un tenant et sont strictement isolées.

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

---

## Schéma de base de données

```
┌─────────────┐
│   tenants   │
│─────────────│
│ id (uuid)   │◄────────────────────────────────────────┐
│ name        │                                         │
│ slug        │                                         │
│ logo_url    │                                         │
│ brand_color │                                         │
│ plan        │                                         │
│ plan_status │                                         │
│ created_at  │                                         │
└─────────────┘                                         │
      │                                                 │
      ├──────────────────────────────────────────────   │
      ▼                                                 │
┌──────────┐      ┌────────────┐      ┌─────────────┐  │
│  users   │      │  clients   │      │  chantiers  │  │
│──────────│      │────────────│      │─────────────│  │
│ id       │      │ id         │      │ id          │  │
│ tenant_id│──FK──│ tenant_id  │──FK──│ tenant_id   │──┘
│ email    │      │ name       │      │ client_id   │──FK──► clients
│ password │      │ email      │      │ title       │
│ role     │      │ phone      │      │ description │
└──────────┘      └────────────┘      │ status      │
                        │             │ start_date  │
                        │             │ end_date    │
                        │             │ address     │
                        │             │ created_at  │
                        │             └─────────────┘
                        │                    │
                        │        ┌───────────┼───────────┬──────────────┐
                        │        ▼           ▼           ▼              ▼
                        │   ┌────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐
                        │   │ jalons │ │documents │ │ photos │ │messages  │
                        │   │────────│ │──────────│ │────────│ │──────────│
                        │   │ id     │ │ id       │ │ id     │ │ id       │
                        │   │chant_id│ │ chant_id │ │chant_id│ │ chant_id │
                        │   │ title  │ │ type     │ │file_pth│ │sender_typ│
                        │   │ date   │ │ label    │ │caption │ │content   │
                        │   │ done   │ │ file_path│ │upl_at  │ │ is_read  │
                        │   └────────┘ │ status   │ └────────┘ └──────────┘
                        │             └──────────┘
                        │
                        ▼
                  ┌──────────────┐
                  │ client_tokens│
                  │──────────────│
                  │ id           │
                  │ client_id    │──FK──► clients
                  │ chantier_id  │──FK──► chantiers
                  │ token (64chr)│
                  │ expires_at   │
                  └──────────────┘

┌────────┐
│ leads  │  (table indépendante pour les agents IA marketing)
│────────│
│ id     │
│ name   │
│ email  │
│ phone  │
│ trade  │
│ city   │
│ score  │
│ status │
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

## Rôles et accès

| Rôle | Auth | Accès |
|------|------|-------|
| **Artisan (Admin)** | Email + password → JWT | Dashboard complet : chantiers, clients, documents, photos, paramètres, facturation |
| **Collaborateur** | Email + password → JWT | Upload photos/docs sur les chantiers |
| **Client final** | Magic link (token 30j) | Portail lecture seule : documents, photos, jalons, messagerie |

---

## Plans et limites

| Plan | Prix | Chantiers | SMS | Collaborateurs |
|------|------|-----------|-----|----------------|
| Starter | 29€/mois | 5 max | ✗ | 1 |
| Pro | 59€/mois | Illimité | ✓ | 3 |
| Business | 99€/mois | Illimité | ✓ | Illimité + API |

Les limites sont vérifiées dans `PlanEnum::allowsSms()` et dans les services métier.
