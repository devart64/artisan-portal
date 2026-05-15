import { Badge } from '@/components/ui/badge'
import type { ChantierStatus } from '@/lib/types'

const statusConfig: Record<
  ChantierStatus,
  { label: string; className: string }
> = {
  en_attente: {
    label: 'En attente',
    className: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100',
  },
  en_cours: {
    label: 'En cours',
    className: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100',
  },
  termine: {
    label: 'Terminé',
    className:
      'bg-green-100 text-green-700 border-green-200 hover:bg-green-100',
  },
  annule: {
    label: 'Annulé',
    className: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100',
  },
}

interface ChantierStatusBadgeProps {
  status: ChantierStatus
  className?: string
}

export function ChantierStatusBadge({
  status,
  className,
}: ChantierStatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <Badge variant="outline" className={`${config.className} ${className ?? ''}`}>
      {config.label}
    </Badge>
  )
}
