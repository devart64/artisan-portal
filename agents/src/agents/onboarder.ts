import Anthropic from '@anthropic-ai/sdk'
import { config } from '../config.js'
import { portalClient } from '../portalClient.js'
import { withRetry } from '../utils.js'
import type { Lead, AgentResult } from '../types.js'

const client = new Anthropic({ apiKey: config.anthropicApiKey })

const SYSTEM = `Tu es l'agent Onboarder d'Artisan Portal.
Tu accompagnes les nouveaux artisans inscrits pendant leurs 7 premiers jours.
Programme d'onboarding :
- Jour 1 : email de bienvenue + guide "Créez votre premier chantier en 3 clics"
- Jour 3 : email "Invitez votre premier client" + astuce magic link
- Jour 7 : email bilan + invitation à passer au plan Pro si usage actif

Ton ton : encourageant, simple, pratique. Pas de jargon.
Retourne UNIQUEMENT un JSON : { "day": number, "subject": string, "body": string, "nextAction": string }`

export async function runOnboarder(lead: Lead, dayNumber: 1 | 3 | 7): Promise<AgentResult<{ day: number; subject: string; body: string; nextAction: string }>> {
  try {
    const message = await withRetry(() => client.messages.create({
      model: config.model,
      max_tokens: 512,
      system: SYSTEM,
      messages: [{
        role: 'user',
        content: `Nouvel inscrit : ${lead.name} (${lead.trade})
Génère le message d'onboarding du Jour ${dayNumber}.`,
      }],
    }))

    const text = message.content[0].type === 'text' ? message.content[0].text : '{}'
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Pas de JSON dans la réponse')

    const result = JSON.parse(jsonMatch[0])

    if (lead.id && dayNumber === 7) {
      await portalClient.updateLead(lead.id, { status: 'converted' })
    }

    return {
      success: true,
      data: result,
      agentName: 'Onboarder',
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    return {
      success: false,
      error: String(error),
      agentName: 'Onboarder',
      timestamp: new Date().toISOString(),
    }
  }
}
