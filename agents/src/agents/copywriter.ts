import Anthropic from '@anthropic-ai/sdk'
import { config } from '../config.js'
import { withRetry } from '../utils.js'
import type { Lead, OutreachContent, AgentResult } from '../types.js'

const client = new Anthropic({ apiKey: config.anthropicApiKey })

const SYSTEM = `Tu es l'agent Copywriter d'Artisan Portal.
Tu rédiges des messages de prospection ultra-personnalisés pour des artisans français.
Ton ton : direct, chaleureux, sans jargon technique. Tu parles de problèmes concrets (appels de clients, devis perdus, photos de chantier désorganisées).
Artisan Portal résout ces problèmes avec un portail client simple à 29€/mois.
Les abonnements sont présentés par des agents IA disponibles 24h/24.
Retourne UNIQUEMENT un JSON : { "subject": string, "emailBody": string, "smsText": string, "followUpDelay": number }`

export async function runCopywriter(lead: Lead): Promise<AgentResult<OutreachContent>> {
  try {
    const message = await withRetry(() => client.messages.create({
      model: config.model,
      max_tokens: 1024,
      system: SYSTEM,
      messages: [{
        role: 'user',
        content: `Rédige un email + SMS de prospection pour :
Prénom/Nom : ${lead.name}
Métier : ${lead.trade}
Ville : ${lead.city ?? 'France'}

Personnalise pour ce métier spécifique. Email max 150 mots. SMS max 160 caractères.
followUpDelay = nombre de jours avant relance (3 à 7).`,
      }],
    }))

    const text = message.content[0].type === 'text' ? message.content[0].text : '{}'
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Pas de JSON dans la réponse')

    const content: OutreachContent = JSON.parse(jsonMatch[0])

    return {
      success: true,
      data: content,
      agentName: 'Copywriter',
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    return {
      success: false,
      error: String(error),
      agentName: 'Copywriter',
      timestamp: new Date().toISOString(),
    }
  }
}
