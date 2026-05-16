import { ApiKeysClient } from './ApiKeysClient'
import { apiFetch } from '@/lib/api'

interface ApiKey {
  id: string
  name: string
  prefix: string
  lastUsedAt?: string
  createdAt: string
}

export default async function ApiKeysPage() {
  let keys: ApiKey[] = []
  let planError = false

  try {
    keys = await apiFetch<ApiKey[]>('/api/api-keys')
  } catch (e: any) {
    if (e.status === 402) planError = true
  }

  if (planError) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-4">Clés API</h1>
        <div className="border border-orange-200 bg-orange-50 rounded-lg p-6">
          <p className="text-orange-800 font-medium">Fonctionnalité réservée au plan Entreprise</p>
          <p className="text-orange-700 text-sm mt-1">Passez au plan Entreprise pour accéder aux clés API.</p>
          <a href="/settings/billing" className="inline-block mt-4 text-sm text-blue-600 hover:underline">
            Mettre à niveau →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Clés API</h1>
          <p className="text-muted-foreground text-sm mt-1">Accès programmatique à votre espace (plan Entreprise)</p>
        </div>
      </div>
      <ApiKeysClient keys={keys} />
    </div>
  )
}
