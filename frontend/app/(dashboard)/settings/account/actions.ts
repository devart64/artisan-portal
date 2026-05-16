'use server'

import { apiFetch } from '@/lib/api'

export async function exportAccountData() {
  try {
    const data = await apiFetch<unknown>('/api/account/export')
    return { data, error: null }
  } catch (e: any) {
    return { data: null, error: e.message || 'Erreur export.' }
  }
}

export async function deleteAccount() {
  try {
    await apiFetch('/api/account', {
      method: 'DELETE',
      body: JSON.stringify({ confirm: 'SUPPRIMER' }),
    })
    return { error: null }
  } catch (e: any) {
    return { error: e.message || 'Erreur suppression.' }
  }
}
