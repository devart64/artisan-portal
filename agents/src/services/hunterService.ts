import axios from 'axios'
import { config } from '../config.js'

interface HunterResult {
  data: {
    email: string
    score: number
    first_name?: string
    last_name?: string
  }
}

export async function enrichEmail(
  firstName: string,
  lastName: string,
  domain: string,
): Promise<string | null> {
  if (!config.hunterApiKey) return null

  try {
    const { data } = await axios.get<HunterResult>(
      'https://api.hunter.io/v2/email-finder',
      {
        params: {
          domain,
          first_name: firstName,
          last_name: lastName,
          api_key: config.hunterApiKey,
        },
        timeout: 8_000,
      },
    )
    return data.data.score >= 50 ? data.data.email : null
  } catch {
    return null
  }
}
