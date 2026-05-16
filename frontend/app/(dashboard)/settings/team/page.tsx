import { apiFetch } from '@/lib/api'
import { TeamClient } from './TeamClient'

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'admin' | 'collaborator'
  createdAt: string
  pending: boolean
}

export default async function TeamPage() {
  const members = await apiFetch<TeamMember[]>('/api/team')

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Équipe</h1>
          <p className="text-muted-foreground text-sm mt-1">Gérez les collaborateurs de votre espace</p>
        </div>
      </div>
      <TeamClient members={members} />
    </div>
  )
}
