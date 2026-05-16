'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { exportAccountData, deleteAccount } from './actions'

export function AccountClient() {
  const [confirm, setConfirm]         = useState('')
  const [exportError, setExportError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [isPending, startTransition]  = useTransition()

  function handleExport() {
    startTransition(async () => {
      const res = await exportAccountData()
      if (res.error) { setExportError(res.error); return }
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `artisan-portal-export-${new Date().toISOString().slice(0,10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  function handleDelete(e: React.FormEvent) {
    e.preventDefault()
    if (confirm !== 'SUPPRIMER') { setDeleteError('Tapez exactement SUPPRIMER.'); return }
    startTransition(async () => {
      const res = await deleteAccount()
      if (res.error) { setDeleteError(res.error); return }
      window.location.href = '/'
    })
  }

  return (
    <div className="space-y-8">
      <div className="border rounded-lg p-6 bg-card">
        <h2 className="font-semibold mb-1">Exporter mes données</h2>
        <p className="text-muted-foreground text-sm mb-4">Téléchargez toutes vos données au format JSON (RGPD).</p>
        {exportError && <p className="text-destructive text-sm mb-3">{exportError}</p>}
        <Button onClick={handleExport} disabled={isPending} variant="outline">
          {isPending ? 'Export en cours…' : 'Télécharger mes données'}
        </Button>
      </div>

      <div className="border border-destructive/30 rounded-lg p-6 bg-destructive/5">
        <h2 className="font-semibold text-destructive mb-1">Supprimer mon compte</h2>
        <p className="text-muted-foreground text-sm mb-4">
          Cette action est <strong>irréversible</strong>. Toutes vos données (chantiers, clients, documents) seront supprimées définitivement.
        </p>
        <form onSubmit={handleDelete} className="space-y-3">
          <Input
            placeholder="Tapez SUPPRIMER pour confirmer"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
          />
          {deleteError && <p className="text-destructive text-sm">{deleteError}</p>}
          <Button type="submit" variant="destructive" disabled={isPending || confirm !== 'SUPPRIMER'}>
            {isPending ? 'Suppression…' : 'Supprimer définitivement mon compte'}
          </Button>
        </form>
      </div>
    </div>
  )
}
