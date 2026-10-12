import { NextRequest, NextResponse } from 'next/server'

// Public routes that don't require auth
const PUBLIC_PATHS = ['/login', '/intake', '/api/']

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Allow static files
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }

  // Check for Supabase session cookie
  const hasSession =
    req.cookies.has('sb-access-token') ||
    req.cookies.has('sb-refresh-token') ||
    // Supabase v2 stores session under a project-specific key
    [...req.cookies.getAll()].some(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'))

  if (!hasSession) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
