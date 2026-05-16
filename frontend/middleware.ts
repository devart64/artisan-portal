import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/cgv',
  '/mentions-legales',
  '/politique-confidentialite',
]

function isPublic(pathname: string): boolean {
  // Routes exactement publiques
  if (PUBLIC_PATHS.includes(pathname)) return true
  // Portail client (magic link) — toujours public
  if (pathname.startsWith('/portal/')) return true
  // Pages d'auth
  if (pathname.startsWith('/invitation/')) return true
  // Assets Next.js
  if (pathname.startsWith('/_next/')) return true
  if (pathname.startsWith('/api/')) return true
  // Fichiers statiques
  if (/\.(ico|png|jpg|jpeg|svg|webp|woff|woff2|txt|xml)$/.test(pathname)) return true
  return false
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublic(pathname)) return NextResponse.next()

  // Vérifier le JWT (cookie ou header)
  const token =
    request.cookies.get('jwt')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
