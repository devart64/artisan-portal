import 'dotenv/config'

export const config = {
  // IA
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
  model: 'claude-opus-4-7' as const,

  // Portal API (Symfony backend)
  portalApiUrl: process.env.PORTAL_API_URL ?? 'http://localhost:8000',
  portalApiToken: process.env.PORTAL_API_TOKEN ?? '',

  // Email — Resend
  resendApiKey: process.env.RESEND_API_KEY ?? '',
  emailFrom: process.env.EMAIL_FROM ?? 'Artisan Portal <contact@artisan-portal.fr>',

  // SMS — Twilio
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? '',
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER ?? '',

  // Enrichissement email (optionnel)
  hunterApiKey: process.env.HUNTER_API_KEY ?? '',
}

if (!config.anthropicApiKey) {
  throw new Error('ANTHROPIC_API_KEY manquant dans .env')
}
