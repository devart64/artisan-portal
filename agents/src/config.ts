import 'dotenv/config'

export const config = {
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
  portalApiUrl: process.env.PORTAL_API_URL ?? 'http://localhost:8000',
  portalApiToken: process.env.PORTAL_API_TOKEN ?? '',
  model: 'claude-opus-4-7' as const,
}

if (!config.anthropicApiKey) {
  throw new Error('ANTHROPIC_API_KEY manquant dans .env')
}
