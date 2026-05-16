import Anthropic from '@anthropic-ai/sdk'
import { config } from '../config.js'
import { portalClient } from '../portalClient.js'
import { withRetry } from '../utils.js'
import type { Lead, AgentResult } from '../types.js'

const client = new Anthropic({ apiKey: config.anthropicApiKey })

const SYSTEM = `Tu es l'agent Closer d'Artisan Portal.
Tu réponds aux objections des artisans qui ont reçu notre message de prospection.
Objections courantes :
- "C'est trop cher" → rappelle que 29€/mois = moins d'1h de travail, et qu'ils économisent des dizaines d'appels
- "Je n'ai pas le temps" → l'installation prend 10 minutes, les agents IA gèrent tout
- "J'ai déjà WhatsApp" → WhatsApp ne gère pas les devis signés, les photos organisées, les jalons
- "Mes clients ne sont pas à l'aise avec la techno" → le portail s'ouvre avec un simple lien, pas de compte à créer
Ton ton : patient, empathique, concret. Propose toujours un essai gratuit 14 jours.
Retourne UNIQUEMENT un JSON : { "response": string, "suggestTrial": boolean, "trialLink": string }`

export async function runCloser(lead: Lead, objection: string): Promise<AgentResult<{ response: string; suggestTrial: boolean; trialLink: string }>> {
  try {
    const message = await withRetry(() => client.messages.create({
      model: config.model,
      max_tokens: 512,
      system: SYSTEM,
      messages: [{
        role: 'user',
        content: `Lead : ${lead.name} (${lead.trade}, ${lead.city ?? 'France'})
Objection reçue : "${objection}"

Génère une réponse adaptée. trialLink = "https://artisan-portal.fr/essai?ref=${lead.id ?? 'agent'}"`,
      }],
    }))

    const text = message.content[0].type === 'text' ? message.content[0].text : '{}'
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Pas de JSON dans la réponse')

    const result = JSON.parse(jsonMatch[0])

    if (lead.id) {
      await portalClient.updateLead(lead.id, {
        status: 'replied',
        lastContactedAt: new Date().toISOString(),
        notes: `Objection: ${objection} | Réponse envoyée`,
      })
    }

    return {
      success: true,
      data: result,
      agentName: 'Closer',
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    return {
      success: false,
      error: String(error),
      agentName: 'Closer',
      timestamp: new Date().toISOString(),
    }
  }
}
