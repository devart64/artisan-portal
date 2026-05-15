import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { Photo } from '@/lib/types'
import { PhotoGalleryUploader } from './PhotoGalleryUploader'

interface PhotosPageProps {
  params: Promise<{ id: string }>
}

async function getPhotos(chantierId: string): Promise<Photo[]> {
  try {
    return await apiFetch<Photo[]>(`/api/chantiers/${chantierId}/photos`)
  } catch {
    return []
  }
}

export default async function PhotosPage({ params }: PhotosPageProps) {
  const { id } = await params
  const photos = await getPhotos(id)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/chantiers/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </Link>
        <h2 className="text-xl font-semibold text-gray-900">Photos</h2>
      </div>

      {/* Upload */}
      <PhotoGalleryUploader chantierId={id} />

      {/* Gallery */}
      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <Camera className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-gray-500">Aucune photo pour ce chantier</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group overflow-hidden rounded-lg border bg-white"
            >
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <Image
                  src={photo.signedUrl}
                  alt={photo.caption ?? 'Photo du chantier'}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              </div>
              {(photo.caption || photo.uploadedAt) && (
                <div className="px-3 py-2">
                  {photo.caption && (
                    <p className="truncate text-sm font-medium text-gray-700">
                      {photo.caption}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    {formatDate(photo.uploadedAt)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
