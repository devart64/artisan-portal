'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Trash2, Share2, CheckCircle2, Circle, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { apiFetch } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { Jalon } from '@/lib/types'

interface PlanningPageProps {
  params: { id: string }
}

export default function PlanningPage({ params }: PlanningPageProps) {
  const { id } = params
  const [jalons, setJalons] = useState<Jalon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDate, setNewDate] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [magicLink, setMagicLink] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<Jalon[]>(`/api/chantiers/${id}/jalons`)
      .then(setJalons)
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setIsLoading(false))
  }, [id])

  const toggleJalon = async (jalon: Jalon) => {
    try {
      await apiFetch(`/api/chantiers/${id}/jalons/${jalon.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ done: !jalon.done }),
      })
      setJalons((prev) =>
        prev.map((j) => (j.id === jalon.id ? { ...j, done: !j.done } : j)),
      )
    } catch {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const addJalon = async () => {
    if (!newTitle.trim()) return
    setIsSaving(true)
    try {
      const jalon = await apiFetch<Jalon>(`/api/chantiers/${id}/jalons`, {
        method: 'POST',
        body: JSON.stringify({ title: newTitle.trim(), date: newDate || undefined }),
      })
      setJalons((prev) => [...prev, jalon])
      setNewTitle('')
      setNewDate('')
      setShowDialog(false)
      toast.success('Étape ajoutée')
    } catch {
      toast.error("Erreur lors de l'ajout")
    } finally {
      setIsSaving(false)
    }
  }

  const deleteJalon = async (jalonId: string) => {
    try {
      await apiFetch(`/api/chantiers/${id}/jalons/${jalonId}`, {
        method: 'DELETE',
      })
      setJalons((prev) => prev.filter((j) => j.id !== jalonId))
      toast.success('Étape supprimée')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const sendPortal = async () => {
    try {
      const { url } = await apiFetch<{ url: string }>('/api/auth/magic-link', {
        method: 'POST',
        body: JSON.stringify({ chantierId: id }),
      })
      setMagicLink(url)
      await navigator.clipboard.writeText(url)
      toast.success('Lien copié dans le presse-papiers !')
    } catch {
      toast.error('Erreur lors de la génération du lien')
    }
  }

  const done = jalons.filter((j) => j.done).length
  const total = jalons.length
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/chantiers/${id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </Link>
          <h2 className="text-xl font-semibold text-gray-900">Planning</h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowDialog(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une étape
          </Button>
          <Button onClick={sendPortal} variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" />
            Envoyer au client
          </Button>
        </div>
      </div>

      {/* Magic Link */}
      {magicLink && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="mb-2 text-sm font-medium text-green-800">Lien portail client :</p>
          <code className="break-all text-xs text-green-700">{magicLink}</code>
        </div>
      )}

      {/* Progress */}
      {total > 0 && (
        <div className="rounded-lg bg-white border p-4">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium text-gray-700">Avancement global</span>
            <span className="font-bold text-primary">{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {done} / {total} étapes complétées
          </p>
        </div>
      )}

      {/* Jalons */}
      {jalons.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <CalendarDays className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-gray-500">Aucune étape définie</p>
          <Button onClick={() => setShowDialog(true)} className="mt-4" size="sm">
            Ajouter une étape
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {jalons.map((jalon) => (
            <div
              key={jalon.id}
              className="flex items-center gap-3 rounded-lg border bg-white p-4"
            >
              <button
                onClick={() => toggleJalon(jalon)}
                className="shrink-0 text-gray-400 hover:text-primary transition-colors"
                aria-label={jalon.done ? 'Marquer comme non fait' : 'Marquer comme fait'}
              >
                {jalon.done ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : (
                  <Circle className="h-6 w-6" />
                )}
              </button>

              <div className="flex-1">
                <p
                  className={`font-medium ${jalon.done ? 'text-gray-400 line-through' : 'text-gray-900'}`}
                >
                  {jalon.title}
                </p>
                {jalon.date && (
                  <p className="mt-0.5 text-sm text-gray-400">{formatDate(jalon.date)}</p>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8 text-gray-400 hover:text-destructive"
                onClick={() => deleteJalon(jalon.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une étape</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="jalon-title">Titre *</Label>
              <Input
                id="jalon-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex: Pose du carrelage"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jalon-date">Date (optionnel)</Label>
              <Input
                id="jalon-date"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Annuler
            </Button>
            <Button onClick={addJalon} disabled={isSaving || !newTitle.trim()}>
              {isSaving ? 'Ajout...' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
