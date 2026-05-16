import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import { PwaInit } from '@/components/shared/PwaInit'
import './globals.css'

export const metadata: Metadata = {
  title: 'Artisan Portal — Le portail client pour artisans',
  description:
    'Simplifiez le suivi de vos chantiers. Partagez documents, photos et jalons avec vos clients en quelques clics. Essai gratuit 14 jours.',
  keywords: [
    'artisan',
    'portail client',
    'suivi chantier',
    'BTP',
    'devis',
    'factures',
  ],
  openGraph: {
    title: 'Artisan Portal — Le portail client pour artisans',
    description:
      'Simplifiez le suivi de vos chantiers. Partagez documents, photos et jalons avec vos clients en quelques clics. Essai gratuit 14 jours.',
    url: 'https://artisan-portal.fr',
    siteName: 'Artisan Portal',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Artisan Portal — Le portail client pour artisans',
    description:
      'Simplifiez le suivi de vos chantiers. Partagez documents, photos et jalons avec vos clients en quelques clics. Essai gratuit 14 jours.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="canonical" href="https://artisan-portal.fr" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1A56A0" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body>
        <PwaInit />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
