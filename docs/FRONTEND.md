# FRONTEND — Artisan Portal

Documentation complète du frontend Next.js 15.

---

## Stack technique

| Composant | Version | Rôle |
|-----------|---------|------|
| Next.js | 15.x | Framework React avec App Router |
| React | 19.x | UI Library |
| TypeScript | 5.x | Typage statique |
| Tailwind CSS | 3.x | Utility-first CSS |
| shadcn/ui | latest | Composants UI (Radix UI) |
| Zod | 3.x | Validation de formulaires |
| sonner | 1.x | Toast notifications |
| lucide-react | latest | Icônes SVG |
| react-dropzone | latest | Upload de fichiers drag & drop |

---

## Structure des dossiers

```
frontend/
├── app/                          # App Router Next.js
│   ├── layout.tsx                # Root layout (métadonnées SEO globales)
│   ├── page.tsx                  # Landing page marketing (/)
│   ├── globals.css               # Variables CSS, directives Tailwind
│   ├── error.tsx                 # Page d'erreur globale (client)
│   ├── not-found.tsx             # Page 404 personnalisée
│   ├── sitemap.ts                # Sitemap dynamique (/sitemap.xml)
│   ├── manifest.json             # PWA manifest
│   ├── sw.js                     # Service Worker (cache-first + push handler)
│   ├── (auth)/                   # Groupe de routes auth (layout centré)
│   │   ├── layout.tsx            # Layout : logo + formulaire centré
│   │   ├── login/page.tsx        # Page de connexion artisan
│   │   ├── register/page.tsx     # Page d'inscription artisan
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   └── invitation/[token]/page.tsx  # Acceptation invitation collaborateur
│   ├── (dashboard)/              # Groupe routes dashboard (sidebar)
│   │   ├── layout.tsx            # Layout : Sidebar + Header
│   │   ├── error.tsx             # Page d'erreur dashboard (client)
│   │   ├── dashboard/page.tsx    # Tableau de bord (stats + onboarding)
│   │   ├── chantiers/
│   │   │   ├── page.tsx          # Liste avec PlanLimitBanner
│   │   │   ├── new/page.tsx      # Bloqué si limite atteinte
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Détail + bouton "Générer devis IA"
│   │   │       ├── actions.ts    # Server Actions (updateStatus, sendPortal, toggleJalon)
│   │   │       ├── documents/page.tsx   # Avec PDF + bouton signer
│   │   │       ├── photos/page.tsx
│   │   │       ├── planning/page.tsx   # Avec export ICS Google Calendar
│   │   │       └── messages/page.tsx
│   │   ├── clients/page.tsx      # CRUD clients (dialog)
│   │   └── settings/
│   │       ├── page.tsx          # Paramètres branding (logo, couleur, nom)
│   │       ├── billing/page.tsx  # Stripe checkout + banner trial
│   │       ├── team/page.tsx     # Gestion collaborateurs
│   │       ├── security/page.tsx # 2FA TOTP setup
│   │       ├── audit/page.tsx    # Journal d'activité
│   │       ├── export/page.tsx   # Export CSV comptabilité
│   │       ├── account/page.tsx  # RGPD export/delete + push notifications
│   │       └── api-keys/page.tsx # Clés API (plan Business)
│   ├── (legal)/                  # Groupe routes légales (layout simple)
│   │   ├── layout.tsx
│   │   ├── cgv/page.tsx
│   │   ├── mentions-legales/page.tsx
│   │   └── politique-confidentialite/page.tsx
│   └── portal/
│       └── [token]/              # Portail client (accès par magic link)
│           ├── layout.tsx        # Layout portail (brandColor, nav tabs)
│           ├── page.tsx          # Vue principale (infos chantier)
│           ├── documents/page.tsx
│           ├── photos/page.tsx
│           ├── planning/page.tsx
│           └── messages/page.tsx
├── components/
│   ├── ui/                       # Composants shadcn/ui (13 fichiers)
│   ├── chantier/                 # Composants métier chantier
│   ├── portal/                   # Composants portail client
│   └── shared/                   # Composants partagés (Sidebar, Header...)
├── lib/
│   ├── api.ts                    # Client HTTP authentifié (JWT)
│   ├── auth.ts                   # Server Actions auth (login, logout, register)
│   ├── portal.ts                 # Client HTTP portail (token URL)
│   ├── types.ts                  # Interfaces TypeScript
│   └── utils.ts                  # Utilitaires (cn, formatDate...)
├── public/
│   ├── robots.txt                # SEO : routes publiques/privées
│   └── icons/                    # Icônes PWA (192x192, 512x512)
├── middleware.ts                  # Protection des routes privées
├── next.config.ts                 # Config Next.js (standalone, S3 images)
└── package.json
```

---

## Routes et pages

### `/` — Landing page
- **Fichier** : `app/page.tsx`
- **Type** : Server Component
- **Contenu** : Page marketing complète (hero, douleurs, solution, pricing 29/59/99€, témoignages, FAQ, CTA)
- **Liens** : vers `/register`, `/login`, `/cgv`, `/mentions-legales`, `/politique-confidentialite`

### `/login` — Connexion artisan
- **Fichier** : `app/(auth)/login/page.tsx`
- **Type** : Client Component (`'use client'`)
- **Validation** : Zod (`email`, `password` requis)
- **Action** : Appelle `login()` Server Action → stocke JWT en cookie → redirect `/dashboard`

### `/register` — Inscription artisan
- **Fichier** : `app/(auth)/register/page.tsx`
- **Type** : Client Component
- **Validation** : Zod (`name`, `email`, `password` min 8 chars)
- **Action** : Appelle `register()` Server Action → POST `/api/auth/register` → redirect `/dashboard`

### `/forgot-password` et `/reset-password`
- Formulaires de réinitialisation de mot de passe
- `forgot-password` : envoie l'email de réinitialisation
- `reset-password` : consomme le token reçu par email

### `/invitation/[token]` — Invitation collaborateur
- **Fichier** : `app/(auth)/invitation/[token]/page.tsx`
- **Type** : Client Component
- Accepte l'invitation via `POST /api/auth/invitation/accept/{token}`
- Redirige vers `/dashboard` après activation du compte

### `/dashboard` — Tableau de bord
- **Fichier** : `app/(dashboard)/dashboard/page.tsx`
- **Type** : Server Component
- **Données** : GET `/api/chantiers`, GET `/api/messages?unread=true`, GET `/api/onboarding/checklist`
- **Contenu** : Cards stats, `OnboardingChecklist`, `OnboardingModal` (premier login), liste des derniers chantiers

### `/chantiers` — Liste des chantiers
- **Fichier** : `app/(dashboard)/chantiers/page.tsx`
- **Type** : Server Component
- **Données** : GET `/api/chantiers`
- **Contenu** : Grille de ChantierCards avec filtre par statut (tabs) + `PlanLimitBanner` si quota atteint

### `/chantiers/new` — Nouveau chantier
- **Fichier** : `app/(dashboard)/chantiers/new/page.tsx`
- **Type** : Client Component
- **Comportement** : bloqué avec message d'erreur si la limite plan est atteinte
- **Action** : POST `/api/chantiers` via ChantierForm

### `/chantiers/[id]` — Détail chantier
- **Fichier** : `app/(dashboard)/chantiers/[id]/page.tsx`
- **Type** : Server Component
- **Données** : GET `/api/chantiers/{id}`
- **Contenu** : Infos chantier + tabs (Documents, Photos, Planning, Messages) + Server Actions + bouton `DevisIaButton` (plan Business)

### `/chantiers/[id]/documents` — Documents
- Upload via DocumentUploader (drag & drop)
- Liste des documents avec statut et bouton téléchargement (URL pré-signée S3)
- Bouton "Générer PDF" (dompdf)
- `SignatureModal` pour la signature canvas HTML5 côté portail client

### `/chantiers/[id]/photos` — Photos
- Upload via DropZone
- Galerie photos avec pré-visualisation

### `/chantiers/[id]/planning` — Jalons
- Timeline des jalons avec cases à cocher
- Ajout/suppression de jalons
- Bouton "Exporter vers Google Calendar" → téléchargement du fichier `.ics`

### `/chantiers/[id]/messages` — Messages
- Chat artisan ↔ client
- Marquage lu/non lu automatique

### `/clients` — Gestion clients
- **Fichier** : `app/(dashboard)/clients/page.tsx`
- **Type** : Client Component
- **Contenu** : Tableau clients + Dialog création/édition

### `/settings` — Paramètres branding
- Logo upload, couleur de marque, nom affiché dans le portail client

### `/settings/billing` — Facturation
- Affiche le plan actif et le statut de l'abonnement
- Banner "Période d'essai" si statut `trialing`
- Bouton "Changer de plan" → session Stripe Checkout
- Bouton "Gérer mon abonnement" → URL portail Stripe

### `/settings/team` — Collaborateurs
- Liste des collaborateurs du tenant
- Formulaire d'invitation par email (token 7 jours)
- Bouton de suppression d'un collaborateur

### `/settings/security` — Sécurité
- Setup 2FA TOTP avec QR code à scanner (Google Authenticator)
- Activation/désactivation de la 2FA

### `/settings/audit` — Journal d'activité
- Liste paginée des actions enregistrées dans `audit_logs`
- Filtre par type d'action

### `/settings/export` — Export comptabilité
- Boutons pour télécharger les CSV chantiers et documents

### `/settings/account` — Compte
- **RGPD** : bouton "Exporter mes données" (JSON) + bouton "Supprimer mon compte"
- **Push notifications** : composant `PushNotifSetup` (subscribe/unsubscribe)

### `/settings/api-keys` — Clés API
- Visible uniquement pour les tenants plan Business
- Génère et révoque des clés API pour intégrations tierces

### `/portal/[token]` — Portail client
- **Auth** : Token dans l'URL (magic link)
- **Layout** : Couleur de marque du tenant, navigation par tabs
- **Pages** : Vue principale, Documents, Photos, Planning, Messages
- **Restrictions** : Lecture seule (sauf messages et signature de documents)

### `/mentions-legales`, `/cgv`, `/politique-confidentialite`
- Pages légales statiques en français
- Layout simple avec header logo et footer liens

### `not-found.tsx` — Page 404
- Logo ArtisanPortal, bouton retour accueil, lien vers /login

### `error.tsx` — Page d'erreur
- Affiche l'erreur, bouton "Réessayer" (`reset()`), bouton retour accueil

---

## Composants

### `components/ui/` — shadcn/ui

| Composant | Usage |
|-----------|-------|
| `button.tsx` | Boutons (variants: default, outline, ghost, destructive) |
| `input.tsx` | Champs texte |
| `label.tsx` | Labels formulaires |
| `card.tsx` | Cards (Card, CardHeader, CardTitle, CardContent, CardFooter) |
| `dialog.tsx` | Modales (Dialog, DialogTrigger, DialogContent...) |
| `dropdown-menu.tsx` | Menus déroulants |
| `avatar.tsx` | Avatars utilisateur |
| `badge.tsx` | Badges statut (variants: default, secondary, destructive, outline) |
| `tabs.tsx` | Navigation par onglets |
| `textarea.tsx` | Champs texte multilignes |
| `select.tsx` | Listes déroulantes |
| `separator.tsx` | Séparateurs visuels |
| `toast.tsx` | Toasts (utilisé avec sonner) |

### `components/shared/`

**Sidebar** (`Sidebar.tsx`)
- Navigation principale du dashboard
- Liens : Dashboard, Chantiers, Clients, Paramètres (Branding, Facturation, Équipe, Sécurité, Audit, Export, Compte, Clés API)
- Logo ArtisanPortal en haut
- Bouton déconnexion en bas

**Header** (`Header.tsx`)
- Barre du haut du dashboard
- Titre de la page courante
- `NotificationBell` à droite
- Avatar utilisateur + menu dropdown (profil, déconnexion)

**NotificationBell** (`NotificationBell.tsx`)
- Icône cloche dans le Header
- Polling toutes les 30 secondes sur `GET /api/notifications`
- Badge rouge avec le nombre de notifications non lues
- Popover au clic : liste des notifications avec lien vers la ressource concernée
- Bouton "Tout marquer comme lu" → `POST /api/notifications/read-all`

**OnboardingModal** (`OnboardingModal.tsx`)
- Dialog affiché automatiquement au premier login de l'artisan
- Guide en étapes : créer un premier chantier, inviter un client, personnaliser le branding
- Se ferme et ne réapparaît plus une fois complété

**OnboardingChecklist** (`OnboardingChecklist.tsx`)
- Widget affiché dans le dashboard
- Liste des étapes d'onboarding avec état (complété/non complété)
- Données issues de `GET /api/onboarding/checklist`
- Disparaît automatiquement une fois toutes les étapes complétées

**PlanLimitBanner** (`PlanLimitBanner.tsx`)
- Bandeau d'avertissement affiché sur la liste des chantiers
- Orange si proche du quota (ex: 4/5 chantiers), rouge si quota atteint
- Lien vers `/settings/billing` pour upgrader

**DropZone** (`DropZone.tsx`)
- Upload fichiers par drag & drop
- Utilise `react-dropzone`
- Props : `onDrop(files)`, `accept`, `maxSize`

**ErrorBoundary** (`ErrorBoundary.tsx`)
- Composant React class pour capturer les erreurs
- Affiche un message d'erreur propre en cas de crash

### `components/chantier/`

**ChantierCard** (`ChantierCard.tsx`)
- Props : `chantier: Chantier`
- Affiche : titre, client, statut (badge coloré), dates, lien vers détail

**ChantierForm** (`ChantierForm.tsx`)
- Formulaire création/édition chantier
- Validation Zod
- Props : `onSubmit`, `defaultValues?`

**ChantierStatusBadge** (`ChantierStatusBadge.tsx`)
- Props : `status: ChantierStatusEnum`
- Retourne un `<Badge>` avec couleur selon le statut

**DocumentUploader** (`DocumentUploader.tsx`)
- Upload documents avec type et label
- Drag & drop + sélection fichier
- Affiche la progression

**SignatureModal** (`SignatureModal.tsx`)
- Modal avec canvas HTML5 pour la signature manuscrite
- Boutons : effacer, valider
- Envoie la signature encodée en base64 via `POST /api/portal/{token}/documents/{id}/sign`
- Disponible dans le portail client

**DevisIaButton** (`DevisIaButton.tsx`)
- Bouton affiché sur la page détail chantier (plan Business uniquement)
- Ouvre une modal de génération de devis IA
- Appelle `GET /api/ai/chantiers/{id}/devis`
- Affiche le brouillon Markdown généré par Claude

### `components/portal/`

**PortalHeader** (`PortalHeader.tsx`)
- En-tête du portail client
- Logo tenant (brandColor), nom de l'entreprise artisane
- Navigation par tabs (Chantier, Documents, Photos, Planning, Messages)

**PortalDocuments** (`PortalDocuments.tsx`)
- Liste des documents du chantier
- Bouton téléchargement (URL pré-signée S3)
- Badge statut (en_attente, signé, refusé)
- Bouton "Signer" → ouvre `SignatureModal`

**PortalPhotos** (`PortalPhotos.tsx`)
- Galerie photos du chantier
- Affichage en grille avec caption

**PortalPlanning** (`PortalPlanning.tsx`)
- Timeline des jalons
- Icône ✓ si done, ○ si en attente
- Dates formatées

**PortalMessages** (`PortalMessages.tsx`)
- Chat entre client et artisan
- Formulaire envoi message (côté client uniquement)
- Distinction visuelle artisan/client

### `components/settings/`

**PushNotifSetup** (`PushNotifSetup.tsx`)
- Affiché dans `/settings/account`
- Vérifie si le navigateur supporte les notifications push
- Bouton "Activer les notifications" → demande la permission + appelle `POST /api/push/subscribe`
- Bouton "Désactiver" → appelle `POST /api/push/unsubscribe`
- Récupère la clé publique VAPID via `GET /api/push/vapid-public-key`

---

## PWA — Application Web Progressive

### manifest.json

Fichier : `app/manifest.json`

```json
{
  "name": "Artisan Portal",
  "short_name": "ArtisanPortal",
  "theme_color": "#1A56A0",
  "background_color": "#ffffff",
  "display": "standalone",
  "start_url": "/dashboard",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Service Worker (`sw.js`)

Stratégie **cache-first** pour les assets statiques.

Gestion des **notifications push** (handler `push`) :
- Reçoit les payloads de notifications
- Affiche une notification système avec titre, corps et icône
- Gère le clic sur la notification (ouverture de la page concernée)

---

## Librairies (`lib/`)

### `lib/api.ts` — Client HTTP authentifié

```typescript
// Appel API authentifié avec JWT
const data = await apiFetch<Chantier[]>('/api/chantiers')

// Avec options
const chantier = await apiFetch<Chantier>('/api/chantiers', {
  method: 'POST',
  body: JSON.stringify({ title: 'Rénovation salle de bain' }),
})
```

`apiFetch<T>(path, options?)` :
- Lit le JWT depuis le cookie `jwt_token`
- Ajoute `Authorization: Bearer {token}` automatiquement
- Lance une `APIError` si la réponse n'est pas 2xx

`APIError` : `class APIError extends Error { status: number; data: unknown }`

---

### `lib/auth.ts` — Server Actions auth

```typescript
// Connexion
const result = await login(email, password)
// → POST /api/auth/login → stocke JWT cookie → redirect /dashboard

// Inscription
const result = await register(name, email, password)
// → POST /api/auth/register → stocke JWT cookie → redirect /dashboard

// Déconnexion
await logout()
// → supprime le cookie JWT → redirect /login

// Récupérer le JWT courant
const token = await getJwt()
// → retourne string ou null
```

**Important** : Ces fonctions sont des Server Actions (`'use server'`). Le JWT est stocké dans un cookie HttpOnly inaccessible au JavaScript du navigateur.

---

### `lib/portal.ts` — Client HTTP portail

```typescript
// Appel depuis le portail client (token dans l'URL)
const data = await portalFetch<PortalData>(token, '')
const docs = await portalFetch<Document[]>(token, '/documents')
```

`portalFetch<T>(token, path)` :
- Appelle `GET /api/portal/{token}{path}`
- Lance une `PortalError` si token invalide ou expiré

---

### `lib/types.ts` — Interfaces TypeScript

```typescript
// Principales interfaces
interface Tenant { id, name, slug, logoUrl, brandColor, plan, planStatus }
interface Chantier { id, title, description, status, startDate, endDate, address, client, jalons, createdAt }
interface Client { id, name, email, phone }
interface Document { id, type, label, filePath, status, uploadedAt }
interface Photo { id, filePath, caption, uploadedAt }
interface Message { id, senderType, senderName, content, isRead, createdAt }
interface Jalon { id, title, date, done }
interface Notification { id, type, title, body, isRead, relatedId, createdAt }
interface AuditLog { id, action, resourceType, resourceId, context, ipAddress, createdAt }
interface ApiKey { id, name, prefix, lastUsedAt, createdAt }
interface OnboardingChecklist { steps: { key: string, label: string, done: boolean }[] }
interface PortalData { tenant: Tenant, chantier: Chantier, client: Client }

// Enums TypeScript
type ChantierStatus = 'en_attente' | 'en_cours' | 'termine' | 'archive'
type DocumentType = 'devis' | 'facture' | 'plan' | 'contrat' | 'autre'
type DocumentStatus = 'en_attente' | 'signe' | 'refuse'
type Plan = 'starter' | 'pro' | 'business'
type PlanStatus = 'trialing' | 'active' | 'past_due' | 'canceled'
```

---

### `lib/utils.ts` — Utilitaires

| Fonction | Signature | Description |
|----------|-----------|-------------|
| `cn` | `(...classes) => string` | Fusionne les classes Tailwind (clsx + twMerge) |
| `formatDate` | `(date: string) => string` | "16 mai 2026" |
| `formatDateTime` | `(date: string) => string` | "16 mai 2026 à 14:30" |
| `truncate` | `(str: string, n: number) => string` | Tronque avec "..." |

---

## Middleware

**Fichier** : `middleware.ts`

Routes protégées (redirigent vers `/login` si pas de JWT) :
```
/dashboard*
/chantiers*
/clients*
/settings*
```

Routes publiques (pas de vérification) :
```
/           (landing)
/login
/register
/forgot-password
/reset-password
/invitation/*
/portal/*   (accès par token)
/api/*      (géré par le backend)
/cgv, /mentions-legales, /politique-confidentialite
```

**Ajouter une route protégée** : modifier le `matcher` dans `middleware.ts` :
```typescript
export const config = {
  matcher: ['/dashboard/:path*', '/chantiers/:path*', '/ma-nouvelle-route/:path*'],
}
```

---

## Patterns importants

### Server Components vs Client Components

```
Server Component (défaut) :
  ✓ Fetching de données directement (async/await)
  ✓ Accès aux cookies serveur
  ✓ Meilleur SEO
  ✗ Pas de hooks (useState, useEffect)
  ✗ Pas d'event handlers

Client Component ('use client') :
  ✓ Hooks React
  ✓ Event handlers (onClick, onChange)
  ✓ State local
  ✗ Pas d'accès direct aux données serveur
```

**Règle** : n'utilisez `'use client'` que pour les formulaires interactifs et les composants avec état.

### Server Actions

Les mutations de données passent par des Server Actions définies dans `actions.ts` :

```typescript
// app/(dashboard)/chantiers/[id]/actions.ts
'use server'

export async function updateStatus(id: string, status: string) {
  await apiFetch(`/api/chantiers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
  revalidatePath(`/chantiers/${id}`)
}
```

### Gestion des erreurs

- **`error.tsx`** : capture les erreurs non-gérées au niveau de la route
- **`not-found.tsx`** : affiché automatiquement si `notFound()` est appelé
- **`ErrorBoundary`** : pour les sous-arbres de composants spécifiques
- **`APIError`** : erreur HTTP du backend (status + data)

---

## Notifications

### Notifications in-app

Le composant `NotificationBell` fait un polling de `GET /api/notifications` toutes les 30 secondes. Les nouvelles notifications sont affichées avec un badge rouge sur l'icône cloche.

### Notifications push (Web Push / VAPID)

1. L'utilisateur active les push dans `/settings/account` via `PushNotifSetup`
2. Le frontend récupère la clé VAPID publique et demande la permission navigateur
3. L'abonnement push est envoyé au backend (`POST /api/push/subscribe`)
4. Le backend utilise `PushService` pour envoyer des notifications via `minishlink/web-push`
5. Le Service Worker (`sw.js`) reçoit les événements push et affiche la notification système

---

## SEO

Configurer dans `app/layout.tsx` via l'objet `metadata` Next.js :

```typescript
export const metadata: Metadata = {
  title: 'Artisan Portal — Le portail client pour artisans',
  description: '...',
  openGraph: { ... },
  twitter: { card: 'summary_large_image' },
}
```

- **sitemap.xml** : généré automatiquement à `/sitemap.xml` via `app/sitemap.ts`
- **robots.txt** : `public/robots.txt` — protège les routes privées de l'indexation
- **canonical** : défini dans le root layout
