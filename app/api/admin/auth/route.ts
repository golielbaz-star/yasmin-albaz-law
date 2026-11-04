import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { password } = await req.json()

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'סיסמה שגויה' }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set('adminAuth', 'true', {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 8,
  })

  return response
}
