import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Artisan Portal — Informations légales',
}

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-6 py-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Artisan<span className="text-orange-500">Portal</span>
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">
        {children}
      </main>
      <footer className="border-t border-gray-100 px-6 py-6 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} Artisan Portal —
        <Link href="/mentions-legales" className="ml-2 hover:text-gray-600">Mentions légales</Link>
        <Link href="/cgv" className="ml-2 hover:text-gray-600">CGV</Link>
        <Link href="/politique-confidentialite" className="ml-2 hover:text-gray-600">Confidentialité</Link>
      </footer>
    </div>
  )
}
