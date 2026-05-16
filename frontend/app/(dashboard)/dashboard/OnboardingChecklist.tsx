'use client'

import Link from 'next/link'
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

interface ChecklistStep {
  key: string
  label: string
  done: boolean
}

const STEP_LINKS: Record<string, string> = {
  client:   '/clients/new',
  chantier: '/chantiers/new',
  billing:  '/settings/billing',
  team:     '/settings/team',
}

export function OnboardingChecklist({ steps, percent }: { steps: ChecklistStep[]; percent: number }) {
  const [expanded, setExpanded] = useState(false)
  const remaining = steps.filter(s => !s.done)

  if (remaining.length === 0) return null

  return (
    <div className="border rounded-lg bg-blue-50/50 border-blue-100 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="h-2 w-24 bg-blue-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${percent}%` }} />
          </div>
          <span className="text-sm font-medium text-blue-800">
            Premiers pas — {steps.filter(s => s.done).length}/{steps.length} complétés
          </span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-blue-600" /> : <ChevronDown className="h-4 w-4 text-blue-600" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {steps.map(step => (
            <div key={step.key} className="flex items-center gap-2">
              {step.done
                ? <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                : <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              }
              {!step.done && STEP_LINKS[step.key] ? (
                <Link href={STEP_LINKS[step.key]} className="text-sm text-blue-700 hover:underline">
                  {step.label}
                </Link>
              ) : (
                <span className={`text-sm ${step.done ? 'line-through text-muted-foreground' : ''}`}>
                  {step.label}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
