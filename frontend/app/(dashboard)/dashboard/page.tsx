import Link from 'next/link'
import { HardHat, FileText, ArrowRight, Plus, Briefcase, Users, FileCheck, TrendingUp } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChantierStatusBadge } from '@/components/chantier/ChantierStatusBadge'
import { apiFetch } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { Chantier, Document } from '@/lib/types'

interface Stats {
  chantiers: number
  chantiersByStatus: Record<string, number>
  clients: number
  documents: number
  documentsSigned: number
  leads: number
}

async function getDashboardData() {
  try {
    const [chantiers, documents, stats] = await Promise.all([
      apiFetch<Chantier[]>('/api/chantiers?status=en_cours'),
      apiFetch<Document[]>('/api/documents?recent=true'),
      apiFetch<Stats>('/api/stats'),
    ])
    return { chantiers, documents, stats, error: null }
  } catch {
    return { chantiers: [], documents: [], stats: null, error: 'Erreur de chargement' }
  }
}

export default async function DashboardPage() {
  const { chantiers, documents, stats } = await getDashboardData()

  const recentChantiers = chantiers.slice(0, 5)
  const recentDocuments = documents.slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Chantiers actifs
            </CardTitle>
            <Briefcase className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.chantiers ?? chantiers.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">En cours actuellement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clients
            </CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.clients ?? '—'}</div>
            <p className="mt-1 text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Documents signés
            </CardTitle>
            <FileCheck className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.documentsSigned ?? '—'}</div>
            <p className="mt-1 text-xs text-muted-foreground">Ce mois-ci</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Leads
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.leads ?? '—'}</div>
            <p className="mt-1 text-xs text-muted-foreground">En attente</p>
          </CardContent>
        </Card>
      </div>

      {stats && Object.keys(stats.chantiersByStatus).length > 0 && (
        <div className="border rounded-lg p-6 bg-card">
          <h2 className="font-semibold mb-4">Chantiers par statut</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.chantiersByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                <span className="capitalize text-sm">{status.replace('_', ' ')}</span>
                <span className="font-bold">{count as number}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Chantiers */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Chantiers récents</h2>
          <div className="flex gap-2">
            <Button asChild size="sm">
              <Link href="/chantiers/new">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/chantiers">
                Voir tout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {recentChantiers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <HardHat className="mb-3 h-10 w-10 text-gray-300" />
              <p className="text-gray-500">Aucun chantier pour le moment</p>
              <Button asChild className="mt-4" size="sm">
                <Link href="/chantiers/new">Créer un chantier</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border bg-white divide-y">
            {recentChantiers.map((chantier) => (
              <Link
                key={chantier.id}
                href={`/chantiers/${chantier.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ChantierStatusBadge status={chantier.status} />
                  <div>
                    <p className="font-medium text-gray-900">{chantier.title}</p>
                    {chantier.client && (
                      <p className="text-sm text-gray-500">{chantier.client.name}</p>
                    )}
                  </div>
                </div>
                <div className="text-right text-sm text-gray-400">
                  {formatDate(chantier.createdAt)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Documents */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Documents récents</h2>
        </div>

        {recentDocuments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="mb-3 h-10 w-10 text-gray-300" />
              <p className="text-gray-500">Aucun document récent</p>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border bg-white divide-y">
            {recentDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{doc.label}</p>
                    <p className="text-sm capitalize text-gray-500">{doc.type}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400">{formatDate(doc.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
