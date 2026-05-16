'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { inviteCollaborator, removeCollaborator } from './actions'

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'admin' | 'collaborator'
  createdAt: string
  pending: boolean
}

export function TeamClient({ members: initial }: { members: TeamMember[] }) {
  const [members, setMembers]   = useState(initial)
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [isPending, startTransition] = useTransition()

  function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    startTransition(async () => {
      const res = await inviteCollaborator({ name, email })
      if (res.error) {
        setError(res.error)
      } else {
        setSuccess(`Invitation envoyée à ${email}`)
        setName('')
        setEmail('')
      }
    })
  }

  function handleRemove(id: string) {
    if (!confirm('Retirer ce collaborateur ?')) return
    startTransition(async () => {
      const res = await removeCollaborator(id)
      if (res.error) {
        setError(res.error)
      } else {
        setMembers(prev => prev.filter(m => m.id !== id))
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-6 bg-card">
        <h2 className="font-semibold mb-4">Inviter un collaborateur</h2>
        <form onSubmit={handleInvite} className="flex gap-3 flex-wrap">
          <Input
            placeholder="Prénom Nom"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-48"
          />
          <Input
            type="email"
            placeholder="email@exemple.fr"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="flex-1 min-w-48"
            required
          />
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Envoi…' : 'Inviter'}
          </Button>
        </form>
        {error   && <p className="text-destructive text-sm mt-2">{error}</p>}
        {success && <p className="text-green-600 text-sm mt-2">{success}</p>}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Membre</th>
              <th className="text-left px-4 py-3 font-medium">Rôle</th>
              <th className="text-left px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {members.map(m => (
              <tr key={m.id}>
                <td className="px-4 py-3">
                  <div className="font-medium">{m.name || '—'}</div>
                  <div className="text-muted-foreground">{m.email}</div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={m.role === 'admin' ? 'default' : 'secondary'}>
                    {m.role === 'admin' ? 'Admin' : 'Collaborateur'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {m.pending
                    ? <span className="text-orange-500 text-xs font-medium">Invitation en attente</span>
                    : <span className="text-green-600 text-xs font-medium">Actif</span>
                  }
                </td>
                <td className="px-4 py-3 text-right">
                  {m.role !== 'admin' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleRemove(m.id)}
                      disabled={isPending}
                    >
                      Retirer
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
