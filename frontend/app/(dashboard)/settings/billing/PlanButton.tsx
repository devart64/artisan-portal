'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { startCheckout } from './actions'

interface PlanButtonProps {
  plan: string
  currentPlan: string
}

export default function PlanButton({ plan, currentPlan }: PlanButtonProps) {
  const [isPending, startTransition] = useTransition()

  if (plan === currentPlan) return null

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full"
      disabled={isPending}
      onClick={() => startTransition(() => startCheckout(plan))}
    >
      {isPending ? 'Redirection...' : 'Choisir ce plan'}
    </Button>
  )
}
