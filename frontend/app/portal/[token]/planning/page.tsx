import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PortalPlanning } from '@/components/portal/PortalPlanning'
import { portalFetch } from '@/lib/portal'
import type { Jalon } from '@/lib/types'

interface PortalPlanningPageProps {
  params: Promise<{ token: string }>
}

export default async function PortalPlanningPage({ params }: PortalPlanningPageProps) {
  const { token } = await params
  const jalons = await portalFetch<Jalon[]>(token, '/jalons')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/portal/${token}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </Link>
        <h2 className="text-xl font-semibold text-gray-900">Planning</h2>
      </div>
      <PortalPlanning jalons={jalons} />
    </div>
  )
}
