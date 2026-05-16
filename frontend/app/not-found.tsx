import Link from 'next/link'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      <div className="mx-auto max-w-md">
        {/* Logo */}
        <div className="mb-10">
          <span className="text-2xl font-extrabold tracking-tight text-gray-900">
            Artisan<span className="text-orange-500">Portal</span>
          </span>
        </div>

        {/* 404 visuel */}
        <div className="mb-6 text-8xl font-extrabold text-orange-500 leading-none">
          404
        </div>

        <h1 className="mb-3 text-2xl font-extrabold text-slate-900">
          Page introuvable
        </h1>
        <p className="mb-10 text-base text-slate-500 leading-relaxed">
          Cette page n&apos;existe pas ou a été déplacée.
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 hover:-translate-y-0.5"
          >
            <Home className="h-4 w-4" />
            Retour à l&apos;accueil
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-500 hover:text-orange-500"
          >
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  )
}
