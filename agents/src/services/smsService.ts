import twilio from 'twilio'
import { config } from '../config.js'

let _client: ReturnType<typeof twilio> | null = null

function getClient() {
  if (!_client) {
    if (!config.twilioAccountSid || !config.twilioAuthToken) {
      throw new Error('Twilio credentials manquants dans .env')
    }
    _client = twilio(config.twilioAccountSid, config.twilioAuthToken)
  }
  return _client
}

export async function sendSms(to: string, body: string): Promise<string> {
  // Format E.164 requis par Twilio
  const formattedTo = to.startsWith('+') ? to : `+33${to.replace(/^0/, '')}`
  const msg = await getClient().messages.create({
    body: body.slice(0, 160),
    from: config.twilioPhoneNumber,
    to: formattedTo,
  })
  return msg.sid
}
