import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { db } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()
  const officeId = cookieStore.get('officeId')?.value
  if (!officeId) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const officeDoc = await db.collection('offices').doc(officeId).get()
  const tokens = officeDoc.data()?.googleCalendarTokens
  if (!tokens) return NextResponse.json({ error: 'לא מחובר ל-Google Calendar' }, { status: 400 })

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/google/callback`
  )
  oauth2Client.setCredentials(tokens)

  // Save updated tokens if refreshed
  oauth2Client.on('tokens', async (newTokens) => {
    const updated = { ...tokens, ...newTokens }
    await db.collection('offices').doc(officeId).update({ googleCalendarTokens: updated })
  })

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  const now = new Date()
  const timeMin = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const timeMax = new Date(now.getFullYear(), now.getMonth() + 3, 1).toISOString()

  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 500,
  })

  const googleEvents = res.data.items || []
  let imported = 0

  for (const ge of googleEvents) {
    if (!ge.id || !ge.summary) continue

    const startDate = ge.start?.date || ge.start?.dateTime?.split('T')[0]
    if (!startDate) continue

    const startTime = ge.start?.dateTime
      ? new Date(ge.start.dateTime).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false })
      : ''
    const endTime = ge.end?.dateTime
      ? new Date(ge.end.dateTime).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false })
      : ''

    // Check if already imported
    const existing = await db.collection('events')
      .where('officeId', '==', officeId)
      .where('googleEventId', '==', ge.id)
      .get()

    if (existing.empty) {
      await db.collection('events').add({
        officeId,
        title: ge.summary,
        date: startDate,
        startTime,
        endTime,
        type: 'other',
        clientId: '',
        clientName: '',
        notes: ge.description || '',
        googleEventId: ge.id,
        createdAt: new Date().toISOString(),
      })
      imported++
    }
  }

  return NextResponse.json({ success: true, imported })
}
