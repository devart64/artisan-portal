# CONFIGURATION — Artisan Portal

Documentation exhaustive de toutes les variables d'environnement du projet.

---

## Backend (`backend/.env`)

Copiez `backend/.env.example` vers `backend/.env` (fait automatiquement par `make install`) puis renseignez chaque variable.

---

### Application Symfony

| Variable | Requis | Description | Exemple |
|----------|--------|-------------|---------|
| `APP_ENV` | Oui | Environnement d'exécution Symfony | `dev` / `prod` / `test` |
| `APP_SECRET` | Oui | Clé secrète utilisée pour signer les tokens CSRF et les sessions | `a3f8e2c1d9b74f5a6e0c2d8b1a7f3e9c` |

**`APP_ENV`**
- `dev` : active le Symfony Profiler, les logs verbeux, la Toolbar
- `prod` : désactive tout le debug, active le cache OPcache, obligatoire en production
- `test` : utilisé par PHPUnit, isole la base de données de test

**`APP_SECRET`**
- Doit être une chaîne aléatoire d'au moins 32 caractères
- Ne doit jamais être partagé ni versionné
- Générer en production :
  ```bash
  openssl rand -hex 32
  ```

---

### Base de données PostgreSQL

| Variable | Requis | Description | Exemple |
|----------|--------|-------------|---------|
| `DATABASE_URL` | Oui | URL de connexion complète PostgreSQL au format DSN | `postgresql://artisan:artisan@localhost:5432/artisan_portal?serverVersion=16&charset=utf8` |

**Format complet :**
```
postgresql://<user>:<password>@<host>:<port>/<database>?serverVersion=<version>&charset=utf8
```

**Paramètres :**
- `user` : nom de l'utilisateur PostgreSQL (ex. `artisan`)
- `password` : mot de passe de cet utilisateur
- `host` : `localhost` en dev, `postgres` dans Docker Compose, ou l'URL Railway en prod
- `port` : `5432` par défaut
- `database` : nom de la base (ex. `artisan_portal`)
- `serverVersion` : version PostgreSQL exacte (ex. `16`) — permet à Doctrine de générer le SQL optimal
- `charset=utf8` : encodage des caractères, toujours `utf8`

**Exemple production Railway :**
```
DATABASE_URL=postgresql://postgres:XXXXXXXXXX@monorail.proxy.rlwy.net:54321/railway?serverVersion=16&charset=utf8
```

---

### JWT (LexikJWTAuthenticationBundle)

| Variable | Requis | Description | Exemple |
|----------|--------|-------------|---------|
| `JWT_SECRET_KEY` | Oui | Chemin absolu vers la clé privée RSA | `%kernel.project_dir%/config/jwt/private.pem` |
| `JWT_PUBLIC_KEY` | Oui | Chemin absolu vers la clé publique RSA | `%kernel.project_dir%/config/jwt/public.pem` |
| `JWT_PASSPHRASE` | Oui | Passphrase de chiffrement de la clé privée | `mon_secret_jwt_passphrase` |

**Comment générer les clés JWT :**

En développement (via Docker) :
```bash
make jwt
# Exécute : php bin/console lexik:jwt:generate-keypair --overwrite
```

Manuellement (sans Docker) :
```bash
mkdir -p backend/config/jwt
openssl genrsa -out backend/config/jwt/private.pem -aes256 4096
# Renseignez la passphrase quand elle est demandée
openssl rsa -pubout -in backend/config/jwt/private.pem -out backend/config/jwt/public.pem
```

En production (Railway) :
- Les fichiers `.pem` ne doivent pas être versionnés
- Soit monter les clés comme secrets Railway, soit les encoder en base64 dans une variable d'environnement et les décoder au démarrage via le `entrypoint.sh`
- Alternativement, générer les clés directement dans le conteneur Railway au premier démarrage

**Important :** La passphrase `JWT_PASSPHRASE` doit correspondre exactement à celle utilisée lors de la génération des clés.

---

### Envoi d'emails (Symfony Mailer)

| Variable | Requis | Description | Exemple |
|----------|--------|-------------|---------|
| `MAILER_DSN` | Oui | DSN de connexion au serveur d'emails | voir ci-dessous |

**Format Mailpit (développement) :**
```
MAILER_DSN=smtp://localhost:1025
```
Mailpit intercepte tous les emails et les affiche dans son interface web à http://localhost:8025. Aucun email réel n'est envoyé.

**Format SMTP standard (production) :**
```
MAILER_DSN=smtp://user:password@smtp.provider.com:587?encryption=tls
```

**Format Resend (recommandé en production) :**
```
MAILER_DSN=resend+api://RE_xxxxxxxxxxxx@default
```
Créer un compte sur [resend.com](https://resend.com), vérifier votre domaine, puis copier la clé API.

**Format SendGrid :**
```
MAILER_DSN=sendgrid+api://SG.xxxxxxxxxxxx@default
```

**Format Amazon SES :**
```
MAILER_DSN=ses+smtp://ACCESS_KEY:SECRET_KEY@default?region=eu-west-1
```

---

### AWS S3 (stockage fichiers via Flysystem)

| Variable | Requis | Description | Exemple |
|----------|--------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | Oui | Identifiant de la clé d'accès IAM | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | Oui | Clé secrète associée | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_REGION` | Oui | Région AWS du bucket S3 | `eu-west-3` (Paris, recommandé) |
| `AWS_BUCKET` | Oui | Nom du bucket S3 | `artisan-portal` |

**Comment créer un bucket S3 et un utilisateur IAM :**

1. Connectez-vous à [console.aws.amazon.com](https://console.aws.amazon.com)
2. Allez dans **S3** → **Créer un compartiment**
3. Nom : `artisan-portal` (ou suffixé avec l'environnement : `artisan-portal-prod`)
4. Région : `eu-west-3` (Europe — Paris)
5. **Bloquer tout accès public** : activé (les accès se font uniquement via pre-signed URLs)
6. Versioning : optionnel
7. Chiffrement : activé (SSE-S3 ou SSE-KMS)

Créer l'utilisateur IAM :
1. Allez dans **IAM** → **Utilisateurs** → **Créer un utilisateur**
2. Nom : `artisan-portal-app`
3. Accès programmatique uniquement (pas de console AWS)
4. Attacher la politique suivante (accès minimal) :
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:HeadObject"
      ],
      "Resource": "arn:aws:s3:::artisan-portal/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::artisan-portal"
    }
  ]
}
```
5. Créer un **Access Key** pour cet utilisateur et copier `AWS_ACCESS_KEY_ID` et `AWS_SECRET_ACCESS_KEY`

---

### Stripe (abonnements)

| Variable | Requis | Description | Exemple |
|----------|--------|-------------|---------|
| `STRIPE_SECRET_KEY` | Oui | Clé secrète API Stripe (commençant par `sk_`) | `sk_live_51...` ou `sk_test_51...` |
| `STRIPE_WEBHOOK_SECRET` | Oui | Secret du webhook Stripe pour vérifier les signatures | `whsec_...` |
| `STRIPE_PRICE_STARTER` | Oui | Identifiant du prix Stripe pour le plan Starter (29€/mois) | `price_1ABC...` |
| `STRIPE_PRICE_PRO` | Oui | Identifiant du prix Stripe pour le plan Pro (59€/mois) | `price_1DEF...` |
| `STRIPE_PRICE_BUSINESS` | Oui | Identifiant du prix Stripe pour le plan Business (99€/mois) | `price_1GHI...` |

**Comment obtenir ces clés depuis le dashboard Stripe :**

1. Connectez-vous à [dashboard.stripe.com](https://dashboard.stripe.com)
2. **STRIPE_SECRET_KEY** : Développeurs → Clés API → "Clé secrète" (mode test : `sk_test_...`, mode live : `sk_live_...`)
3. **STRIPE_PRICE_STARTER/PRO/BUSINESS** : Catalogue de produits → créez les 3 produits (voir guide de déploiement), copiez l'identifiant `price_...` de chaque prix récurrent
4. **STRIPE_WEBHOOK_SECRET** : Développeurs → Webhooks → Créer un endpoint → Après création, "Révéler le secret de signature" → copier le `whsec_...`

En développement, vous pouvez utiliser les clés test (`sk_test_...`) et Stripe CLI pour simuler les webhooks :
```bash
stripe listen --forward-to localhost:8000/api/stripe/webhook
```

---

### Twilio (SMS — plan Pro et Business uniquement)

| Variable | Requis | Description | Exemple |
|----------|--------|-------------|---------|
| `TWILIO_ACCOUNT_SID` | Conditionnel | Identifiant de compte Twilio | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | Conditionnel | Token d'authentification Twilio | `your_auth_token_here` |
| `TWILIO_PHONE_NUMBER` | Conditionnel | Numéro de téléphone Twilio au format E.164 | `+33600000000` |

Ces variables sont requises uniquement si vous souhaitez activer les SMS (plans Pro et Business). Laisser vide désactive silencieusement les SMS.

**Comment obtenir ces informations depuis Twilio :**

1. Créez un compte sur [twilio.com](https://www.twilio.com)
2. **TWILIO_ACCOUNT_SID** et **TWILIO_AUTH_TOKEN** : visibles sur la page d'accueil de la console Twilio
3. **TWILIO_PHONE_NUMBER** : Console → Numéros de téléphone → Gérer → Acheter un numéro
   - Choisissez un numéro français (+33) ou un numéro virtuel compatible SMS
   - Format obligatoire : E.164, ex. `+33600000000`

**Note :** En développement, vous pouvez utiliser les numéros de test Twilio (messages loggués dans la console, non envoyés réellement).

---

### URLs et CORS

| Variable | Requis | Description | Exemple |
|----------|--------|-------------|---------|
| `FRONTEND_URL` | Oui | URL complète du frontend Next.js (utilisée dans les emails pour les liens) | `http://localhost:3000` / `https://app.artisan-portal.fr` |
| `CORS_ALLOW_ORIGIN` | Oui | Expression régulière des origines autorisées pour les requêtes CORS | `^https?://(localhost\|127\.0\.0\.1)(:[0-9]+)?$` |

**`FRONTEND_URL`** est utilisé pour construire les liens dans les emails transactionnels (magic links, notifications). Doit correspondre exactement à l'URL publique du frontend.

**`CORS_ALLOW_ORIGIN`** est une regex Symfony. Exemples :
- Développement : `^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$`
- Production : `^https://app\.artisan-portal\.fr$`
- Plusieurs domaines : `^https://(app\.artisan-portal\.fr|artisan-portal\.fr)$`

---

## Frontend (`frontend/.env.local`)

Créez le fichier `frontend/.env.local` (non versionné) :

| Variable | Requis | Description | Exemple |
|----------|--------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Oui | URL de base de l'API Symfony backend | `http://localhost:8000` |

**`NEXT_PUBLIC_API_URL`**
- Préfixe `NEXT_PUBLIC_` obligatoire pour que Next.js l'expose côté client
- En développement : `http://localhost:8000` (Nginx dans Docker)
- En production : `https://api.artisan-portal.fr` (URL Railway)
- Sans slash final

Exemple `frontend/.env.local` :
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Agents (`agents/.env`)

Copiez `agents/.env.example` vers `agents/.env` et renseignez les variables.

---

### Intelligence Artificielle (Anthropic)

| Variable | Requis | Description | Exemple |
|----------|--------|-------------|---------|
| `ANTHROPIC_API_KEY` | Oui | Clé API Anthropic pour accéder aux modèles Claude | `sk-ant-api03-...` |

**Comment créer une clé Anthropic :**
1. Créez un compte sur [console.anthropic.com](https://console.anthropic.com)
2. Allez dans **API Keys** → **Create Key**
3. Donnez un nom explicite (ex. `artisan-portal-agents`)
4. Copiez la clé immédiatement (elle ne sera plus affichée)
5. Configurez des limites de dépenses dans les paramètres de facturation

---

### API du portail (communication agents → backend)

| Variable | Requis | Description | Exemple |
|----------|--------|-------------|---------|
| `PORTAL_API_URL` | Oui | URL de base de l'API Symfony | `http://localhost:8000` |
| `PORTAL_API_TOKEN` | Oui | Token JWT d'un compte artisan pour que les agents s'authentifient | `eyJ0eXAiOiJKV1QiLCJhbGci...` |

**Comment obtenir le JWT `PORTAL_API_TOKEN` :**
```bash
# Créer un compte artisan dédié aux agents puis se connecter :
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"agents@artisan-portal.fr","password":"votre_mot_de_passe"}'
# Copiez le token JWT retourné dans le champ "token"
```
Le token expire après 1h (TTL configuré dans LexikJWT). Pour la production, préférez un mécanisme de rafraîchissement automatique ou augmentez le TTL pour le compte agents.

---

### Email transactionnel agents (Resend)

| Variable | Requis | Description | Exemple |
|----------|--------|-------------|---------|
| `RESEND_API_KEY` | Oui | Clé API Resend pour l'envoi d'emails | `re_xxxxxxxxxxxxxxxxxxxx` |
| `EMAIL_FROM` | Oui | Adresse et nom d'expéditeur des emails agents | `Artisan Portal <contact@artisan-portal.fr>` |

**Comment créer un compte Resend et obtenir la clé :**
1. Créez un compte gratuit sur [resend.com](https://resend.com) (3 000 emails/mois gratuits)
2. Allez dans **Domains** → **Add Domain** → ajoutez `artisan-portal.fr`
3. Ajoutez les enregistrements DNS demandés (SPF, DKIM, DMARC)
4. Allez dans **API Keys** → **Create API Key**
5. Copiez la clé `re_...`

**`EMAIL_FROM`** : L'adresse doit correspondre à un domaine vérifié dans Resend. Format : `Nom Affiché <email@domaine.fr>`

---

### SMS agents (Twilio)

Mêmes identifiants que pour le backend. Voir la section Twilio ci-dessus.

| Variable | Requis | Description |
|----------|--------|-------------|
| `TWILIO_ACCOUNT_SID` | Conditionnel | Identifiant de compte Twilio |
| `TWILIO_AUTH_TOKEN` | Conditionnel | Token d'authentification Twilio |
| `TWILIO_PHONE_NUMBER` | Conditionnel | Numéro Twilio au format E.164 |

---

### Enrichissement de données (Hunter.io)

| Variable | Requis | Description | Exemple |
|----------|--------|-------------|---------|
| `HUNTER_API_KEY` | Optionnel | Clé API Hunter.io pour trouver les emails professionnels d'artisans prospects | `abc123def456...` |

**Pourquoi Hunter.io est utile :**
Les agents marketing du projet prospectent des artisans (menuisiers, plombiers, peintres, etc.) sur le web. Hunter.io permet de trouver l'adresse email professionnelle associée à un nom de domaine ou une entreprise. Sans cette clé, l'agent de prospection fonctionne mais ne peut pas enrichir automatiquement les prospects avec leurs emails.

**Comment créer un compte Hunter :**
1. Créez un compte sur [hunter.io](https://hunter.io) (25 recherches/mois gratuites)
2. Allez dans **API** → copiez votre clé API
3. Pour un usage intensif, choisissez un plan payant

---

## Récapitulatif par environnement

### Développement (local)
Variables minimales requises pour lancer le projet :

```env
# backend/.env
APP_ENV=dev
APP_SECRET=dev_secret_changeme
DATABASE_URL="postgresql://artisan:artisan@localhost:5432/artisan_portal?serverVersion=16&charset=utf8"
JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem
JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem
JWT_PASSPHRASE=dev_passphrase
MAILER_DSN=smtp://localhost:1025
FRONTEND_URL=http://localhost:3000
CORS_ALLOW_ORIGIN=^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$

# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Production
Toutes les variables sont requises, notamment :
- `APP_ENV=prod`
- `APP_SECRET` : valeur aléatoire forte (32+ chars)
- `DATABASE_URL` : URL Railway PostgreSQL
- `JWT_PASSPHRASE` : passphrase forte
- `MAILER_DSN` : Resend ou SMTP production
- `AWS_*` : credentials S3 production
- `STRIPE_SECRET_KEY` : clé live (`sk_live_...`)
- `STRIPE_WEBHOOK_SECRET` : secret du webhook production
- `FRONTEND_URL` : `https://app.artisan-portal.fr`
- `CORS_ALLOW_ORIGIN` : `^https://app\.artisan-portal\.fr$`
