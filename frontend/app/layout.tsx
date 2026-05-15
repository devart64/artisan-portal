import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Artisan Portal',
  description: 'Gérez vos chantiers et partagez-les avec vos clients',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
