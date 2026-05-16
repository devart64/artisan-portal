'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle, ArrowRight, Users, HardHat, CreditCard, UserPlus } from 'lucide-react'

interface ChecklistStep {
  key: string
  label: string
  done: boolean
}

interface ChecklistData {
  steps: ChecklistStep[]
  completed: number
  total: number
  percent: number
  done: boolean
}

const STEP_ICONS: Record<string, React.ReactNode> = {
  profile:  <Users className="h-5 w-5 text-blue-500" />,
  client:   <Users className="h-5 w-5 text-purple-500" />,
  chantier: <HardHat className="h-5 w-5 text-orange-500" />,
  billing:  <CreditCard className="h-5 w-5 text-green-500" />,
  team:     <UserPlus className="h-5 w-5 text-pink-500" />,
}

const STEP_LINKS: Record<string, string> = {
  client:   '/clients/new',
  chantier: '/chantiers/new',
  billing:  '/settings/billing',
  team:     '/settings/team',
}

export function OnboardingModal({ data }: { data: ChecklistData }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Afficher seulement si pas encore complété et pas déjà fermé dans cette session
    if (!data.done && !sessionStorage.getItem('onboarding_dismissed')) {
      setOpen(true)
    }
  }, [data.done])

  function dismiss() {
    sessionStorage.setItem('onboarding_dismissed', '1')
    setOpen(false)
  }

  function goToStep(key: string) {
    const link = STEP_LINKS[key]
    if (link) {
      dismiss()
      router.push(link)
    }
  }

  const nextStep = data.steps.find(s => !s.done)

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bienvenue sur Artisan Portal ! 👋</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{data.completed}/{data.total} étapes complétées</span>
            <span className="font-semibold text-primary">{data.percent}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${data.percent}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          {data.steps.map(step => (
            <div
              key={step.key}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                step.done
                  ? 'bg-green-50 border-green-100'
                  : 'bg-card hover:bg-muted/50 cursor-pointer'
              }`}
              onClick={() => !step.done && goToStep(step.key)}
            >
              {step.done
                ? <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                : <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              }
              <span className={`flex-1 text-sm ${step.done ? 'line-through text-muted-foreground' : 'font-medium'}`}>
                {step.label}
              </span>
              {!step.done && STEP_LINKS[step.key] && (
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          {nextStep && STEP_LINKS[nextStep.key] && (
            <Button className="flex-1" onClick={() => goToStep(nextStep.key)}>
              Commencer : {nextStep.label}
            </Button>
          )}
          <Button variant="outline" onClick={dismiss} className={nextStep ? '' : 'flex-1'}>
            {data.done ? 'Fermer' : 'Plus tard'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
