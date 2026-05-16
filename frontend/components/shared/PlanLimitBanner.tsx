import Link from 'next/link'
import { AlertTriangle, Zap } from 'lucide-react'

interface PlanLimitBannerProps {
  remaining: number // 0 = bloqué, 1-2 = warning
}

export default function PlanLimitBanner({ remaining }: PlanLimitBannerProps) {
  if (remaining > 2) return null

  if (remaining === 0) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
        <div className="flex-1">
          <p className="font-medium text-red-800">Limite atteinte — 5 chantiers sur 5</p>
          <p className="mt-0.5 text-red-700">
            Le plan Débutant est limité à 5 chantiers actifs.{' '}
            <Link href="/settings/billing" className="font-semibold underline hover:no-underline">
              Passer au plan Professionnel →
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm">
      <Zap className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
      <div className="flex-1">
        <p className="font-medium text-orange-800">
          {remaining} chantier{remaining > 1 ? 's' : ''} restant{remaining > 1 ? 's' : ''} sur votre plan
        </p>
        <p className="mt-0.5 text-orange-700">
          Plan Débutant : 5 chantiers maximum.{' '}
          <Link href="/settings/billing" className="font-semibold underline hover:no-underline">
            Passer au plan Professionnel
          </Link>{' '}
          pour des chantiers illimités.
        </p>
      </div>
    </div>
  )
}
