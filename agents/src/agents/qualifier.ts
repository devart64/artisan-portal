import Anthropic from '@anthropic-ai/sdk'
import { config } from '../config.js'
import { portalClient } from '../portalClient.js'
import type { Lead, QualificationResult, AgentResult } from '../types.js'

const client = new Anthropic({ apiKey: config.anthropicApiKey })

const SYSTEM = `Tu es l'agent Qualificateur d'Artisan Portal.
Évalue les leads artisans pour prioriser les contacts commerciaux.
Critères de scoring (0-100) :
- Métier à fort volume de chantiers (plombier, électricien, maçon = +30pts)
- Présence d'un email pro (domaine propre = +20pts, gmail/orange = +10pts)
- Téléphone renseigné (+15pts)
- Ville avec forte densité artisanale (+15pts)
- Autres signaux positifs (+20pts max)

Retourne UNIQUEMENT un JSON : { "score": number, "reasoning": string, "recommendation": "contact"|"skip"|"priority" }`

export async function runQualifier(lead: Lead): Promise<AgentResult<QualificationResult>> {
  try {
    const message = await client.messages.create({
      model: config.model,
      max_tokens: 512,
      system: SYSTEM,
      messages: [{
        role: 'user',
        content: `Qualifie ce lead :
Nom : ${lead.name}
Métier : ${lead.trade}
Ville : ${lead.city ?? 'inconnue'}
Email : ${lead.email ?? 'non renseigné'}
Téléphone : ${lead.phone ?? 'non renseigné'}
Source : ${lead.source ?? 'inconnue'}`,
      }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : '{}'
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Pas de JSON dans la réponse')

    const result: QualificationResult = JSON.parse(jsonMatch[0])

    if (lead.id) {
      const newStatus = result.recommendation === 'skip' ? 'lost' : 'qualified'
      await portalClient.updateLead(lead.id, {
        score: result.score,
        status: newStatus,
        notes: result.reasoning,
      })
    }

    return {
      success: true,
      data: result,
      agentName: 'Qualificateur',
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    return {
      success: false,
      error: String(error),
      agentName: 'Qualificateur',
      timestamp: new Date().toISOString(),
    }
  }
}
