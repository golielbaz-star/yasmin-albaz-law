import { NextRequest, NextResponse } from 'next/server'

// Auth is handled client-side in each page component
export function proxy(_req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
