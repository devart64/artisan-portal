import Link from 'next/link'
import { portalFetch, PortalError } from '@/lib/portal'
import { PortalHeader } from '@/components/portal/PortalHeader'
import type { PortalData } from '@/lib/types'

interface PortalLayoutProps {
  children: React.ReactNode
  params: Promise<{ token: string }>
}

const navTabs = [
  { href: '', label: 'Résumé' },
  { href: '/documents', label: 'Documents' },
  { href: '/photos', label: 'Photos' },
  { href: '/planning', label: 'Planning' },
  { href: '/messages', label: 'Messages' },
]

export default async function PortalLayout({ children, params }: PortalLayoutProps) {
  const { token } = await params

  let portalData: PortalData | null = null
  let isExpired = false

  try {
    portalData = await portalFetch<PortalData>(token, '')
  } catch (err) {
    if (err instanceof PortalError) {
      isExpired = true
    } else {
      isExpired = true
    }
  }

  if (isExpired || !portalData) {
    return (
      <html lang="fr">
        <body>
          <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md text-center">
              <div className="mb-6 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <svg
                    className="h-8 w-8 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="mb-2 text-2xl font-bold text-gray-900">
                Lien expiré ou invalide
              </h1>
              <p className="text-gray-500">
                Ce lien de portail client n'est plus valide. Veuillez contacter
                votre artisan pour obtenir un nouveau lien.
              </p>
            </div>
          </div>
        </body>
      </html>
    )
  }

  const { tenant, chantier } = portalData

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ '--brand': tenant.brandColor } as React.CSSProperties}
    >
      <PortalHeader tenant={tenant} />

      {/* Chantier title sub-header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <p className="text-sm font-medium text-gray-700">{chantier.title}</p>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-4">
          <nav className="flex gap-1 overflow-x-auto">
            {navTabs.map((tab) => (
              <Link
                key={tab.href}
                href={`/portal/${token}${tab.href}`}
                className="whitespace-nowrap border-b-2 border-transparent px-4 py-3 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
                style={
                  {
                    '--tab-hover-border': tenant.brandColor,
                  } as React.CSSProperties
                }
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  )
}
