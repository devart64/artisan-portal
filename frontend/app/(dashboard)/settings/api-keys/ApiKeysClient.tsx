'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createApiKey, deleteApiKey } from './actions'
import { Copy, Trash2, Key } from 'lucide-react'

interface ApiKey {
  id: string
  name: string
  prefix: string
  lastUsedAt?: string
  createdAt: string
}

export function ApiKeysClient({ keys: initial }: { keys: ApiKey[] }) {
  const [keys, setKeys]           = useState(initial)
  const [name, setName]           = useState('')
  const [newKey, setNewKey]       = useState<string | null>(null)
  const [error, setError]         = useState('')
  const [isPending, startTransition] = useTransition()

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setNewKey(null)
    startTransition(async () => {
      const res = await createApiKey(name)
      if (res.error) { setError(res.error); return }
      setNewKey(res.key!)
      setKeys(prev => [...prev, { id: res.id!, name, prefix: res.key!.slice(0, 8), createdAt: new Date().toISOString() }])
      setName('')
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Révoquer cette clé ?')) return
    startTransition(async () => {
      await deleteApiKey(id)
      setKeys(prev => prev.filter(k => k.id !== id))
    })
  }

  return (
    <div className="space-y-6">
      {newKey && (
        <div className="border border-green-200 bg-green-50 rounded-lg p-4">
          <p className="text-green-800 font-medium text-sm mb-2">Clé créée — copiez-la maintenant, elle ne sera plus affichée !</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white border rounded px-3 py-2 text-sm font-mono break-all">{newKey}</code>
            <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(newKey)}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="border rounded-lg p-6 bg-card">
        <h2 className="font-semibold mb-4">Créer une clé</h2>
        <form onSubmit={handleCreate} className="flex gap-3">
          <Input
            placeholder="Nom de la clé (ex: Production)"
            value={name}
            onChange={e => setName(e.target.value)}
            className="flex-1"
            required
          />
          <Button type="submit" disabled={isPending}>Créer</Button>
        </form>
        {error && <p className="text-destructive text-sm mt-2">{error}</p>}
      </div>

      <div className="border rounded-lg overflow-hidden">
        {keys.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <Key className="h-5 w-5" />
            <span className="text-sm">Aucune clé API</span>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Nom</th>
                <th className="text-left px-4 py-3 font-medium">Préfixe</th>
                <th className="text-left px-4 py-3 font-medium">Dernière utilisation</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {keys.map(k => (
                <tr key={k.id}>
                  <td className="px-4 py-3 font-medium">{k.name}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">{k.prefix}...</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString('fr-FR') : 'Jamais'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(k.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
