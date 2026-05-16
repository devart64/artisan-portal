'use server'

import { apiFetch } from '@/lib/api'

export async function get2FAStatus() {
  try {
    const data = await apiFetch<{ enabled: boolean }>('/api/auth/2fa/status')
    return { enabled: data.enabled }
  } catch {
    return { enabled: false }
  }
}

export async function setup2FA() {
  try {
    const data = await apiFetch<{ secret: string; otpauthUrl: string }>('/api/auth/2fa/setup', {
      method: 'POST',
    })
    return { secret: data.secret, otpauthUrl: data.otpauthUrl, error: null }
  } catch (e: any) {
    return { secret: null, otpauthUrl: null, error: e.message || 'Erreur.' }
  }
}

export async function enable2FA(code: string) {
  try {
    await apiFetch('/api/auth/2fa/enable', {
      method: 'POST',
      body: JSON.stringify({ code }),
    })
    return { error: null }
  } catch (e: any) {
    return { error: e.message || 'Code incorrect.' }
  }
}

export async function disable2FA(code: string) {
  try {
    await apiFetch('/api/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ code }),
    })
    return { error: null }
  } catch (e: any) {
    return { error: e.message || 'Erreur.' }
  }
}
