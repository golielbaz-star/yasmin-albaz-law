import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const officeId = cookieStore.get('officeId')?.value
  if (!officeId) return NextResponse.json({ connected: false })

  const doc = await db.collection('offices').doc(officeId).get()
  const tokens = doc.data()?.googleCalendarTokens
  return NextResponse.json({ connected: !!tokens })
}
