import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PortalPhotos } from '@/components/portal/PortalPhotos'
import { portalFetch } from '@/lib/portal'
import type { Photo } from '@/lib/types'

interface PortalPhotosPageProps {
  params: Promise<{ token: string }>
}

export default async function PortalPhotosPage({ params }: PortalPhotosPageProps) {
  const { token } = await params
  const photos = await portalFetch<Photo[]>(token, '/photos')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/portal/${token}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </Link>
        <h2 className="text-xl font-semibold text-gray-900">Photos</h2>
      </div>
      <PortalPhotos photos={photos} />
    </div>
  )
}
