import { Resend } from 'resend'
import { config } from '../config.js'

const resend = new Resend(config.resendApiKey)

export interface EmailPayload {
  to: string
  subject: string
  html: string
  leadId?: string
}

function buildHtml(body: string, leadId: string | undefined, portalUrl: string): string {
  const unsubUrl = leadId ? `${portalUrl}/api/webhooks/lead/unsubscribe/${leadId}` : '#'
  const interestedUrl = leadId ? `${portalUrl}/api/webhooks/lead/interested/${leadId}` : '#'

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1e293b">
  ${body.replace(/\n/g, '<br>')}
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center">
    <a href="${interestedUrl}" style="display:inline-block;background:#f97316;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-right:8px">
      Je suis intéressé →
    </a>
  </div>
  <p style="margin-top:24px;font-size:12px;color:#94a3b8;text-align:center">
    Artisan Portal — <a href="${unsubUrl}" style="color:#94a3b8">Se désinscrire</a>
  </p>
</body>
</html>`
}

export async function sendEmail(payload: EmailPayload): Promise<string> {
  const html = buildHtml(payload.html, payload.leadId, config.portalApiUrl)

  const result = await resend.emails.send({
    from: config.emailFrom,
    to: payload.to,
    subject: payload.subject,
    html,
    tags: payload.leadId ? [{ name: 'lead_id', value: payload.leadId }] : undefined,
  })

  if (result.error) throw new Error(`Resend error: ${result.error.message}`)
  return result.data!.id
}
