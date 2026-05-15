'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, Users, Phone, Mail, Trash2 } from 'lucide-react'
import { z } from 'zod'
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
import type { Client } from '@/lib/types'

const clientSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('E-mail invalide').or(z.literal('')).optional(),
  phone: z.string().optional(),
})

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    apiFetch<Client[]>('/api/clients')
      .then(setClients)
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setIsLoading(false))
  }, [])

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const handleCreate = async () => {
    const parsed = clientSchema.safeParse(formData)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      parsed.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message
      })
      setErrors(fieldErrors)
      return
    }

    setIsSaving(true)
    try {
      const client = await apiFetch<Client>('/api/clients', {
        method: 'POST',
        body: JSON.stringify(parsed.data),
      })
      setClients((prev) => [...prev, client])
      setFormData({ name: '', email: '', phone: '' })
      setShowDialog(false)
      toast.success('Client ajouté avec succès')
    } catch {
      toast.error("Erreur lors de l'ajout du client")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (clientId: string) => {
    try {
      await apiFetch(`/api/clients/${clientId}`, { method: 'DELETE' })
      setClients((prev) => prev.filter((c) => c.id !== clientId))
      toast.success('Client supprimé')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="mt-1 text-sm text-gray-500">
            {clients.length} client{clients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau client
        </Button>
      </div>

      {/* List */}
      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Users className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-gray-500">Aucun client pour le moment</p>
          <Button onClick={() => setShowDialog(true)} className="mt-4" size="sm">
            Ajouter un client
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border bg-white divide-y">
          {clients.map((client) => (
            <div
              key={client.id}
              className="flex items-center justify-between px-4 py-4"
            >
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{client.name}</p>
                <div className="mt-1 flex flex-wrap gap-4">
                  {client.email && (
                    <a
                      href={`mailto:${client.email}`}
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {client.email}
                    </a>
                  )}
                  {client.phone && (
                    <a
                      href={`tel:${client.phone}`}
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {client.phone}
                    </a>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-destructive"
                onClick={() => handleDelete(client.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="client-name">Nom *</Label>
              <Input
                id="client-name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ex: Marie Dubois"
                autoFocus
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-email">E-mail</Label>
              <Input
                id="client-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="client@example.com"
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-phone">Téléphone</Label>
              <Input
                id="client-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="06 12 34 56 78"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={isSaving}>
              {isSaving ? 'Ajout...' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
