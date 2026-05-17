'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { z } from 'zod'
import { CreditCard, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { apiFetch } from '@/lib/api'
import type { Tenant } from '@/lib/types'

const settingsSchema = z.object({
  name: z.string().min(2, 'Le nom doit faire au moins 2 caractères'),
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Couleur invalide (ex: #2563eb)'),
})

export default function SettingsPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({ name: '', brandColor: '#2563eb' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    apiFetch<Tenant>('/api/settings')
      .then((t) => {
        setTenant(t)
        setFormData({ name: t.name, brandColor: t.brandColor })
      })
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setIsLoading(false))
  }, [])

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const parsed = settingsSchema.safeParse(formData)
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
      await apiFetch('/api/settings', {
        method: 'PATCH',
        body: JSON.stringify(parsed.data),
      })
      toast.success('Paramètres mis à jour')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('logo', file)

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/settings/logo`, {
        method: 'POST',
        body: formData,
      })
      toast.success('Logo mis à jour')
    } catch {
      toast.error('Erreur lors du téléversement du logo')
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
    <div className="max-w-2xl space-y-6">
      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle>Identité visuelle</CardTitle>
          <CardDescription>
            Personnalisez l'apparence de votre portail client
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo */}
            <div className="space-y-3">
              <Label>Logo de l'entreprise</Label>
              <div className="flex items-center gap-4">
                {tenant?.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={tenant.logoUrl}
                    alt="Logo"
                    className="h-16 w-16 rounded-lg object-contain border"
                  />
                ) : (
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-2xl font-bold text-gray-300"
                    style={{ color: formData.brandColor }}
                  >
                    {formData.name.charAt(0)?.toUpperCase() ?? 'A'}
                  </div>
                )}
                <label
                  htmlFor="logo-upload"
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Téléverser un logo
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleLogoUpload}
                  />
                </label>
              </div>
            </div>

            <Separator />

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="company-name">Nom de l'entreprise</Label>
              <Input
                id="company-name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ex: Plomberie Dupont"
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Brand color */}
            <div className="space-y-2">
              <Label htmlFor="brand-color">Couleur de marque</Label>
              <div className="flex items-center gap-3">
                <input
                  id="brand-color"
                  type="color"
                  value={formData.brandColor}
                  onChange={(e) => handleChange('brandColor', e.target.value)}
                  className="h-10 w-16 cursor-pointer rounded-md border border-input p-1"
                />
                <Input
                  value={formData.brandColor}
                  onChange={(e) => handleChange('brandColor', e.target.value)}
                  className="w-32 font-mono"
                  placeholder="#2563eb"
                />
                <div
                  className="h-10 w-10 rounded-md border"
                  style={{ backgroundColor: formData.brandColor }}
                />
              </div>
              {errors.brandColor && (
                <p className="text-xs text-destructive">{errors.brandColor}</p>
              )}
            </div>

            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Enregistrement...' : 'Sauvegarder'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Billing link */}
      <Card>
        <CardHeader>
          <CardTitle>Abonnement</CardTitle>
          <CardDescription>Gérez votre plan et vos paiements</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href="/settings/billing">
              <CreditCard className="mr-2 h-4 w-4" />
              Gérer mon abonnement
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
