import Anthropic from '@anthropic-ai/sdk'
import { config } from '../config.js'
import { portalClient } from '../portalClient.js'
import type { Lead, ProspectQuery, AgentResult } from '../types.js'

const client = new Anthropic({ apiKey: config.anthropicApiKey })

const SYSTEM = `Tu es l'agent Prospecteur d'Artisan Portal.
Ton rôle : générer une liste réaliste de prospects artisans français pour une campagne d'acquisition.
Tu génères des données fictives mais réalistes (noms, emails, téléphones français, métiers d'artisanat).
Retourne UNIQUEMENT un JSON valide : tableau d'objets avec les champs name, email, phone, trade, city, source.
Ne retourne rien d'autre que le JSON brut.`

export async function runProspector(query: ProspectQuery): Promise<AgentResult<Lead[]>> {
  const count = query.count ?? 5

  try {
    const message = await client.messages.create({
      model: config.model,
      max_tokens: 2048,
      system: SYSTEM,
      messages: [{
        role: 'user',
        content: `Génère ${count} prospects artisans de type "${query.trade}" dans la ville "${query.city}".
Champs obligatoires : name (Prénom Nom), email (pro réaliste), phone (format +336...), trade, city.
Source : "prospection_automatique".`,
      }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('Pas de JSON trouvé dans la réponse')

    const leads: Lead[] = JSON.parse(jsonMatch[0])

    // Persist to Portal API
    const created: Lead[] = []
    for (const lead of leads) {
      const saved = await portalClient.createLead({ ...lead, status: 'new' })
      created.push(saved)
    }

    return {
      success: true,
      data: created,
      agentName: 'Prospecteur',
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    return {
      success: false,
      error: String(error),
      agentName: 'Prospecteur',
      timestamp: new Date().toISOString(),
    }
  }
}
