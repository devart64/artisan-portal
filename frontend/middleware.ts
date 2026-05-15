import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const jwt = req.cookies.get('jwt')
  const pathname = req.nextUrl.pathname
  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/chantiers') ||
    pathname.startsWith('/clients') ||
    pathname.startsWith('/settings')

  if (isProtected && !jwt) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next|portal|auth|.*\\..*).*)'],
}
