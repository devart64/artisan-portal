# DÉPLOIEMENT — Artisan Portal

Guide complet pour déployer Artisan Portal en production.

---

## Comptes requis

| Service | Rôle | Gratuit ? |
|---------|------|-----------|
| [Railway](https://railway.app) | Hébergement backend + PostgreSQL + Redis | Starter 5$/mois |
| [Vercel](https://vercel.com) | Hébergement frontend Next.js | Gratuit (Hobby) |
| [AWS](https://aws.amazon.com) | Stockage fichiers S3 | ~0,02$/Go |
| [Stripe](https://stripe.com) | Abonnements et paiements | 1,5% + 0,25€/transaction |
| [Twilio](https://twilio.com) | SMS notifications | ~0,08€/SMS |
| [Resend](https://resend.com) | Emails agents IA | 3 000 emails/mois gratuits |
| [Anthropic](https://console.anthropic.com) | API Claude (agents IA) | Pay-as-you-go |

---

## 1. Configuration AWS S3

### Créer le bucket

1. Connectez-vous à [console.aws.amazon.com](https://console.aws.amazon.com)
2. Recherchez **S3** → **Créer un compartiment**
3. Nom : `artisan-portal-prod` (ou votre choix unique)
4. Région : `eu-west-3` (Paris) — **recommandé pour RGPD**
5. **Bloquer tout accès public** : ✓ (cocher toutes les cases)
6. Créer le compartiment

### Créer un utilisateur IAM

1. IAM → Utilisateurs → Créer un utilisateur
2. Nom : `artisan-portal-backend`
3. Attacher la politique suivante (JSON) :

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::artisan-portal-prod/*"
    }
  ]
}
```

4. Créer une clé d'accès → copier `AWS_ACCESS_KEY_ID` et `AWS_SECRET_ACCESS_KEY`

---

## 2. Configuration Stripe

### Créer les produits

1. [dashboard.stripe.com](https://dashboard.stripe.com) → Produits → Créer un produit

**Plan Débutant** :
- Nom : "Artisan Portal — Débutant"
- Prix récurrent : 29€/mois → copier le `price_id`

**Plan Professionnel** :
- Nom : "Artisan Portal — Professionnel"
- Prix récurrent : 59€/mois → copier le `price_id`

**Plan Entreprise** :
- Nom : "Artisan Portal — Entreprise"
- Prix récurrent : 99€/mois → copier le `price_id`

### Configurer le webhook

1. Stripe Dashboard → Développeurs → Webhooks → Ajouter un endpoint
2. URL : `https://votre-backend.railway.app/api/stripe/webhook`
3. Événements à écouter :
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
4. Copier le **Webhook signing secret** → `STRIPE_WEBHOOK_SECRET`

### Passer en mode live

Basculer le toggle "Mode test" → "Mode live" dans Stripe Dashboard.
Récupérer la clé live `sk_live_...` → `STRIPE_SECRET_KEY`

---

## 3. Déploiement Backend (Railway)

### Installation Railway CLI

```bash
npm install -g @railway/cli
railway login
```

### Créer le projet

```bash
railway init
# Choisir "Empty Project"
# Nom : artisan-portal
```

### Ajouter PostgreSQL et Redis

```bash
railway add --plugin postgresql
railway add --plugin redis
```

Railway génère automatiquement les variables `DATABASE_URL` et `REDIS_URL`.

### Déployer le backend

```bash
cd backend
railway up --service backend
```

**Ou via GitHub** : Railway Dashboard → New Service → GitHub Repo → sélectionner le repo → Root Directory : `backend/`

### Variables d'environnement backend (Railway)

Dans Railway Dashboard → Service backend → Variables, ajouter :

```
APP_ENV=prod
APP_SECRET=<openssl rand -hex 32>
DATABASE_URL=<auto-rempli par Railway>
JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem
JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem
JWT_PASSPHRASE=<mot de passe sécurisé>
MAILER_DSN=smtp://user:pass@smtp.resend.com:465
AWS_ACCESS_KEY_ID=<votre clé>
AWS_SECRET_ACCESS_KEY=<votre clé>
AWS_REGION=eu-west-3
AWS_BUCKET=artisan-portal-prod
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx
TWILIO_PHONE_NUMBER=+33xxxxxxxxx
FRONTEND_URL=https://artisan-portal.fr
CORS_ALLOW_ORIGIN=https://artisan-portal.fr
```

### Vérifier le déploiement

```bash
curl https://votre-backend.railway.app/api/auth/register \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"testtest"}'
# → 201 avec token JWT
```

---

## 4. Déploiement Frontend (Vercel)

### Via CLI

```bash
npm install -g vercel
cd frontend
vercel --prod
```

### Via GitHub (recommandé)

1. [vercel.com](https://vercel.com) → Import Project → GitHub
2. Sélectionner le repo `artisan-portal`
3. Root Directory : `frontend`
4. Framework : Next.js (auto-détecté)
5. Variables d'environnement :

```
NEXT_PUBLIC_API_URL=https://votre-backend.railway.app
```

6. Deploy

### Configurer le domaine custom

1. Vercel Dashboard → Project → Settings → Domains
2. Ajouter `artisan-portal.fr` et `www.artisan-portal.fr`
3. Configurer les DNS (voir section suivante)

---

## 5. Configuration DNS

Chez votre registrar (OVH, Gandi, etc.) :

| Type | Nom | Valeur | TTL |
|------|-----|--------|-----|
| A | @ | `76.76.21.21` (IP Vercel) | 3600 |
| CNAME | www | `cname.vercel-dns.com` | 3600 |
| CNAME | api | `votre-backend.railway.app` | 3600 |

**Attente** : propagation DNS 1-24h. Vérifier avec `dig artisan-portal.fr`.

### SSL/TLS

Vercel gère SSL automatiquement (Let's Encrypt).
Railway gère SSL automatiquement sur les domaines custom.

---

## 6. Déploiement Agents IA

### Option 1 : Railway Worker

```bash
cd agents
railway up --service agents
```

Configurer les variables dans Railway → Service agents :
```
ANTHROPIC_API_KEY=sk-ant-...
PORTAL_API_URL=https://votre-backend.railway.app
PORTAL_API_TOKEN=<JWT d'un compte artisan dédié>
RESEND_API_KEY=re_...
EMAIL_FROM=Artisan Portal <contact@artisan-portal.fr>
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx
TWILIO_PHONE_NUMBER=+33xxxxxxxxx
HUNTER_API_KEY=xxxx (optionnel)
```

Command de démarrage : `pnpm scheduler`

### Option 2 : VPS (Ubuntu)

```bash
# Sur le VPS
git clone https://github.com/devart64/artisan-portal.git
cd artisan-portal/agents
cp .env.example .env
nano .env  # Remplir les variables

pnpm install
# Utiliser PM2 pour garder le process en vie
npm install -g pm2
pm2 start "pnpm scheduler" --name artisan-agents
pm2 save
pm2 startup
```

---

## 7. Obtenir le PORTAL_API_TOKEN pour les agents

Le token est un JWT d'un compte artisan dédié aux agents :

```bash
curl https://votre-backend.railway.app/api/auth/register \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"name":"Agents IA","email":"agents@artisan-portal.fr","password":"secret-securise"}'

# → Copier le token retourné → PORTAL_API_TOKEN
```

---

## Checklist de lancement

### Infrastructure
- [ ] Bucket S3 créé, politique sans accès public, utilisateur IAM configuré
- [ ] Backend déployé sur Railway et accessible (`/api/auth/register` → 201)
- [ ] PostgreSQL Railway connecté, migrations appliquées
- [ ] Redis Railway connecté
- [ ] Frontend déployé sur Vercel (`/` → landing page)
- [ ] Domaine `artisan-portal.fr` configuré et SSL actif
- [ ] Variables d'environnement complètes sur Railway et Vercel

### Stripe
- [ ] Produits créés (3 plans avec prix)
- [ ] Webhook configuré et testé (`stripe trigger customer.subscription.updated`)
- [ ] Clés live (pas test) utilisées en production

### Email / SMS
- [ ] Domaine vérifié sur Resend (DNS SPF + DKIM)
- [ ] Numéro Twilio actif et testé
- [ ] Email de bienvenue reçu après inscription test

### Agents IA
- [ ] Scheduler démarré et actif
- [ ] Première campagne manuelle testée (`pnpm campaign plombier Paris 3`)
- [ ] Webhooks `/interested` et `/unsubscribe` testés manuellement

### Sécurité
- [ ] `APP_SECRET` généré aléatoirement (32+ chars)
- [ ] `JWT_PASSPHRASE` fort et unique
- [ ] Aucune clé API dans le code versionné
- [ ] CORS configuré avec le vrai domaine (`CORS_ALLOW_ORIGIN=https://artisan-portal.fr`)
- [ ] Rate limiting actif (testé avec 11+ requêtes sur `/api/auth/login`)

### Fonctionnel
- [ ] Inscription artisan → email de bienvenue reçu
- [ ] Création chantier → visible dans le dashboard
- [ ] Magic link envoyé → portail client accessible
- [ ] Upload document → téléchargeable via URL S3 pré-signée
- [ ] SMS envoyé sur plan Pro (tester avec numéro réel)
- [ ] Paiement Stripe test (`4242 4242 4242 4242`) → plan mis à jour

### SEO
- [ ] `/sitemap.xml` accessible et correctement formé
- [ ] `/robots.txt` accessible
- [ ] Google Search Console → soumettre le sitemap
- [ ] Métadonnées OpenGraph testées (partage LinkedIn/Twitter)
