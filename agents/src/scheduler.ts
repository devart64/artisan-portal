import cron from 'node-cron'
import chalk from 'chalk'
import { runCampaign, runReport } from './orchestrator.js'

const CAMPAIGNS = [
  { trade: 'plombier',    city: 'Paris',     count: 10 },
  { trade: 'electricien', city: 'Lyon',      count: 10 },
  { trade: 'peintre',     city: 'Marseille', count: 10 },
  { trade: 'maçon',       city: 'Bordeaux',  count: 10 },
  { trade: 'menuisier',   city: 'Toulouse',  count: 10 },
]

console.log(chalk.cyan('[Scheduler] Démarrage — Artisan Portal Marketing Agents'))
console.log(chalk.gray('  Lun-Ven 09:00 → campagnes prospection'))
console.log(chalk.gray('  Lun-Ven 14:00 → relances'))
console.log(chalk.gray('  Lun     08:00 → rapport hebdomadaire\n'))

// Rapport hebdomadaire — lundi 8h
cron.schedule('0 8 * * 1', async () => {
  console.log(chalk.cyan('\n[Scheduler] Rapport hebdomadaire'))
  await runReport()
})

// Campagnes prospection — lundi au vendredi 9h
cron.schedule('0 9 * * 1-5', async () => {
  const today = new Date().getDay() // 1=lundi ... 5=vendredi
  const campaign = CAMPAIGNS[(today - 1) % CAMPAIGNS.length]
  console.log(chalk.cyan(`\n[Scheduler] Campagne matinale — ${campaign.trade} @ ${campaign.city}`))
  await runCampaign(campaign)
})

// Relances leads contactés — lundi au vendredi 14h
cron.schedule('0 14 * * 1-5', async () => {
  console.log(chalk.cyan('\n[Scheduler] Vérification relances...'))
  // TODO: implémenter runFollowUp() pour les leads contactés sans réponse depuis N jours
  console.log(chalk.gray('  (relances automatiques — à implémenter selon réponses reçues)'))
})
