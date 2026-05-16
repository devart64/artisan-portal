import Link from 'next/link'
import { ChantierForm } from '@/components/chantier/ChantierForm'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import type { Client } from '@/lib/types'

async function getClients(): Promise<Client[]> {
  try {
    return await apiFetch<Client[]>('/api/clients')
  } catch {
    return []
  }
}

export default async function NewChantierPage() {
  const [clients, billing] = await Promise.all([
    getClients(),
    apiFetch<{ remainingChantiers: number | null }>('/api/billing').catch(() => null),
  ])

  if (billing?.remainingChantiers === 0) {
    return (
      <div className="max-w-lg space-y-4">
        <h1 className="text-2xl font-bold">Nouveau chantier</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center space-y-3">
          <p className="text-red-800 font-medium">Limite de 5 chantiers atteinte</p>
          <p className="text-red-700 text-sm">Passez au plan Professionnel pour créer des chantiers illimités.</p>
          <Link href="/settings/billing">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              Upgrader mon plan →
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nouveau chantier</h1>
        <p className="mt-1 text-sm text-gray-500">
          Remplissez les informations pour créer un nouveau chantier
        </p>
      </div>
      <ChantierForm clients={clients} />
    </div>
  )
}
