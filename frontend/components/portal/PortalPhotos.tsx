import Image from 'next/image'
import { Camera } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Photo } from '@/lib/types'

interface PortalPhotosProps {
  photos: Photo[]
}

export function PortalPhotos({ photos }: PortalPhotosProps) {
  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <Camera className="mb-3 h-10 w-10 text-gray-300" />
        <p className="text-gray-500">Aucune photo disponible</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
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
              sizes="(max-width: 640px) 50vw, 33vw"
            />
          </div>
          {(photo.caption || photo.uploadedAt) && (
            <div className="px-3 py-2">
              {photo.caption && (
                <p className="truncate text-sm text-gray-700">{photo.caption}</p>
              )}
              <p className="text-xs text-gray-400">{formatDate(photo.uploadedAt)}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
