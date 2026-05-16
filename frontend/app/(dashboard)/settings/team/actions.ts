'use server'

import { apiFetch } from '@/lib/api'

export async function inviteCollaborator(data: { name: string; email: string }) {
  try {
    await apiFetch('/api/team/invite', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return { error: null }
  } catch (e: any) {
    return { error: e.message || 'Erreur lors de l\'invitation.' }
  }
}

export async function removeCollaborator(id: string) {
  try {
    await apiFetch(`/api/team/${id}`, { method: 'DELETE' })
    return { error: null }
  } catch (e: any) {
    return { error: e.message || 'Erreur lors de la suppression.' }
  }
}
