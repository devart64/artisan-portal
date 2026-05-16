# AGENTS IA MARKETING — Artisan Portal

Documentation complète du système d'agents IA autonomes pour la vente d'abonnements.

---

## Vue d'ensemble

Le système d'agents IA est un pipeline autonome qui trouve de vrais artisans français, les qualifie, leur envoie des messages personnalisés et assure le suivi jusqu'à la conversion.

```
┌──────────────────────────────────────────────────────────────┐
│               PIPELINE AGENTS IA MARKETING                   │
│                                                              │
│  [Scheduler] ──► [Scraper] ──► [Qualifier] ──► [Copywriter] │
│                                                      │       │
│                                              ┌───────┘       │
│                                              ▼               │
│                                        [emailService]        │
│                                        [smsService]          │
│                                              │               │
│                                              ▼               │
│                                      Lead: "contacted"       │
│                                              │               │
│                      Clic "intéressé" ───────┘               │
│                              │                               │
│                              ▼                               │
│                         [Closer]    Lead: "replied"          │
│                              │                               │
│                              ▼                               │
│                        [Onboarder]  J1 / J3 / J7            │
│                              │                               │
│                              ▼                               │
│                         Converti → Artisan Portal 🎉         │
└──────────────────────────────────────────────────────────────┘
```

---

## Stack technique

| Composant | Rôle |
|-----------|------|
| Node.js + TypeScript | Runtime |
| `@anthropic-ai/sdk` | Claude API (claude-opus-4-7) |
| `axios` | HTTP client (Sirene API + Portal API) |
| `resend` | Envoi emails |
| `twilio` | Envoi SMS |
| `node-cron` | Scheduler automatique |
| `chalk` | Logs colorés dans le terminal |

---

## Services

### `services/scraper.ts` — Source de leads réels

Utilise l'**API Sirene officielle** du gouvernement français (`recherche-entreprises.api.gouv.fr`).

**Avantages** :
- Gratuite, sans clé API
- Données officielles (Registre du Commerce)
- Filtre par code NAF (secteur d'activité)

**Codes NAF disponibles** :

| Métier | Code NAF |
|--------|----------|
| Plombier | 43.22A |
| Électricien | 43.21A |
| Peintre | 43.34Z |
| Maçon | 43.99C |
| Menuisier | 43.32A |
| Carreleur | 43.33Z |
| Charpentier | 43.91A |
| Plâtrier | 43.31Z |
| Couvreur | 43.91B |
| Serrurier | 43.29A |

**Limitation** : L'API Sirene ne retourne pas les emails ni les téléphones (données RGPD). Enrichissement nécessaire via Hunter.io.

```typescript
const leads = await scrapeLeads('plombier', 'Paris', 10)
// Retourne : [{ name, trade, city, source: 'sirene_api', notes: 'Société: ...' }]
```

---

### `services/emailService.ts` — Envoi emails (Resend)

Envoie des emails HTML avec tracking des interactions.

**Template HTML généré** :
- Corps de l'email personnalisé
- Bouton CTA orange "Je suis intéressé →" → `GET /api/webhooks/lead/interested/{leadId}`
- Lien pied de page "Se désinscrire" → `GET /api/webhooks/lead/unsubscribe/{leadId}`

```typescript
await sendEmail({
  to: 'martin@exemple.fr',
  subject: 'Gagnez du temps sur vos chantiers',
  html: emailBody,
  leadId: 'uuid-du-lead',
})
```

**Prérequis** : `RESEND_API_KEY` + domaine vérifié sur resend.com

---

### `services/smsService.ts` — Envoi SMS (Twilio)

Formatage E.164 automatique (`06...` → `+336...`). Limite 160 caractères.

```typescript
await sendSms('+33612345678', 'Bonjour Martin, découvrez Artisan Portal...')
```

**Prérequis** : `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

---

### `services/hunterService.ts` — Enrichissement email (Hunter.io)

Trouve l'email d'un contact à partir de son prénom, nom et domaine d'entreprise.
N'envoie que si le score de confiance Hunter est ≥ 50.
Retourne `null` si la clé API n'est pas configurée (mode dégradé).

```typescript
const email = await enrichEmail('Martin', 'DUPONT', 'martin-plomberie.fr')
// → 'martin.dupont@martin-plomberie.fr' ou null
```

**Alternatives gratuites** : Recherche manuelle LinkedIn, Apollo.io (plan gratuit), Kaspr.

---

### `utils.ts` — Retry avec backoff exponentiel

```typescript
// Réessaie automatiquement en cas d'erreur réseau ou rate limit
const result = await withRetry(() => client.messages.create(...), 3, 1000)
// Tentatives : immédiat → 1s → 2s → 4s
```

---

## Agents IA

Chaque agent utilise Claude via l'API Anthropic avec un system prompt spécialisé.

### Agent Prospecteur (`agents/prospector.ts`)

**Rôle** : Dans les campagnes manuelles (`pnpm prospect`), génère des leads fictifs mais réalistes via Claude (utile pour les tests). En production, le scraper Sirene est utilisé à la place.

**System prompt** :
```
Tu es l'agent Prospecteur d'Artisan Portal.
Génère une liste réaliste de prospects artisans français.
Retourne UNIQUEMENT un JSON valide : tableau d'objets avec name, email, phone, trade, city, source.
```

**Output** : `Lead[]` persisté via `portalClient.createLead()`

---

### Agent Qualificateur (`agents/qualifier.ts`)

**Rôle** : Score chaque lead de 0 à 100 selon des critères de qualité. Décide s'il faut contacter ou ignorer.

**System prompt** :
```
Évalue les leads artisans pour prioriser les contacts commerciaux.
Critères de scoring (0-100) :
- Métier à fort volume (plombier, électricien, maçon = +30pts)
- Email pro (domaine propre = +20pts, gmail = +10pts)
- Téléphone renseigné (+15pts)
- Ville avec forte densité (+15pts)
- Autres signaux (+20pts max)
Retourne JSON : { "score": number, "reasoning": string, "recommendation": "contact"|"skip"|"priority" }
```

**Input** : `Lead`
**Output** : `QualificationResult { score, reasoning, recommendation }`
**Effet** : Met à jour le lead en DB (`status: 'qualified'` ou `'lost'`, `score`, `notes`)

---

### Agent Copywriter (`agents/copywriter.ts`)

**Rôle** : Rédige un email et un SMS ultra-personnalisés selon le métier de l'artisan.

**System prompt** :
```
Tu rédiges des messages de prospection ultra-personnalisés pour des artisans français.
Ton ton : direct, chaleureux, sans jargon technique.
Tu parles de problèmes concrets : appels de clients, devis perdus, photos désorganisées.
Artisan Portal résout ces problèmes à 29€/mois.
Retourne JSON : { "subject": string, "emailBody": string, "smsText": string, "followUpDelay": number }
```

**Input** : `Lead`
**Output** : `OutreachContent { subject, emailBody, smsText, followUpDelay }`

**Exemple de résultat** :
```json
{
  "subject": "Martin, fini les appels 'c'est pour quand ?' 📞",
  "emailBody": "Bonjour Martin,\n\nEn tant que plombier...",
  "smsText": "Bonjour Martin ! Artisan Portal vous libère des appels clients. Essai gratuit : ...",
  "followUpDelay": 4
}
```

---

### Agent Closer (`agents/closer.ts`)

**Rôle** : Répond aux objections des artisans qui ont répondu ou montré de l'intérêt.

**System prompt** :
```
Tu réponds aux objections des artisans.
Objections courantes :
- "C'est trop cher" → 29€ = moins d'1h de travail, économise des dizaines d'appels
- "Je n'ai pas le temps" → installation 10 min, les agents IA gèrent
- "J'ai déjà WhatsApp" → WhatsApp ne gère pas devis signés, photos organisées, jalons
- "Mes clients ne sont pas à l'aise" → lien simple, pas de compte à créer
Propose toujours un essai gratuit 14 jours.
Retourne JSON : { "response": string, "suggestTrial": boolean, "trialLink": string }
```

**Input** : `Lead` + `objection: string`
**Output** : `{ response, suggestTrial, trialLink }`
**Effet** : Met à jour le lead (`status: 'replied'`, `lastContactedAt`, `notes`)

---

### Agent Onboarder (`agents/onboarder.ts`)

**Rôle** : Envoie des emails d'accompagnement les 7 premiers jours après inscription.

**System prompt** :
```
Tu accompagnes les nouveaux artisans inscrits.
Programme :
- Jour 1 : bienvenue + "Créez votre premier chantier en 3 clics"
- Jour 3 : "Invitez votre premier client" + astuce magic link
- Jour 7 : bilan + invitation plan Pro si usage actif
Retourne JSON : { "day": number, "subject": string, "body": string, "nextAction": string }
```

**Input** : `Lead` + `dayNumber: 1 | 3 | 7`
**Output** : `{ day, subject, body, nextAction }`
**Effet** : Au jour 7, passe le lead en `status: 'converted'`

---

## Orchestrateur (`orchestrator.ts`)

Pipeline complet de campagne :

```typescript
await runCampaign({ trade: 'plombier', city: 'Paris', count: 10 })
```

**Étapes** :
1. **Scraping** : `scrapeLeads()` → API Sirene → vraies entreprises artisanales
2. **Persistance** : `portalClient.createLead()` pour chaque lead trouvé
3. **Qualification** : `runQualifier()` par lead → filtre les leads faibles
4. **Copywriting** : `runCopywriter()` par lead qualifié → génère email + SMS
5. **Envoi email** : `sendEmail()` si `lead.email` existe
6. **Envoi SMS** : `sendSms()` si `lead.phone` existe ET smsText généré
7. **Mise à jour** : `portalClient.updateLead()` → status `'contacted'`, notes avec sujet + délai relance

**Rapport** :
```typescript
await runReport()
// Affiche : new: 5, qualified: 3, contacted: 2, replied: 1, converted: 0
// Taux conversion : 0.0% (0/11)
```

---

## Scheduler (`scheduler.ts`)

Lance des campagnes automatiques en tâche de fond.

| Expression cron | Heure | Action |
|----------------|-------|--------|
| `0 8 * * 1` | Lundi 08h00 | Rapport hebdomadaire |
| `0 9 * * 1-5` | Lun-Ven 09h00 | Campagne prospection (rotation villes/métiers) |
| `0 14 * * 1-5` | Lun-Ven 14h00 | Relances (à implémenter) |

**Rotation des campagnes** (une par jour, du lundi au vendredi) :

| Jour | Métier | Ville |
|------|--------|-------|
| Lundi | Plombier | Paris |
| Mardi | Électricien | Lyon |
| Mercredi | Peintre | Marseille |
| Jeudi | Maçon | Bordeaux |
| Vendredi | Menuisier | Toulouse |

---

## Commandes CLI

```bash
cd agents
cp .env.example .env    # Configurer les clés API
pnpm install            # Installer les dépendances
```

| Commande | Description | Exemple |
|----------|-------------|---------|
| `pnpm prospect [métier] [ville] [nb]` | Scrape des leads via l'API Sirene | `pnpm prospect electricien Paris 10` |
| `pnpm qualify` | Qualifie tous les leads au statut "new" | `pnpm qualify` |
| `pnpm campaign [métier] [ville] [nb]` | Pipeline complet : scrape → qualifie → envoie | `pnpm campaign plombier Lyon 5` |
| `pnpm report` | Rapport du pipeline (stats par statut) | `pnpm report` |
| `pnpm scheduler` | Démarre le scheduler 24h/24 (cron jobs) | `pnpm scheduler` |

---

## Webhooks de tracking

Inclus dans chaque email envoyé par le Copywriter :

| URL | Déclencheur | Effet |
|-----|-------------|-------|
| `GET /api/webhooks/lead/interested/{id}` | Clic "Je suis intéressé" | Lead → `replied` + redirect vers `/register` |
| `GET /api/webhooks/lead/unsubscribe/{id}` | Clic "Se désinscrire" | Lead → `lost` + page HTML confirmation |

---

## Enrichissement email — Hunter.io

L'API Sirene ne fournit pas les emails (RGPD). Pour des campagnes email automatiques, il faut enrichir les leads.

**Configuration** :
1. Créer un compte sur [hunter.io](https://hunter.io)
2. Récupérer la clé API dans Paramètres
3. Ajouter `HUNTER_API_KEY=votre_cle` dans `agents/.env`

**Plan gratuit** : 25 recherches/mois
**Plan Starter** : 500 recherches/mois → 49$/mois

**Alternatives** :
- [Apollo.io](https://apollo.io) — 50 crédits/mois gratuits
- [Kaspr](https://kaspr.io) — 5 crédits/mois gratuits
- [Dropcontact](https://dropcontact.com) — alternative française

---

## Étendre le système

### Ajouter un nouvel agent

```typescript
// agents/src/agents/mon-agent.ts
import Anthropic from '@anthropic-ai/sdk'
import { config } from '../config.js'
import { withRetry } from '../utils.js'
import type { Lead, AgentResult } from '../types.js'

const client = new Anthropic({ apiKey: config.anthropicApiKey })

export async function runMonAgent(lead: Lead): Promise<AgentResult<MonResultat>> {
  const message = await withRetry(() => client.messages.create({
    model: config.model,
    max_tokens: 512,
    system: 'Ton system prompt ici...',
    messages: [{ role: 'user', content: `Lead: ${lead.name}` }],
  }))
  // Extraire le JSON, retourner AgentResult
}
```

### Ajouter une source de leads

Créer une nouvelle fonction dans `services/scraper.ts` ou un nouveau fichier `services/mon-scraper.ts`. L'interface de retour doit correspondre à `Omit<Lead, 'id' | 'status' | 'createdAt'>[]`.

### Ajouter un canal (LinkedIn, WhatsApp)

1. Créer `services/linkedinService.ts` avec l'API LinkedIn ou Phantombuster
2. Dans `orchestrator.ts`, ajouter l'envoi LinkedIn après l'email
3. Tracker via un nouveau webhook dans `WebhookLeadController`
