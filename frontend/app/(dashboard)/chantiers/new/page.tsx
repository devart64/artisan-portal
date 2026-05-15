import { ChantierForm } from '@/components/chantier/ChantierForm'
import { apiFetch } from '@/lib/api'
import type { Client } from '@/lib/types'

async function getClients(): Promise<Client[]> {
  try {
    return await apiFetch<Client[]>('/api/clients')
  } catch {
    return []
  }
}

export default async function NewChantierPage() {
  const clients = await getClients()

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
