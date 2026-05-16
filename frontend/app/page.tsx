import Link from 'next/link'
import { ArrowRight, CheckCircle2, FileText, Image, MessageSquare, Calendar, Zap, Shield, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  {
    icon: FileText,
    title: 'Documents centralisés',
    description: 'Devis, factures, plans — tout au même endroit. Vos clients téléchargent en un clic.',
  },
  {
    icon: Image,
    title: 'Galerie photos',
    description: "Partagez l'avancement de vos chantiers avec des photos datées et légendées.",
  },
  {
    icon: Calendar,
    title: 'Planning jalons',
    description: 'Visualisez les étapes clés du chantier. Vos clients savent où vous en êtes.',
  },
  {
    icon: MessageSquare,
    title: 'Messagerie intégrée',
    description: 'Échangez directement avec vos clients sans passer par des SMS ou emails éparpillés.',
  },
  {
    icon: Zap,
    title: 'Magic link — sans compte',
    description: 'Vos clients accèdent à leur portail via un lien email. Aucune inscription requise.',
  },
  {
    icon: Shield,
    title: 'Multi-tenant sécurisé',
    description: 'Chaque artisan a son espace isolé. Vos données ne sont jamais mélangées.',
  },
]

const plans = [
  {
    name: 'Starter',
    price: '29',
    description: 'Pour démarrer',
    features: ['5 chantiers actifs', 'Documents & photos', 'Portail client magic link', 'Notifications email'],
    cta: 'Commencer gratuitement',
    featured: false,
  },
  {
    name: 'Pro',
    price: '59',
    description: 'Le plus populaire',
    features: ['Chantiers illimités', 'Planning & jalons', 'SMS notifications', 'Messagerie artisan/client', 'Branding personnalisé'],
    cta: 'Essayer Pro',
    featured: true,
  },
  {
    name: 'Business',
    price: '99',
    description: 'Pour les équipes',
    features: ['Multi-collaborateurs', 'Analytics avancés', 'API publique', 'Support prioritaire'],
    cta: 'Contacter les ventes',
    featured: false,
  },
]

const stats = [
  { value: '400k', label: 'artisans en France' },
  { value: '< 30%', label: 'équipés en logiciel' },
  { value: '2–3h', label: 'perdues/semaine en appels' },
  { value: '30j', label: 'pour voir le ROI' },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <span className="text-xl font-bold">
            Artisan<span className="text-blue-600">Portal</span>
          </span>
          <nav className="hidden items-center gap-8 text-sm font-medium text-gray-600 md:flex">
            <a href="#features" className="hover:text-gray-900 transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Tarifs</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild size="sm">
              <Link href="/login">Connexion</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">
                Essai gratuit
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white py-24 text-center">
          <div className="mx-auto max-w-4xl px-6">
            <Badge className="mb-6 bg-blue-100 text-blue-700 hover:bg-blue-100">
              🛠 SaaS · Artisans · B2B
            </Badge>
            <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
              Fini les appels de suivi.{' '}
              <span className="text-blue-600">Vos clients se servent eux-mêmes.</span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-xl text-gray-600">
              Artisan Portal est un portail client dédié pour artisans. Partagez documents,
              photos et planning avec vos clients via un simple lien. Sans compte, sans friction.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild className="px-8">
                <Link href="/register">
                  Démarrer gratuitement — 30 jours
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <p className="text-sm text-gray-500">Aucune carte bancaire requise</p>
            </div>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-20 grid max-w-3xl grid-cols-2 gap-8 px-6 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-extrabold text-blue-600">{stat.value}</div>
                <div className="mt-1 text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-16 text-center">
              <h2 className="text-4xl font-extrabold text-gray-900">Tout ce dont vous avez besoin</h2>
              <p className="mt-4 text-lg text-gray-600">
                Un portail professionnel pour chaque chantier. Pas un ERP de plus.
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="border-0 bg-gray-50">
                  <CardHeader>
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-blue-600 py-24 text-white">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="mb-4 text-4xl font-extrabold">Comment ça marche ?</h2>
            <p className="mb-16 text-xl text-blue-200">Opérationnel en moins de 15 minutes.</p>
            <div className="grid gap-12 sm:grid-cols-3">
              {[
                { step: '1', title: 'Créez un chantier', desc: 'Ajoutez le titre, le client, et les dates. 2 minutes.' },
                { step: '2', title: 'Uploadez vos fichiers', desc: 'Glissez-déposez documents et photos. Tout est stocké en sécurité.' },
                { step: '3', title: 'Envoyez le portail', desc: "Un lien unique par email. Votre client accède sans créer de compte." },
              ].map((item) => (
                <div key={item.step}>
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl font-extrabold text-blue-600">
                    {item.step}
                  </div>
                  <h3 className="mb-2 text-xl font-bold">{item.title}</h3>
                  <p className="text-blue-200">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-16 text-center">
              <h2 className="text-4xl font-extrabold text-gray-900">Tarifs simples et transparents</h2>
              <p className="mt-4 text-lg text-gray-600">30 jours gratuits sur tous les plans. Pas de frais cachés.</p>
            </div>
            <div className="grid gap-8 sm:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative rounded-2xl border-2 p-8 ${
                    plan.featured
                      ? 'border-blue-600 bg-blue-50 shadow-xl'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {plan.featured && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white px-4 py-1">Recommandé</Badge>
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-500">{plan.description}</p>
                    <div className="mt-4">
                      <span className="text-4xl font-extrabold text-gray-900">{plan.price}€</span>
                      <span className="text-gray-500">/mois</span>
                    </div>
                  </div>
                  <ul className="mb-8 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm text-gray-700">
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className="w-full"
                    variant={plan.featured ? 'default' : 'outline'}
                  >
                    <Link href="/register">{plan.cta}</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="bg-gray-900 py-20 text-center text-white">
          <div className="mx-auto max-w-2xl px-6">
            <Smartphone className="mx-auto mb-6 h-12 w-12 text-blue-400" />
            <h2 className="mb-4 text-4xl font-extrabold">Prêt à gagner 2h par semaine ?</h2>
            <p className="mb-8 text-xl text-gray-400">
              Rejoignez les artisans qui ont arrêté de répondre aux mêmes questions.
            </p>
            <Button size="lg" asChild className="px-10">
              <Link href="/register">
                Créer mon compte gratuitement
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-10 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} Artisan Portal — Tous droits réservés</p>
      </footer>
    </div>
  )
}
