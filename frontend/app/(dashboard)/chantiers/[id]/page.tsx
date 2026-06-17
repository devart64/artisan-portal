import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, Calendar, User, FileText, Camera, CalendarDays, MessageSquare } from 'lucide-react'
import { ChantierStatusBadge } from '@/components/chantier/ChantierStatusBadge'
import { DevisIaButton } from './DevisIaButton'
import { apiFetch } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { Chantier } from '@/lib/types'

interface ChantierDetailPageProps {
  params: Promise<{ id: string }>
}

async function getChantier(id: string): Promise<Chantier | null> {
  try {
    return await apiFetch<Chantier>(`/api/chantiers/${id}`)
  } catch {
    return null
  }
}

const tabs = [
  { href: 'documents', label: 'Documents', icon: FileText },
  { href: 'photos', label: 'Photos', icon: Camera },
  { href: 'planning', label: 'Planning', icon: CalendarDays },
  { href: 'messages', label: 'Messages', icon: MessageSquare },
]

export default async function ChantierDetailPage({ params }: ChantierDetailPageProps) {
  const { id } = await params
  const chantier = await getChantier(id)

  if (!chantier) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{chantier.title}</h1>
              <ChantierStatusBadge status={chantier.status} />
            </div>
            {chantier.description && (
              <p className="mt-2 text-gray-600">{chantier.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <DevisIaButton chantierId={chantier.id} />
          </div>
        </div>

        {/* Details */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {chantier.client && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4 shrink-0 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{chantier.client.name}</p>
                {chantier.client.email && (
                  <p className="text-xs text-gray-400">{chantier.client.email}</p>
                )}
              </div>
            </div>
          )}
          {chantier.address && (
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <span>{chantier.address}</span>
            </div>
          )}
          {(chantier.startDate || chantier.endDate) && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
              <span>
                {formatDate(chantier.startDate)}
                {chantier.endDate ? ` → ${formatDate(chantier.endDate)}` : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-lg border bg-white">
        <nav className="flex overflow-x-auto border-b">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <Link
                key={tab.href}
                href={`/chantiers/${id}/${tab.href}`}
                className="flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-4 py-4 text-sm font-medium text-gray-600 transition-colors hover:border-primary hover:text-primary sm:px-6"
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400">
            <p className="text-sm">Sélectionnez un onglet pour accéder au contenu</p>
          </div>
        </div>
      </div>
    </div>
  )
}
