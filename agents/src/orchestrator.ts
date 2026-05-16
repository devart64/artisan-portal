import chalk from 'chalk'
import { runProspector } from './agents/prospector.js'
import { runQualifier } from './agents/qualifier.js'
import { runCopywriter } from './agents/copywriter.js'
import { portalClient } from './portalClient.js'
import type { ProspectQuery } from './types.js'

function log(agent: string, msg: string) {
  const colors: Record<string, (s: string) => string> = {
    Orchestrateur: chalk.cyan,
    Prospecteur: chalk.blue,
    Qualificateur: chalk.yellow,
    Copywriter: chalk.magenta,
    Closer: chalk.red,
    Onboarder: chalk.green,
  }
  const color = colors[agent] ?? chalk.white
  console.log(`${color(`[${agent}]`)} ${msg}`)
}

export async function runCampaign(query: ProspectQuery): Promise<void> {
  log('Orchestrateur', `Démarrage campagne — ${query.trade} @ ${query.city} (${query.count ?? 5} leads)`)

  // 1. Prospection
  log('Prospecteur', 'Recherche de prospects...')
  const prospectResult = await runProspector(query)
  if (!prospectResult.success || !prospectResult.data?.length) {
    log('Orchestrateur', chalk.red(`Échec prospection: ${prospectResult.error}`))
    return
  }
  log('Prospecteur', `${prospectResult.data.length} leads trouvés`)

  // 2. Qualification
  log('Qualificateur', 'Scoring des leads...')
  const qualified = []
  for (const lead of prospectResult.data) {
    const result = await runQualifier(lead)
    if (result.success && result.data?.recommendation !== 'skip') {
      qualified.push(lead)
      log('Qualificateur', `✓ ${lead.name} (${lead.trade}) → score ${result.data?.score}/100`)
    } else {
      log('Qualificateur', `✗ ${lead.name} → ignoré`)
    }
  }
  log('Orchestrateur', `${qualified.length}/${prospectResult.data.length} leads qualifiés`)

  // 3. Copywriting + simulation envoi
  log('Copywriter', 'Génération des messages personnalisés...')
  for (const lead of qualified) {
    const content = await runCopywriter(lead)
    if (content.success && content.data) {
      log('Copywriter', `✓ ${lead.name} — sujet: "${content.data.subject}"`)
      log('Copywriter', `  SMS: ${content.data.smsText?.slice(0, 60) ?? '—'}...`)

      if (lead.id) {
        await portalClient.updateLead(lead.id, {
          status: 'contacted',
          lastContactedAt: new Date().toISOString(),
          notes: `Email: ${content.data.subject} | Relance J+${content.data.followUpDelay}`,
        })
      }
    }
  }

  log('Orchestrateur', chalk.green(`✅ Campagne terminée — ${qualified.length} contacts envoyés`))
}

export async function runReport(): Promise<void> {
  log('Orchestrateur', 'Génération du rapport...')

  const allLeads = await portalClient.getLeads()
  const byStatus = allLeads.reduce<Record<string, number>>((acc, l) => {
    acc[l.status ?? 'unknown'] = (acc[l.status ?? 'unknown'] ?? 0) + 1
    return acc
  }, {})

  console.log('\n' + chalk.bold('─── Rapport Pipeline Marketing ───'))
  for (const [status, count] of Object.entries(byStatus)) {
    console.log(`  ${status.padEnd(12)} : ${count}`)
  }
  const converted = byStatus['converted'] ?? 0
  const total = allLeads.length
  console.log(chalk.bold(`\n  Taux conversion : ${total > 0 ? ((converted / total) * 100).toFixed(1) : 0}%`))
  console.log('─'.repeat(34) + '\n')
}
