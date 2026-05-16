'use client'

import Link from 'next/link'
import { Home } from 'lucide-react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: ErrorProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 text-center">
      <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-10 shadow-sm">
        {/* Icône erreur */}
        <div className="mb-6 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
            <span className="text-3xl">⚠️</span>
          </div>
        </div>

        <h1 className="mb-3 text-xl font-extrabold text-slate-900">
          Une erreur est survenue
        </h1>

        {error?.message && (
          <p className="mb-4 rounded-lg bg-gray-50 px-4 py-3 text-xs text-slate-500 font-mono break-words text-left">
            {error.message}
          </p>
        )}

        <p className="mb-8 text-sm text-slate-500 leading-relaxed">
          Une erreur inattendue s&apos;est produite dans le tableau de bord.
          Vous pouvez réessayer ou retourner à l&apos;accueil.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
          >
            Réessayer
          </button>
          <Link
            href="/dashboard"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-500 hover:text-orange-500"
          >
            <Home className="h-4 w-4" />
            Tableau de bord
          </Link>
        </div>
      </div>
    </div>
  )
}
