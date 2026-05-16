import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CreditCard, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiFetch } from '@/lib/api'
import type { Tenant, Plan, PlanStatus } from '@/lib/types'
import PlanButton from './PlanButton'

const planDetails: Record<Plan, { name: string; price: string; features: string[] }> = {
  starter: {
    name: 'Starter',
    price: '29 € / mois',
    features: [
      '5 chantiers actifs',
      '1 portail client inclus',
      'Documents PDF',
      'Support par e-mail',
    ],
  },
  pro: {
    name: 'Pro',
    price: '79 € / mois',
    features: [
      'Chantiers illimités',
      'Portails clients illimités',
      'Photos et galeries',
      'Planning avec jalons',
      'Support prioritaire',
    ],
  },
  business: {
    name: 'Business',
    price: '199 € / mois',
    features: [
      'Tout le plan Pro',
      'Équipe multi-utilisateurs',
      'API access',
      'Personnalisation avancée',
      'Support dédié',
    ],
  },
}

const statusConfig: Record<PlanStatus, { label: string; icon: typeof CheckCircle; className: string }> = {
  trialing: { label: 'Essai gratuit', icon: Clock, className: 'text-blue-600' },
  active: { label: 'Actif', icon: CheckCircle, className: 'text-green-600' },
  past_due: { label: 'Paiement en retard', icon: AlertCircle, className: 'text-orange-600' },
  canceled: { label: 'Annulé', icon: AlertCircle, className: 'text-red-600' },
}

async function getBillingData() {
  try {
    const tenant = await apiFetch<Tenant & { nextBillingDate?: string; stripePortalUrl?: string; trialEndsAt?: string }>(
      '/api/billing',
    )
    return { tenant, error: null }
  } catch {
    return { tenant: null, error: 'Erreur de chargement' }
  }
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>
}) {
  const params = await searchParams
  const { tenant, error } = await getBillingData()

  if (error || !tenant) {
    return (
      <div className="max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/settings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Paramètres
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Impossible de charger les informations de facturation.
          </CardContent>
        </Card>
      </div>
    )
  }

  const plan = planDetails[tenant.plan]
  const status = statusConfig[tenant.planStatus]
  const StatusIcon = status.icon

  return (
    <div className="max-w-2xl space-y-6">
      {params.success === '1' && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800">
          ✅ Votre abonnement a bien été mis à jour. Merci !
        </div>
      )}
      {params.canceled === '1' && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
          Le paiement a été annulé. Votre abonnement reste inchangé.
        </div>
      )}

      {tenant.trialEndsAt && tenant.planStatus === 'trialing' && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 mb-6">
          <p className="text-orange-800 font-medium text-sm">
            Période d'essai — expire le {new Date(tenant.trialEndsAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <p className="text-orange-700 text-xs mt-1">
            Souscrivez un abonnement pour continuer à utiliser Artisan Portal après cette date.
          </p>
        </div>
      )}

      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Paramètres
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Abonnement</h1>
      </div>

      {/* Current plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Plan actuel</CardTitle>
            <div className={`flex items-center gap-1.5 text-sm font-medium ${status.className}`}>
              <StatusIcon className="h-4 w-4" />
              {status.label}
            </div>
          </div>
          <CardDescription>{plan.price}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{plan.name}</p>
              <p className="text-sm text-gray-500">{plan.price}</p>
            </div>
          </div>

          <ul className="space-y-2">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                {feature}
              </li>
            ))}
          </ul>

          {'nextBillingDate' in tenant && tenant.nextBillingDate && (
            <p className="text-sm text-gray-500">
              Prochain renouvellement :{' '}
              <span className="font-medium text-gray-700">
                {new Intl.DateTimeFormat('fr-FR').format(
                  new Date(tenant.nextBillingDate as string),
                )}
              </span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Gérer l'abonnement</CardTitle>
          <CardDescription>
            Accédez au portail Stripe pour modifier votre abonnement, mettre à
            jour votre moyen de paiement ou télécharger vos factures.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {'stripePortalUrl' in tenant && tenant.stripePortalUrl ? (
            <a
              href={tenant.stripePortalUrl as string}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button>
                <CreditCard className="mr-2 h-4 w-4" />
                Ouvrir le portail de facturation
              </Button>
            </a>
          ) : (
            <Button disabled variant="outline">
              Portail Stripe non disponible
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Other plans */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Changer de plan</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {(Object.entries(planDetails) as [Plan, typeof planDetails.starter][]).map(
            ([key, details]) => (
              <Card
                key={key}
                className={key === tenant.plan ? 'border-primary ring-1 ring-primary' : ''}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{details.name}</CardTitle>
                    {key === tenant.plan && (
                      <Badge className="text-xs">Actuel</Badge>
                    )}
                  </div>
                  <CardDescription className="font-semibold text-gray-900">
                    {details.price}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PlanButton plan={key} currentPlan={tenant.plan} />
                </CardContent>
              </Card>
            ),
          )}
        </div>
      </div>
    </div>
  )
}
