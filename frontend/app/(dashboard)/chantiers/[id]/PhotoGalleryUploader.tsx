'use client'
import { toast } from 'sonner'
import { DropZone } from '@/components/shared/DropZone'
import { uploadPhoto } from './actions'

interface PhotoGalleryUploaderProps {
  chantierId: string
}

export function PhotoGalleryUploader({ chantierId }: PhotoGalleryUploaderProps) {
  const handleUpload = async (files: File[]) => {
    // Upload each photo individually (the backend takes one "file" per request),
    // going through an authenticated server action so the JWT is attached.
    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)
      await uploadPhoto(chantierId, formData)
    }
    toast.success(
      files.length > 1 ? 'Photos ajoutées avec succès' : 'Photo ajoutée avec succès',
    )
  }

  return (
    <DropZone
      onUpload={handleUpload}
      multiple
      label="Prenez une photo ou sélectionnez-en depuis votre téléphone"
      accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
    />
  )
}
