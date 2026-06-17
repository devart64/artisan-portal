'use server'
import { revalidatePath } from 'next/cache'
import { apiFetch, apiUpload } from '@/lib/api'
import type { Jalon } from '@/lib/types'

export async function toggleJalon(
  chantierId: string,
  jalonId: string,
  done: boolean,
): Promise<void> {
  await apiFetch(`/api/chantiers/${chantierId}/jalons/${jalonId}`, {
    method: 'PATCH',
    body: JSON.stringify({ done }),
  })
  revalidatePath(`/chantiers/${chantierId}/planning`)
}

export async function createJalon(
  chantierId: string,
  data: { title: string; date?: string },
): Promise<Jalon> {
  const jalon = await apiFetch<Jalon>(`/api/chantiers/${chantierId}/jalons`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  revalidatePath(`/chantiers/${chantierId}/planning`)
  return jalon
}

export async function deleteJalon(
  chantierId: string,
  jalonId: string,
): Promise<void> {
  await apiFetch(`/api/chantiers/${chantierId}/jalons/${jalonId}`, {
    method: 'DELETE',
  })
  revalidatePath(`/chantiers/${chantierId}/planning`)
}

export async function sendMagicLink(chantierId: string, clientId: string): Promise<void> {
  await apiFetch('/api/auth/magic-link', {
    method: 'POST',
    body: JSON.stringify({ chantierId, clientId }),
  })
}

export async function uploadDocument(
  chantierId: string,
  formData: FormData,
): Promise<void> {
  await apiUpload(`/api/chantiers/${chantierId}/documents`, formData)
  revalidatePath(`/chantiers/${chantierId}/documents`)
}

export async function uploadPhoto(
  chantierId: string,
  formData: FormData,
): Promise<void> {
  // The backend photo endpoint accepts one file (field "file") per request.
  await apiUpload(`/api/chantiers/${chantierId}/photos`, formData)
  revalidatePath(`/chantiers/${chantierId}/photos`)
}

export async function sendMessage(
  chantierId: string,
  content: string,
): Promise<void> {
  await apiFetch(`/api/chantiers/${chantierId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
  revalidatePath(`/chantiers/${chantierId}/messages`)
}
