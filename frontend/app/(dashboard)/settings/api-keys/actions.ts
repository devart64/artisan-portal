'use server'

import { apiFetch } from '@/lib/api'

export async function createApiKey(name: string) {
  try {
    const data = await apiFetch<{ id: string; key: string; name: string }>('/api/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
    return { id: data.id, key: data.key, error: null }
  } catch (e: any) {
    return { id: null, key: null, error: e.message || 'Erreur.' }
  }
}

export async function deleteApiKey(id: string) {
  try {
    await apiFetch(`/api/api-keys/${id}`, { method: 'DELETE' })
    return { error: null }
  } catch (e: any) {
    return { error: e.message }
  }
}
