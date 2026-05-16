import Link from 'next/link'
import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react'

const painPoints = [
  {
    emoji: '📞',
    title: '"C\'est pour quand ?"',
    desc: 'Vos clients appellent pour savoir où en est leur chantier. Plusieurs fois par semaine. À n\'importe quelle heure.',
    highlight: '2 à 3h perdues / semaine',
  },
  {
    emoji: '📁',
    title: '"Vous pouvez me renvoyer le devis ?"',
    desc: 'Les documents se perdent dans les emails. Vos clients vous redemandent les mêmes fichiers en boucle.',
    highlight: 'Agacement des deux côtés',
  },
  {
    emoji: '😤',
    title: '"On ne sait jamais ce qui se passe"',
    desc: 'Sans visibilité, vos clients stressent, imaginent le pire, et appellent encore plus. Ce manque de confiance vous coûte des avis négatifs.',
    highlight: 'Réputation en jeu',
  },
]

const outcomes = [
  {
    icon: '📄',
    title: 'Tous les documents au même endroit',
    desc: 'Devis, factures, plans — votre client les retrouve en un clic, à n\'importe quelle heure.',
    result: 'Fini les emails perdus',
  },
  {
    icon: '📸',
    title: 'L\'avancement en photos',
    desc: 'Publiez vos photos de chantier. Votre client voit le travail évoluer et comprend la valeur de votre travail.',
    result: 'Moins de litiges sur la qualité',
  },
  {
    icon: '📅',
    title: 'Le planning visible par tous',
    desc: 'Affichez les grandes étapes du chantier. Votre client sait quand vous intervenez, quand c\'est terminé.',
    result: '60% moins d\'appels de relance',
  },
  {
    icon: '💬',
    title: 'Une messagerie centralisée',
    desc: 'Toutes les conversations liées au chantier en un seul endroit. Fini les SMS et emails éparpillés.',
    result: 'Zéro perte d\'information',
  },
  {
    icon: '🔗',
    title: 'Accès sans mot de passe pour votre client',
    desc: 'Un simple lien dans leur email, et ils sont sur leur portail. Aucune friction, aucun frein.',
    result: '100% des clients utilisent le portail',
  },
  {
    icon: '🎨',
    title: 'À vos couleurs, avec votre logo',
    desc: 'Le portail affiche votre logo et vos couleurs. Votre image professionnelle est renforcée.',
    result: 'Image professionnelle différenciante',
  },
]

const plans = [
  {
    name: 'Débutant',
    desc: 'Pour tester sans risque',
    price: '29',
    features: [
      { text: "Jusqu'à 5 chantiers", ok: true },
      { text: 'Documents et photos', ok: true },
      { text: 'Portail client (lien magique)', ok: true },
      { text: 'Alertes email automatiques', ok: true },
      { text: 'Planning et jalons', ok: false },
      { text: 'SMS client', ok: false },
    ],
    cta: 'Commencer gratuitement',
    featured: false,
  },
  {
    name: 'Professionnel',
    desc: 'Pour les artisans actifs',
    price: '59',
    features: [
      { text: 'Chantiers illimités', ok: true },
      { text: 'Documents, photos, planning', ok: true },
      { text: 'Portail à vos couleurs', ok: true },
      { text: 'SMS automatiques au client', ok: true },
      { text: 'Messagerie intégrée', ok: true },
      { text: 'Conseiller IA prioritaire', ok: true },
    ],
    cta: 'Je choisis Pro →',
    featured: true,
    badge: '⭐ Le plus choisi',
  },
  {
    name: 'Entreprise',
    desc: 'Pour les équipes',
    price: '99',
    features: [
      { text: 'Tout le plan Pro', ok: true },
      { text: 'Plusieurs collaborateurs', ok: true },
      { text: 'Statistiques avancées', ok: true },
      { text: 'Support téléphonique', ok: true },
      { text: 'Accès API', ok: true },
      { text: 'Conseiller IA dédié', ok: true },
    ],
    cta: 'Nous contacter',
    featured: false,
  },
]

const testimonials = [
  {
    stars: 5,
    text: '"Mes clients adorent. Je reçois 3 fois moins d\'appels depuis que j\'envoie le lien au démarrage de chaque chantier. Je me concentre enfin sur mon travail."',
    name: 'Jean-David R.',
    job: 'Électricien — Lyon',
    color: 'bg-orange-500',
    initials: 'JD',
  },
  {
    stars: 5,
    text: '"J\'ai eu un client qui m\'a laissé un avis 5 étoiles en disant que j\'étais le plombier le plus professionnel qu\'il ait jamais eu. C\'est grâce au portail."',
    name: 'Marc-Pierre T.',
    job: 'Plombier — Bordeaux',
    color: 'bg-blue-600',
    initials: 'MP',
  },
  {
    stars: 5,
    text: '"La mise en place a pris 20 minutes. Maintenant tous mes chantiers ont leur portail. Mes clients se sentent suivis et moi j\'ai retrouvé mes soirées."',
    name: 'Sophie B.',
    job: 'Entreprise de peinture — Nantes',
    color: 'bg-emerald-600',
    initials: 'SB',
  },
]

const faqs = [
  {
    q: 'Mon client doit-il créer un compte ?',
    a: 'Non. Votre client reçoit un simple lien par email. Il clique et accède directement à son espace. Aucun mot de passe, aucune inscription.',
  },
  {
    q: 'Combien de temps faut-il pour démarrer ?',
    a: '15 minutes. Créez votre compte, renseignez votre premier chantier, uploadez un document, envoyez le lien à votre client. Notre conseiller IA vous guide si besoin.',
  },
  {
    q: 'Mes documents sont-ils en sécurité ?',
    a: 'Oui. Vos fichiers sont stockés sur des serveurs sécurisés en Europe. Seuls vous et votre client avez accès au portail. Chaque lien est unique et sécurisé.',
  },
  {
    q: 'Puis-je annuler à tout moment ?',
    a: 'Oui, sans engagement ni pénalité. Vous pouvez annuler depuis votre espace à tout moment. Vous gardez accès jusqu\'à la fin de la période payée.',
  },
  {
    q: 'Ça fonctionne sur téléphone ?',
    a: 'Absolument. Artisan Portal fonctionne sur tous les appareils. Vous pouvez uploader une photo depuis votre téléphone directement sur le chantier.',
  },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">

      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="font-extrabold text-xl tracking-tight">
            Artisan<span className="text-orange-500">Portal</span>
          </span>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#pourquoi" className="hover:text-orange-500 transition-colors">Pourquoi ça marche</a>
            <a href="#comment" className="hover:text-orange-500 transition-colors">Comment ça marche</a>
            <a href="#tarifs" className="hover:text-orange-500 transition-colors">Tarifs</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2">
              Connexion
            </Link>
            <Link href="/register" className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
              Essai gratuit 30 jours
            </Link>
          </div>
        </div>
      </header>

      <main>

        {/* HERO */}
        <section className="relative overflow-hidden bg-slate-900 px-6 py-28 text-center md:py-36">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_20%,rgba(249,115,22,0.15),transparent)]" />
          <div className="relative mx-auto max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-orange-400">
              🛠 Fait pour les artisans
            </div>
            <h1 className="mb-6 text-5xl font-extrabold leading-tight text-white md:text-6xl">
              Vos clients arrêtent de vous appeler.<br />
              <span className="text-orange-500">Vous arrêtez de tout répéter.</span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-xl text-slate-400 leading-relaxed">
              Donnez à chaque client un espace en ligne dédié à son chantier. Il suit l'avancement,
              télécharge ses documents, pose ses questions — sans vous déranger.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-10 py-4 text-lg font-bold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600 hover:-translate-y-0.5"
            >
              Je veux essayer gratuitement <ArrowRight className="h-5 w-5" />
            </Link>
            <p className="mt-5 text-sm text-slate-500">
              ✓ Sans engagement &nbsp;·&nbsp; ✓ 30 jours offerts &nbsp;·&nbsp; ✓ Opérationnel en 15 min
            </p>

            {/* Stats */}
            <div className="mt-20 grid grid-cols-2 gap-8 sm:grid-cols-4">
              {[
                { value: '400k', label: 'artisans en France' },
                { value: '< 30%', label: 'équipés en logiciel' },
                { value: '2–3h', label: 'perdues/semaine en appels' },
                { value: '30 j', label: 'pour voir le ROI' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-3xl font-extrabold text-orange-500">{s.value}</div>
                  <div className="mt-1 text-sm text-slate-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PAIN */}
        <section id="pourquoi" className="bg-slate-50 px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-orange-500">Le problème</p>
            <h2 className="mb-4 text-4xl font-extrabold leading-tight text-slate-900 md:text-5xl">
              Vous êtes artisan, pas standardiste.
            </h2>
            <p className="mb-14 text-lg text-slate-500 max-w-xl">
              Pourtant, vous perdez des heures chaque semaine à répondre aux mêmes questions. C'est fini.
            </p>
            <div className="grid gap-6 md:grid-cols-3">
              {painPoints.map((p) => (
                <div key={p.title} className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-orange-400" />
                  <div className="mb-4 text-4xl">{p.emoji}</div>
                  <h3 className="mb-2 font-bold text-slate-900">{p.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4">{p.desc}</p>
                  <span className="inline-block rounded-md bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">
                    {p.highlight}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="comment" className="bg-white px-6 py-24">
          <div className="mx-auto max-w-5xl text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-orange-500">La solution</p>
            <h2 className="mb-4 text-4xl font-extrabold text-slate-900 md:text-5xl">
              Un portail privé pour chaque chantier.<br />
              <span className="text-orange-500">En 3 clics.</span>
            </h2>
            <p className="mx-auto mb-16 max-w-lg text-lg text-slate-500">
              Vos clients ont leur propre espace en ligne. Ils trouvent tout, sans vous appeler.
            </p>
            <div className="grid gap-10 md:grid-cols-3">
              {[
                { n: '1', title: 'Créez le chantier', desc: 'Renseignez le nom du client, les dates, et l\'adresse. Votre espace est prêt en 2 minutes.' },
                { n: '2', title: 'Déposez vos documents et photos', desc: 'Glissez-déposez devis, factures et photos d\'avancement. Tout est rangé automatiquement.' },
                { n: '3', title: 'Envoyez le lien à votre client', desc: 'Un clic, un email. Votre client accède à son portail sans créer de compte.' },
              ].map((step) => (
                <div key={step.n} className="px-4 py-8">
                  <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-2xl font-extrabold text-white">
                    {step.n}
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-slate-900">{step.title}</h3>
                  <p className="text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* OUTCOMES */}
        <section className="bg-slate-50 px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-orange-500">Ce que vous gagnez</p>
            <h2 className="mb-14 text-4xl font-extrabold text-slate-900 md:text-5xl">
              Moins de stress. Plus de confiance.
            </h2>
            <div className="grid gap-5 md:grid-cols-2">
              {outcomes.map((o) => (
                <div key={o.title} className="flex gap-5 rounded-2xl border border-gray-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-orange-50 text-2xl">
                    {o.icon}
                  </div>
                  <div>
                    <h3 className="mb-1 font-bold text-slate-900">{o.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{o.desc}</p>
                    <p className="mt-2 text-xs font-semibold text-orange-500">✓ {o.result}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI AGENTS */}
        <section className="relative overflow-hidden bg-slate-900 px-6 py-24 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,rgba(249,115,22,0.12),transparent)]" />
          <div className="relative mx-auto max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-orange-400">
              🤖 Nouvelle génération
            </div>
            <h2 className="mb-5 text-4xl font-extrabold leading-tight text-white md:text-5xl">
              Un conseiller <span className="text-orange-500">disponible 24h/24</span><br />
              pour vous accompagner
            </h2>
            <p className="mx-auto mb-12 max-w-xl text-lg text-slate-400 leading-relaxed">
              Nos agents IA sont là pour répondre à vos questions, vous aider à démarrer,
              et vous guider à chaque étape — disponibles à 3h du matin si besoin.
            </p>
            <div className="mb-10 grid gap-5 md:grid-cols-3">
              {[
                { icon: '🚀', title: 'Démarrage en douceur', desc: 'Votre conseiller IA vous accompagne lors de la configuration de votre premier chantier, étape par étape.' },
                { icon: '💡', title: 'Conseils personnalisés', desc: 'Il analyse votre activité et vous suggère les fonctionnalités les plus utiles pour votre métier.' },
                { icon: '📞', title: 'Support sans attente', desc: 'Posez votre question, obtenez une réponse en quelques secondes. Plus besoin d\'attendre en ligne.' },
              ].map((c) => (
                <div key={c.title} className="rounded-2xl border border-white/8 bg-white/4 p-6 text-left">
                  <div className="mb-3 text-3xl">{c.icon}</div>
                  <h4 className="mb-2 font-bold text-white">{c.title}</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>
            <div className="inline-flex items-center gap-3 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-5 py-2.5 text-sm font-medium text-emerald-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Agents IA disponibles maintenant
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="tarifs" className="bg-white px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <div className="mb-14 text-center">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-orange-500">Tarifs</p>
              <h2 className="mb-3 text-4xl font-extrabold text-slate-900 md:text-5xl">Simple, sans surprise</h2>
              <p className="text-lg text-slate-500">30 jours gratuits sur tous les abonnements. Aucune carte bancaire requise.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative rounded-2xl border-2 p-8 ${
                    plan.featured
                      ? 'border-orange-500 bg-orange-50/50 shadow-xl shadow-orange-500/10'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-orange-500 px-4 py-1 text-xs font-bold text-white">
                      {plan.badge}
                    </div>
                  )}
                  <div className="mb-1 text-xl font-extrabold text-slate-900">{plan.name}</div>
                  <div className="mb-4 text-sm text-slate-500">{plan.desc}</div>
                  <div className="mb-1 text-5xl font-extrabold text-slate-900">
                    {plan.price}€<span className="text-lg font-normal text-slate-400">/mois</span>
                  </div>
                  <div className="mb-6 text-sm font-semibold text-emerald-500">✓ 30 jours offerts</div>
                  <ul className="mb-8 space-y-1">
                    {plan.features.map((f) => (
                      <li key={f.text} className="flex items-center gap-2.5 border-b border-gray-100 py-2 text-sm last:border-0">
                        {f.ok
                          ? <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                          : <XCircle className="h-4 w-4 flex-shrink-0 text-gray-300" />}
                        <span className={f.ok ? 'text-slate-700' : 'text-gray-300'}>{f.text}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className={`block w-full rounded-xl py-3 text-center font-semibold transition ${
                      plan.featured
                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                        : 'border-2 border-gray-200 text-slate-800 hover:border-orange-500 hover:text-orange-500'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="bg-slate-50 px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <div className="mb-14 text-center">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-orange-500">Ils l'utilisent déjà</p>
              <h2 className="text-4xl font-extrabold text-slate-900">Ce que disent les artisans</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {testimonials.map((t) => (
                <div key={t.name} className="rounded-2xl border border-gray-200 bg-white p-8">
                  <div className="mb-4 text-amber-400">{'★'.repeat(t.stars)}</div>
                  <p className="mb-6 text-sm italic leading-relaxed text-slate-600">{t.text}</p>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full ${t.color} text-sm font-bold text-white`}>
                      {t.initials}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{t.name}</div>
                      <div className="text-xs text-slate-500">{t.job}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white px-6 py-20">
          <div className="mx-auto max-w-2xl">
            <div className="mb-12 text-center">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-orange-500">Questions fréquentes</p>
              <h2 className="text-4xl font-extrabold text-slate-900">Tout ce que vous voulez savoir</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {faqs.map((f) => (
                <details key={f.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-slate-900">
                    {f.q}
                    <span className="ml-4 text-xl font-light text-orange-500 group-open:rotate-45 transition-transform">+</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-500">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="relative overflow-hidden bg-slate-900 px-6 py-28 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(249,115,22,0.15),transparent)]" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="mb-5 text-5xl font-extrabold leading-tight text-white">
              Prêt à <span className="text-orange-500">reprendre vos soirées</span> ?
            </h2>
            <p className="mb-10 text-xl text-slate-400">
              Rejoignez des centaines d'artisans qui ont arrêté de courir après leurs clients.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-12 py-5 text-xl font-bold text-white shadow-xl shadow-orange-500/30 transition hover:bg-orange-600 hover:-translate-y-0.5"
            >
              Je veux mon portail gratuit <ArrowRight className="h-6 w-6" />
            </Link>
            <p className="mt-5 text-sm text-slate-500">
              Un conseiller IA vous répond en moins de 30 secondes · Disponible 24h/24
            </p>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-slate-950 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <span className="text-xl font-extrabold text-white">
            Artisan<span className="text-orange-500">Portal</span>
          </span>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-slate-300">Mentions légales</a>
            <a href="#" className="hover:text-slate-300">CGV</a>
            <a href="#" className="hover:text-slate-300">Confidentialité</a>
            <a href="#" className="hover:text-slate-300">Contact</a>
          </div>
          <p className="text-sm text-slate-500">© 2026 Artisan Portal</p>
        </div>
      </footer>
    </div>
  )
}
