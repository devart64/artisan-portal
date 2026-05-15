import Link from 'next/link'
import {
  MapPin,
  Calendar,
  User,
  FileText,
  Camera,
  CalendarDays,
  MessageSquare,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChantierStatusBadge } from '@/components/chantier/ChantierStatusBadge'
import { portalFetch } from '@/lib/portal'
import { formatDate } from '@/lib/utils'
import type { PortalData } from '@/lib/types'

interface PortalPageProps {
  params: Promise<{ token: string }>
}

const sections = [
  { href: 'documents', label: 'Documents', icon: FileText, description: 'Devis, factures et plans' },
  { href: 'photos', label: 'Photos', icon: Camera, description: 'Galerie du chantier' },
  { href: 'planning', label: 'Planning', icon: CalendarDays, description: 'Étapes du projet' },
  { href: 'messages', label: 'Messages', icon: MessageSquare, description: 'Communication' },
]

export default async function PortalPage({ params }: PortalPageProps) {
  const { token } = await params
  const data = await portalFetch<PortalData>(token, '')
  const { chantier, jalonsProgress } = data

  return (
    <div className="space-y-6">
      {/* Chantier header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-xl">{chantier.title}</CardTitle>
            <ChantierStatusBadge status={chantier.status} />
          </div>
          {chantier.description && (
            <p className="text-sm text-gray-600">{chantier.description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Details */}
          <div className="grid gap-3 sm:grid-cols-2">
            {chantier.client && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 shrink-0 text-gray-400" />
                <span className="text-gray-600">{chantier.client.name}</span>
              </div>
            )}
            {chantier.address && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <span className="text-gray-600">{chantier.address}</span>
              </div>
            )}
            {(chantier.startDate || chantier.endDate) && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
                <span className="text-gray-600">
                  {formatDate(chantier.startDate)}
                  {chantier.endDate ? ` → ${formatDate(chantier.endDate)}` : ''}
                </span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium text-gray-700">Avancement du projet</span>
              <span className="font-bold" style={{ color: 'var(--brand)' }}>
                {jalonsProgress}%
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${jalonsProgress}%`,
                  backgroundColor: 'var(--brand)',
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation sections */}
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <Link
              key={section.href}
              href={`/portal/${token}/${section.href}`}
              className="group block"
            >
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: 'color-mix(in srgb, var(--brand) 15%, transparent)' }}
                    >
                      <Icon
                        className="h-5 w-5"
                        style={{ color: 'var(--brand)' }}
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{section.label}</p>
                      <p className="text-sm text-gray-500">{section.description}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-1" />
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
