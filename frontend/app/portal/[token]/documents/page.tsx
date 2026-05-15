import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PortalDocuments } from '@/components/portal/PortalDocuments'
import { portalFetch } from '@/lib/portal'
import type { Document } from '@/lib/types'

interface PortalDocumentsPageProps {
  params: Promise<{ token: string }>
}

export default async function PortalDocumentsPage({ params }: PortalDocumentsPageProps) {
  const { token } = await params
  const documents = await portalFetch<Document[]>(token, '/documents')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/portal/${token}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </Link>
        <h2 className="text-xl font-semibold text-gray-900">Documents</h2>
      </div>
      <PortalDocuments documents={documents} token={token} />
    </div>
  )
}
