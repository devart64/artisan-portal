'use client'
import { toast } from 'sonner'
import { DropZone } from '@/components/shared/DropZone'

interface PhotoGalleryUploaderProps {
  chantierId: string
}

export function PhotoGalleryUploader({ chantierId }: PhotoGalleryUploaderProps) {
  const handleUpload = async (files: File[]) => {
    const formData = new FormData()
    files.forEach((file) => formData.append('photos', file))
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/chantiers/${chantierId}/photos`,
      { method: 'POST', body: formData },
    )
    if (!res.ok) throw new Error('Erreur lors du téléversement')
    toast.success('Photos ajoutées avec succès')
  }

  return (
    <DropZone
      onUpload={handleUpload}
      multiple
      label="Glissez vos photos ici"
      accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
    />
  )
}
