import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PortalMessages } from '@/components/portal/PortalMessages'
import { portalFetch } from '@/lib/portal'
import type { Message } from '@/lib/types'

interface PortalMessagesPageProps {
  params: Promise<{ token: string }>
}

export default async function PortalMessagesPage({ params }: PortalMessagesPageProps) {
  const { token } = await params
  const messages = await portalFetch<Message[]>(token, '/messages')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Link href={`/portal/${token}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </Link>
        <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
      </div>
      <PortalMessages messages={messages} token={token} />
    </div>
  )
}
