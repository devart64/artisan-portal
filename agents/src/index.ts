import { runCampaign, runReport } from './orchestrator.js'
import { runProspector } from './agents/prospector.js'
import { runQualifier } from './agents/qualifier.js'
import { portalClient } from './portalClient.js'

const command = process.argv[2] ?? 'help'

switch (command) {
  case 'prospect': {
    const trade = process.argv[3] ?? 'plombier'
    const city  = process.argv[4] ?? 'Paris'
    const count = Number(process.argv[5] ?? 5)
    const result = await runProspector({ trade, city, count })
    console.log(JSON.stringify(result, null, 2))
    break
  }

  case 'qualify': {
    const leads = await portalClient.getLeads('new')
    for (const lead of leads) {
      const result = await runQualifier(lead)
      console.log(`${lead.name}: ${result.data?.score}/100 — ${result.data?.recommendation}`)
    }
    break
  }

  case 'campaign': {
    const trade = process.argv[3] ?? 'plombier'
    const city  = process.argv[4] ?? 'Lyon'
    const count = Number(process.argv[5] ?? 5)
    await runCampaign({ trade, city, count })
    break
  }

  case 'report': {
    await runReport()
    break
  }

  case 'scheduler': {
    await import('./scheduler.js')
    // Le scheduler tourne indéfiniment via cron
    break
  }

  default:
    console.log(`
Artisan Portal — Équipe Agents IA Marketing

Commandes disponibles :
  pnpm prospect [métier] [ville] [nb]    Trouver des leads
  pnpm qualify                           Qualifier les leads "new"
  pnpm campaign [métier] [ville] [nb]    Pipeline complet
  pnpm report                            Rapport du pipeline
  pnpm scheduler                         Démarrer le scheduler automatique (24/7)

Exemples :
  pnpm prospect plombier Paris 10
  pnpm campaign électricien Lyon 5
  pnpm report
  pnpm scheduler
`)
}
