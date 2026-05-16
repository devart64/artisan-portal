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

## Enums

### PlanEnum
```
starter   → "Débutant" (29€/mois, 5 chantiers max, pas de SMS)
pro       → "Professionnel" (59€/mois, illimité, SMS inclus)
business  → "Entreprise" (99€/mois, multi-collab, API)
```
Méthode `allowsSms()` : retourne `true` pour `pro` et `business`.
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

### ChantierController (API Platform) — `/api/chantiers`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/chantiers` | ROLE_USER | Liste les chantiers du tenant |
| POST | `/api/chantiers` | ROLE_USER | Crée un chantier (tenant injecté automatiquement) |
| GET | `/api/chantiers/{id}` | Voter `view` | Détail d'un chantier |
| PATCH | `/api/chantiers/{id}` | Voter `edit` | Modifie un chantier |
| DELETE | `/api/chantiers/{id}` | Voter `delete` | Supprime un chantier |

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
| POST | `/api/chantiers/{id}/documents` | ROLE_USER | Upload un document (multipart) |
| GET | `/api/documents/{id}/download` | ROLE_USER | Génère une URL S3 pré-signée (TTL 1h) |
| PATCH | `/api/documents/{id}` | ROLE_USER | Met à jour le statut d'un document |
| POST | `/api/chantiers/{id}/photos` | ROLE_USER | Upload une photo |
| GET | `/api/chantiers/{id}/photos` | ROLE_USER | Liste les photos |

---

### JalonController — `/api/`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/chantiers/{id}/jalons` | ROLE_USER | Liste les jalons |
| POST | `/api/chantiers/{id}/jalons` | ROLE_USER | Crée un jalon |
| PATCH | `/api/jalons/{id}` | ROLE_USER | Modifie un jalon (titre, date, done) |
| DELETE | `/api/jalons/{id}` | ROLE_USER | Supprime un jalon |

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

### MessageController — `/api/messages`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/messages?unread=true` | ROLE_USER | Messages non lus de tous les chantiers du tenant |

---

### PortalController — `/api/portal/`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/portal/{token}` | Token URL | Données du portail client |
| GET | `/api/portal/{token}/documents` | Token URL | Documents du chantier |
| GET | `/api/portal/{token}/documents/{id}/download` | Token URL | URL pré-signée S3 |
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
| GET | `/api/stripe/portal-url` | ROLE_USER | URL du portail de facturation Stripe |

---

### WebhookLeadController — `/api/webhooks/lead/`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/webhooks/lead/interested/{id}` | Public | Lead intéressé → status `replied` + redirect /register |
| GET | `/api/webhooks/lead/unsubscribe/{id}` | Public | Désinscription → status `lost` + page HTML |

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

### NotificationService

**Fichier** : `src/Service/NotificationService.php`

Notifications email et SMS conditionnelles selon le plan.

| Méthode | Description |
|---------|-------------|
| `notifyNewDocument(Chantier, Document)` | Email au client + SMS si plan Pro/Business |
| `notifyNewMessage(Chantier, Message)` | Notification de nouveau message |

---

### StripeService

**Fichier** : `src/Service/StripeService.php`

Intégration Stripe pour les abonnements.

| Méthode | Description |
|---------|-------------|
| `createCustomer(Tenant)` | Crée un client Stripe |
| `createSubscription(Tenant, plan)` | Crée un abonnement |
| `getPortalUrl(Tenant)` | Retourne l'URL du portail de facturation |
| `handleWebhook(payload, signature)` | Traite les events Stripe (mise à jour plan/status) |

---

## Sécurité

### Firewalls

```yaml
dev:    # Désactivé pour le Profiler Symfony
portal: # Pattern ^/api/portal/ → ClientTokenAuthenticator
api:    # Pattern ^/api/ → JWT (LexikJWT)
main:   # Session classique (non utilisé en production)
```

### Access Control

```
/api/auth/*         → PUBLIC (register, login, magic-link)
/api/portal/*       → PUBLIC (authentification via ClientToken dans l'URL)
/api/webhooks/*     → PUBLIC (webhooks leads)
/api/stripe/webhook → PUBLIC (signature Stripe vérifiée dans le controller)
/api/*              → ROLE_USER (toutes les autres routes)
```

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
