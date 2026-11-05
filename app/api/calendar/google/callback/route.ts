import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { db } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/calendar?error=no_code`)

  const cookieStore = await cookies()
  const officeId = cookieStore.get('officeId')?.value
  if (!officeId) return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`)

  const clientId = process.env.GOOGLE_CLIENT_ID!
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/google/callback`

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)

  const { tokens } = await oauth2Client.getToken(code)

  await db.collection('offices').doc(officeId).update({
    googleCalendarTokens: tokens,
  })

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/calendar?synced=1`)
}
