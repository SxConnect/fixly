import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Proteção otimista da área admin: sem cookie de sessão, redireciona para /login.
 * A checagem real de papel (role) acontece no layout do admin e nas Server Actions.
 */
export function proxy(request: NextRequest) {
  const token = request.cookies.get('fixly_token')?.value

  if (!token) {
    const url = new URL('/login', request.url)
    url.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
