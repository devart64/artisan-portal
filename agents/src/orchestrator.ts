import chalk from 'chalk'
import { scrapeLeads } from './services/scraper.js'
import { sendEmail } from './services/emailService.js'
import { sendSms } from './services/smsService.js'
import { runQualifier } from './agents/qualifier.js'
import { runCopywriter } from './agents/copywriter.js'
import { portalClient } from './portalClient.js'
import type { ProspectQuery, Lead } from './types.js'

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

  // 1. Scraping leads réels via Sirene API
  log('Prospecteur', 'Scraping API Sirene (entreprises.data.gouv.fr)...')
  let rawLeads: Omit<Lead, 'id' | 'status' | 'createdAt'>[]
  try {
    rawLeads = await scrapeLeads(query.trade, query.city, query.count ?? 5)
    log('Prospecteur', `${rawLeads.length} entreprises trouvées`)
  } catch (err) {
    log('Orchestrateur', chalk.red(`Erreur scraping: ${err}`))
    return
  }

  // 2. Persister en DB + qualifier
  const qualified: Lead[] = []
  for (const raw of rawLeads) {
    const saved = await portalClient.createLead({ ...raw, status: 'new' })
    const qResult = await runQualifier(saved)
    if (qResult.success && qResult.data?.recommendation !== 'skip') {
      qualified.push(saved)
      log('Qualificateur', `✓ ${saved.name} — score ${qResult.data?.score}/100`)
    } else {
      log('Qualificateur', `✗ ${saved.name} → ignoré (score trop bas)`)
    }
  }
  log('Orchestrateur', `${qualified.length}/${rawLeads.length} leads qualifiés`)

  // 3. Copywriting + envoi réel
  let sent = 0
  for (const lead of qualified) {
    const content = await runCopywriter(lead)
    if (!content.success || !content.data) continue

    const { subject, emailBody, smsText, followUpDelay } = content.data
    let emailSent = false
    let smsSent = false

    // Envoi email
    if (lead.email) {
      try {
        const emailId = await sendEmail({ to: lead.email, subject, html: emailBody, leadId: lead.id })
        emailSent = true
        log('Copywriter', `📧 Email envoyé à ${lead.email} (id: ${emailId})`)
      } catch (err) {
        log('Copywriter', chalk.yellow(`⚠ Email échoué pour ${lead.email}: ${err}`))
      }
    } else {
      log('Copywriter', chalk.gray(`  ${lead.name} — pas d'email, envoi ignoré`))
    }

    // Envoi SMS
    if (lead.phone && smsText) {
      try {
        const sid = await sendSms(lead.phone, smsText)
        smsSent = true
        log('Copywriter', `📱 SMS envoyé à ${lead.phone} (sid: ${sid})`)
      } catch (err) {
        log('Copywriter', chalk.yellow(`⚠ SMS échoué pour ${lead.phone}: ${err}`))
      }
    }

    if (emailSent || smsSent) {
      sent++
      await portalClient.updateLead(lead.id!, {
        status: 'contacted',
        lastContactedAt: new Date().toISOString(),
        notes: `${emailSent ? '📧' : ''}${smsSent ? '📱' : ''} "${subject}" | Relance J+${followUpDelay}`,
      })
    }
  }

  log('Orchestrateur', chalk.green(`✅ Campagne terminée — ${sent}/${qualified.length} messages envoyés`))
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
  const rate = total > 0 ? ((converted / total) * 100).toFixed(1) : '0'
  console.log(chalk.bold(`\n  Taux conversion : ${rate}% (${converted}/${total})`))
  console.log('─'.repeat(34) + '\n')
}
