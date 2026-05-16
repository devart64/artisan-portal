import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Artisan Portal — Connexion',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="mb-8 text-center">
        <span className="text-2xl font-bold tracking-tight text-gray-900">
          Artisan<span className="text-blue-600">Portal</span>
        </span>
        <p className="mt-1 text-sm text-gray-500">Gérez vos chantiers, enchantez vos clients</p>
      </div>
      {children}
    </div>
  )
}
