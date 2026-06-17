'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DropZone } from '@/components/shared/DropZone'
import type { DocumentType } from '@/lib/types'

const uploadSchema = z.object({
  label: z.string().min(1, 'Le libellé est requis'),
  type: z.enum(['devis', 'facture', 'plan', 'autre']),
})

interface DocumentUploaderProps {
  chantierId: string
  /** Authenticated server action that uploads one document (field "file" + label/type). */
  action: (chantierId: string, formData: FormData) => Promise<void>
  onSuccess?: () => void
}

const typeLabels: Record<DocumentType, string> = {
  devis: 'Devis',
  facture: 'Facture',
  plan: 'Plan',
  autre: 'Autre',
}

export function DocumentUploader({ chantierId, action, onSuccess }: DocumentUploaderProps) {
  const [label, setLabel] = useState('')
  const [type, setType] = useState<DocumentType>('autre')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pendingFiles, setPendingFiles] = useState<File[]>([])

  const handleUpload = async (files: File[]) => {
    setPendingFiles(files)

    const parsed = uploadSchema.safeParse({ label, type })
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      parsed.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message
      })
      setErrors(fieldErrors)
      throw new Error('Veuillez remplir tous les champs requis')
    }

    // One document per request (backend takes a single "file"), via an
    // authenticated server action so the JWT is attached.
    for (const file of files) {
      const formData = new FormData()
      formData.append('label', label)
      formData.append('type', type)
      formData.append('file', file)
      await action(chantierId, formData)
    }

    toast.success('Document ajouté avec succès')
    setLabel('')
    setType('autre')
    setPendingFiles([])
    onSuccess?.()
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h3 className="font-medium text-gray-900">Ajouter un document</h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="doc-label">Libellé *</Label>
          <Input
            id="doc-label"
            value={label}
            onChange={(e) => {
              setLabel(e.target.value)
              setErrors((prev) => ({ ...prev, label: '' }))
            }}
            placeholder="Ex: Devis cuisine"
          />
          {errors.label && (
            <p className="text-xs text-destructive">{errors.label}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="doc-type">Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as DocumentType)}>
            <SelectTrigger id="doc-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(typeLabels) as DocumentType[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {typeLabels[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DropZone
        onUpload={handleUpload}
        multiple={false}
        label="Déposez votre document ici (PDF, images)"
        accept={{
          'application/pdf': ['.pdf'],
          'image/*': ['.jpg', '.jpeg', '.png'],
        }}
      />
    </div>
  )
}
