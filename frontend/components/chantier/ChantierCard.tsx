import Link from 'next/link'
import { MapPin, Calendar, User } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ChantierStatusBadge } from './ChantierStatusBadge'
import { formatDate } from '@/lib/utils'
import type { Chantier } from '@/lib/types'

interface ChantierCardProps {
  chantier: Chantier
}

export function ChantierCard({ chantier }: ChantierCardProps) {
  return (
    <Link href={`/chantiers/${chantier.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-snug">
              {chantier.title}
            </CardTitle>
            <ChantierStatusBadge status={chantier.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {chantier.client && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 shrink-0" />
              <span>{chantier.client.name}</span>
            </div>
          )}
          {chantier.address && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{chantier.address}</span>
            </div>
          )}
          {(chantier.startDate || chantier.endDate) && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>
                {formatDate(chantier.startDate)}
                {chantier.endDate ? ` → ${formatDate(chantier.endDate)}` : ''}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
