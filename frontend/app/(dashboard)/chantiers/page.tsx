import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChantierCard } from '@/components/chantier/ChantierCard'
import { apiFetch } from '@/lib/api'
import type { Chantier, ChantierStatus } from '@/lib/types'
import PlanLimitBanner from '@/components/shared/PlanLimitBanner'

const statusFilters: { value: ChantierStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'en_attente', label: 'En attente' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'termine', label: 'Terminés' },
  { value: 'annule', label: 'Annulés' },
]

async function getChantiers(status?: string) {
  try {
    const url = status && status !== 'all' ? `/api/chantiers?status=${status}` : '/api/chantiers'
    return await apiFetch<Chantier[]>(url)
  } catch {
    return []
  }
}

interface ChantiersPageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function ChantiersPage({ searchParams }: ChantiersPageProps) {
  const params = await searchParams
  const activeFilter = params.status ?? 'all'
  const [chantiers, billing] = await Promise.all([
    getChantiers(activeFilter),
    apiFetch<{ remainingChantiers: number | null }>('/api/billing').catch(() => null),
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chantiers</h1>
          <p className="mt-1 text-sm text-gray-500">
            {chantiers.length} chantier{chantiers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button asChild>
          <Link href="/chantiers/new">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau chantier
          </Link>
        </Button>
      </div>

      {/* Plan limit banner */}
      {billing?.remainingChantiers !== null && billing?.remainingChantiers !== undefined && (
        <PlanLimitBanner remaining={billing.remainingChantiers} />
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((filter) => (
          <Link
            key={filter.value}
            href={filter.value === 'all' ? '/chantiers' : `/chantiers?status=${filter.value}`}
          >
            <span
              className={`inline-flex rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeFilter === filter.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white border text-gray-600 hover:bg-gray-50'
              }`}
            >
              {filter.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Grid */}
      {chantiers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <p className="text-gray-500">Aucun chantier trouvé</p>
          <Button asChild className="mt-4" size="sm">
            <Link href="/chantiers/new">Créer un chantier</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {chantiers.map((chantier) => (
            <ChantierCard key={chantier.id} chantier={chantier} />
          ))}
        </div>
      )}
    </div>
  )
}
