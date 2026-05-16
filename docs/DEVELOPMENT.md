# DÉVELOPPEMENT — Artisan Portal

Guide complet pour démarrer et contribuer au projet en local.

---

## Prérequis

| Outil | Version minimum | Vérification |
|-------|----------------|--------------|
| Docker Desktop | 24.x | `docker --version` |
| Docker Compose | 2.x | `docker compose version` |
| Git | 2.x | `git --version` |
| Node.js (optionnel) | 20.x | `node --version` |
| PHP (optionnel) | 8.3 | `php --version` |

---

## Installation (première fois)

```bash
# 1. Cloner le repository
git clone https://github.com/devart64/artisan-portal.git
cd artisan-portal

# 2. Installation complète (une seule commande)
make install
```

**Ce que fait `make install`** :
1. Copie `backend/.env.example` → `backend/.env`
2. `docker compose build` — construit les images Docker
3. `docker compose up -d` — démarre tous les services
4. Attend que PostgreSQL soit prêt
5. Génère les clés JWT RSA (`private.pem` + `public.pem`)
6. `composer install` dans le conteneur backend
7. `doctrine:migrations:migrate` — crée toutes les tables (001 → 007)
8. `pnpm install` dans le conteneur frontend

---

## Lancer le projet

```bash
make dev
```

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Application Next.js |
| Backend API | http://localhost:8000 | API Symfony |
| API Docs | http://localhost:8000/api/docs | Documentation API Platform |
| Mailpit | http://localhost:8025 | Emails de développement |

---

## Workflow de développement

### Modifier une entité existante

1. Modifier le fichier dans `backend/src/Entity/`
2. Générer la migration :
```bash
make migrate-diff
# ou
docker compose exec backend php bin/console doctrine:migrations:diff
```
3. Appliquer la migration :
```bash
make migrate
```

### Créer une nouvelle entité

```bash
# Entrer dans le conteneur backend
make shell-backend

# Utiliser le maker bundle
php bin/console make:entity MonEntite
php bin/console doctrine:migrations:diff
php bin/console doctrine:migrations:migrate
```

### Créer un nouveau contrôleur

```php
// backend/src/Controller/MonController.php
<?php
declare(strict_types=1);
namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/mon-resource')]
#[IsGranted('ROLE_USER')]
class MonController extends AbstractController
{
    #[Route('', methods: ['GET'])]
    public function index(): JsonResponse
    {
        return $this->json(['data' => []]);
    }
}
```

Pas besoin de déclarer la route ailleurs — Symfony l'auto-découvre.

### Ajouter une page Next.js

```bash
# Créer le fichier de page
touch frontend/app/(dashboard)/ma-page/page.tsx
```

```tsx
// frontend/app/(dashboard)/ma-page/page.tsx
import { apiFetch } from '@/lib/api'

export default async function MaPage() {
  const data = await apiFetch<MonType[]>('/api/mon-endpoint')
  return <div>{/* ... */}</div>
}
```

### Ajouter un composant shadcn/ui

```bash
# Entrer dans le conteneur frontend
make shell-frontend

# Ajouter un composant shadcn (ex: accordion)
npx shadcn@latest add accordion
```

Le composant sera ajouté dans `frontend/components/ui/accordion.tsx`.

### Lancer les tests

```bash
# Tous les tests backend
make test

# Test spécifique
docker compose exec backend php bin/phpunit tests/Controller/AuthControllerTest.php --testdox

# Avec filtre sur un test
docker compose exec backend php bin/phpunit --filter testRegisterCreatesUserAndTenant
```

### Vérifier le code frontend

```bash
# TypeScript
make typecheck

# Linting
make lint

# Build complet (détecte les erreurs de build)
docker compose exec frontend pnpm build
```

---

## Voir les logs

```bash
# Tous les services
make logs

# Service spécifique
docker compose logs backend -f
docker compose logs frontend -f
docker compose logs nginx -f

# Logs Symfony (dans le conteneur)
docker compose exec backend tail -f var/log/dev.log
```

---

## Commandes utiles

### Toutes les commandes Make

| Commande | Description |
|----------|-------------|
| `make install` | Installation complète (première fois) |
| `make dev` | Démarre tous les services |
| `make stop` | Arrête tous les services |
| `make restart` | Redémarre tous les services |
| `make test` | Lance PHPUnit |
| `make lint` | ESLint frontend |
| `make typecheck` | TypeScript check |
| `make migrate` | Applique les migrations |
| `make migrate-diff` | Génère une migration |
| `make jwt` | Régénère les clés JWT |
| `make shell-backend` | Shell dans le backend |
| `make shell-frontend` | Shell dans le frontend |
| `make logs` | Logs en temps réel |
| `make reset` | ⚠️ Reset complet (supprime volumes) |

### Commandes Frontend

```bash
# Entrer dans le conteneur frontend
make shell-frontend

pnpm dev          # Mode développement
pnpm build        # Build production
pnpm start        # Démarrer le build production
pnpm typecheck    # Vérification TypeScript
pnpm lint         # ESLint
```

### Commandes Backend

```bash
# Entrer dans le conteneur backend
make shell-backend

php bin/console list              # Toutes les commandes disponibles
php bin/console debug:router      # Liste toutes les routes
php bin/console debug:container   # Services enregistrés
php bin/console cache:clear       # Vider le cache
php bin/console doctrine:schema:validate  # Valider le schema

# Rappels documents non signés (à mettre en cron)
php bin/console app:send-document-reminders --days=3

# Générer les clés VAPID (run en dehors du conteneur)
npx web-push generate-vapid-keys

# Générer le hash du mot de passe admin
php bin/console security:hash-password

# Accès super-admin via HTTP Basic
curl -u admin:password https://backend.railway.app/admin/api/tenants
```

### Commandes Agents IA

```bash
cd agents
cp .env.example .env    # Première fois uniquement
pnpm install            # Installer les dépendances

pnpm prospect plombier Paris 5    # Scraper 5 leads
pnpm qualify                      # Qualifier les leads "new"
pnpm campaign electricien Lyon 3  # Pipeline complet
pnpm report                       # Rapport de conversion
pnpm scheduler                    # Démarrer le scheduler 24/7
```

---

## Architecture des décisions

### Pourquoi Symfony + API Platform (pas Node.js) ?

- **Maturité** : Symfony 7 est le framework PHP le plus stable pour le SaaS B2B en France
- **API Platform** : génère automatiquement REST + JSON-LD + Swagger à partir des entités
- **Doctrine** : SQL filters natifs pour le multi-tenant (impossible aussi simplement avec Prisma/TypeORM)
- **Security component** : Voters, firewalls, authenticators bien abstraits

### Pourquoi Next.js 15 App Router ?

- **Server Components** : rendering côté serveur sans boilerplate, meilleur SEO
- **Server Actions** : mutations sans API intermédiaire entre frontend et backend
- **Output standalone** : image Docker optimisée (~50MB vs ~300MB avec node_modules)
- **React 19** : concurrence, transitions, meilleure perf

### Pourquoi multi-tenant par filtre SQL ?

- Une seule base de données → coût minimal en infrastructure
- Isolation forte : le filtre `WHERE tenant_id = :id` s'applique à TOUTES les requêtes automatiquement
- Alternative (bases séparées) : trop coûteux à opérer pour un MVP

### Pourquoi magic links pour les clients ?

- **0 friction** : le client clique sur un lien, accède directement — pas de compte à créer
- **Confiance** : l'artisan envoie le lien, le client fait confiance à l'artisan
- **Expiration** : 30 jours, renouvelable par l'artisan à tout moment

### Pourquoi pre-signed URLs S3 ?

- Les documents (devis, factures) sont **confidentiels** — jamais d'URL publique permanente
- Une URL pré-signée expire après 1h → même si elle fuite, elle est inutilisable
- L'artisan et le client ne voient jamais le chemin S3 réel

---

## Résolution de problèmes courants

### "Erreur de connexion PostgreSQL au démarrage"

```
SQLSTATE[08006] [7] could not connect to server: Connection refused
```

**Cause** : Le backend a démarré avant que PostgreSQL soit prêt.
**Solution** : L'entrypoint.sh attend PostgreSQL — attendre ~30 secondes ou :
```bash
docker compose restart backend
```

---

### "JWT keys manquantes"

```
[Symfony\Component\DependencyInjection\Exception] JWT keypair not found
```

**Solution** :
```bash
make jwt
# ou
docker compose exec backend php bin/console lexik:jwt:generate-keypair
```

---

### "CORS error depuis le frontend"

```
Access to fetch at 'http://localhost:8000' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Vérifications** :
1. `backend/.env` contient `CORS_ALLOW_ORIGIN=http://localhost:3000`
2. Le service backend est bien démarré : `docker compose ps`
3. Redémarrer le backend : `docker compose restart backend`

---

### "Migration Doctrine échoue"

```
SQLSTATE[42P07]: Duplicate table: 7 ERROR: relation "tenants" already exists
```

**Cause** : La table existe déjà (schema créé manuellement ou doublon de migration).
**Solution** :
```bash
# Option 1 : marquer la migration comme exécutée
docker compose exec backend php bin/console doctrine:migrations:version --add 'DoctrineMigrations\Version20260516000001'

# Option 2 : reset complet (⚠️ supprime toutes les données)
make reset
```

---

### "pnpm install échoue"

```
ERR_PNPM_FROZEN_LOCKFILE
```

**Solution** :
```bash
docker compose exec frontend pnpm install --no-frozen-lockfile
```

---

### "Port 8000 déjà utilisé"

```
Error starting userland proxy: listen tcp 0.0.0.0:8000: bind: address already in use
```

**Solution** :
```bash
# Trouver le processus
lsof -i :8000
# Tuer le processus ou changer le port dans docker-compose.yml
```

---

### "TypeScript error sur le frontend"

```bash
make typecheck
# Voir les erreurs précises
docker compose exec frontend pnpm tsc --noEmit 2>&1 | head -50
```

---

### "Les emails n'arrivent pas (dev)"

En développement, les emails sont interceptés par Mailpit.
→ Ouvrir http://localhost:8025 pour les consulter.

En production, vérifier :
1. `MAILER_DSN` est configuré avec les vraies credentials SMTP
2. Le domaine est vérifié sur Resend (SPF + DKIM)

---

### "L'agent IA plante avec 'Model not found'"

```
AnthropicError: model not found: claude-opus-4-7
```

Vérifier `agents/src/config.ts` → le model doit être `'claude-opus-4-7'`.
Si le modèle a changé, mettre à jour avec l'identifiant correct depuis la [documentation Anthropic](https://docs.anthropic.com/models).

---

### "Les agents ne trouvent pas de leads"

```
Erreur scraping: Request failed with status code 429
```

**Cause** : Rate limit de l'API Sirene.
**Solution** : Attendre 1 minute, ou réduire le nombre de leads (`pnpm campaign plombier Paris 3`).

---

### "La 2FA ne fonctionne pas (code invalide)"

```
Invalid TOTP code
```

**Causes possibles** :
1. Dérive horaire entre le serveur et l'appareil — vérifier que l'heure système du serveur est correcte (NTP)
2. QR code scanné mais secret non persisté — vérifier que `app:auth:2fa:setup` a bien sauvegardé le `totpSecret` en base
3. Fenêtre de tolérance trop stricte — `spomky-labs/otphp` tolère par défaut ±1 période (30s)

**Solution dev** :
```bash
# Vérifier l'heure du conteneur
docker compose exec backend date

# Synchroniser si nécessaire
docker compose exec backend ntpdate -u pool.ntp.org
```

---

### "Les notifications push ne s'affichent pas"

**Vérifications** :
1. Les variables `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` sont renseignées dans `backend/.env`
2. Le navigateur a accordé la permission de notifications (`Notifications: Allow`)
3. Le Service Worker est enregistré : ouvrir DevTools → Application → Service Workers
4. L'endpoint push est bien enregistré en base : vérifier la table `push_subscriptions`
5. En dev, utiliser Chrome DevTools → Application → Push Messaging pour simuler un push

---

## Ajouter un nouveau plan tarifaire

1. Ajouter la valeur dans `backend/src/Enum/PlanEnum.php`
2. Mettre à jour les méthodes `allowsSms()`, `allowsApiKeys()` si nécessaire
3. Mettre à jour `PlanLimitChecker` avec les nouvelles limites
4. Créer le produit + prix dans Stripe Dashboard
5. Ajouter la variable `STRIPE_PRICE_<NOM_PLAN>` dans `backend/.env` et `CONFIGURATION.md`
6. Mettre à jour la landing page `frontend/app/page.tsx` (section pricing)
7. Mettre à jour la page `frontend/app/(legal)/cgv/page.tsx` (tableau tarifs)
8. Générer une migration si des colonnes changent

---

## Structure de la base de données en dev

Après `make install`, vous pouvez inspecter la base avec :

```bash
docker compose exec postgres psql -U artisan -d artisan_portal

# Dans psql :
\dt                  # Liste les tables
\d tenants           # Structure d'une table
SELECT * FROM tenants LIMIT 5;
\q                   # Quitter
```
