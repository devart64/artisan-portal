'use server'
import { revalidatePath } from 'next/cache'
import { apiFetch } from '@/lib/api'
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

export async function sendMagicLink(chantierId: string): Promise<{ url: string }> {
  return apiFetch<{ url: string }>('/api/auth/magic-link', {
    method: 'POST',
    body: JSON.stringify({ chantierId }),
  })
}

export async function uploadDocument(
  chantierId: string,
  formData: FormData,
): Promise<void> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/chantiers/${chantierId}/documents`,
    {
      method: 'POST',
      body: formData,
    },
  )
  if (!res.ok) throw new Error('Erreur lors du téléversement')
  revalidatePath(`/chantiers/${chantierId}/documents`)
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
