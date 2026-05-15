import { CheckCircle2, Circle, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Jalon } from '@/lib/types'

interface PortalPlanningProps {
  jalons: Jalon[]
}

export function PortalPlanning({ jalons }: PortalPlanningProps) {
  if (jalons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <Calendar className="mb-3 h-10 w-10 text-gray-300" />
        <p className="text-gray-500">Aucune étape définie</p>
      </div>
    )
  }

  const done = jalons.filter((j) => j.done).length
  const total = jalons.length
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="rounded-lg bg-gray-50 p-4">
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-medium text-gray-700">Avancement</span>
          <span className="font-bold text-primary">{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          {done} / {total} étapes complétées
        </p>
      </div>

      {/* Jalons list */}
      <div className="relative space-y-0">
        {jalons.map((jalon, index) => (
          <div key={jalon.id} className="flex gap-4">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  jalon.done
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {jalon.done ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </div>
              {index < jalons.length - 1 && (
                <div className="w-0.5 flex-1 bg-gray-200" style={{ minHeight: 24 }} />
              )}
            </div>

            {/* Content */}
            <div className="pb-6">
              <p
                className={`font-medium ${
                  jalon.done ? 'text-gray-500 line-through' : 'text-gray-900'
                }`}
              >
                {jalon.title}
              </p>
              {jalon.date && (
                <p className="mt-0.5 text-sm text-gray-400">
                  {formatDate(jalon.date)}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
