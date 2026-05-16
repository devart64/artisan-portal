'use server'

import { redirect } from 'next/navigation'
import { apiFetch } from '@/lib/api'

export async function startCheckout(plan: string): Promise<void> {
  const { url } = await apiFetch<{ url: string }>('/api/stripe/checkout', {
    method: 'POST',
    body: JSON.stringify({ plan }),
  })
  redirect(url)
}
