'use client'

import Link from 'next/link'
import { Home } from 'lucide-react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      <div className="mx-auto max-w-md">
        {/* Logo */}
        <div className="mb-10">
          <span className="text-2xl font-extrabold tracking-tight text-gray-900">
            Artisan<span className="text-orange-500">Portal</span>
          </span>
        </div>

        {/* Icône erreur */}
        <div className="mb-6 flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-50">
            <span className="text-4xl">⚠️</span>
          </div>
        </div>

        <h1 className="mb-3 text-2xl font-extrabold text-slate-900">
          Une erreur est survenue
        </h1>

        {error?.message && (
          <p className="mb-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500 font-mono break-words">
            {error.message}
          </p>
        )}

        <p className="mb-10 text-base text-slate-500 leading-relaxed">
          Quelque chose s&apos;est mal passé. Vous pouvez réessayer ou revenir à l&apos;accueil.
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 hover:-translate-y-0.5"
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-500 hover:text-orange-500"
          >
            <Home className="h-4 w-4" />
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
