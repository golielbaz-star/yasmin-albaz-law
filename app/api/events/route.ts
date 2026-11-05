import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'

async function getOfficeId() {
  const cookieStore = await cookies()
  return cookieStore.get('officeId')?.value
}

export async function GET(req: NextRequest) {
  const officeId = await getOfficeId()
  if (!officeId) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const from = req.nextUrl.searchParams.get('from')
  const to = req.nextUrl.searchParams.get('to')

  const snap = await db.collection('events')
    .where('officeId', '==', officeId)
    .get()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let events = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }))

  if (from) events = events.filter((e: any) => e.date >= from)
  if (to) events = events.filter((e: any) => e.date <= to)

  events.sort((a: any, b: any) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return (a.startTime || '').localeCompare(b.startTime || '')
  })

  return NextResponse.json({ events })
}

export async function POST(req: NextRequest) {
  const officeId = await getOfficeId()
  if (!officeId) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const { title, date, startTime, endTime, type, clientId, clientName, notes } = await req.json()
  if (!title || !date) return NextResponse.json({ error: 'חסרים שדות חובה' }, { status: 400 })

  const docRef = await db.collection('events').add({
    officeId,
    title,
    date,
    startTime: startTime || '',
    endTime: endTime || '',
    type: type || 'other',
    clientId: clientId || '',
    clientName: clientName || '',
    notes: notes || '',
    createdAt: new Date().toISOString(),
  })

  const doc = await docRef.get()
  return NextResponse.json({ event: { id: docRef.id, ...doc.data() } })
}

export async function PATCH(req: NextRequest) {
  const officeId = await getOfficeId()
  if (!officeId) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const { id, ...updates } = await req.json()

  const doc = await db.collection('events').doc(id).get()
  if (!doc.exists || doc.data()?.officeId !== officeId) {
    return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
  }

  await db.collection('events').doc(id).update(updates)
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const officeId = await getOfficeId()
  if (!officeId) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'חסר ID' }, { status: 400 })

  const doc = await db.collection('events').doc(id).get()
  if (doc.exists && doc.data()?.officeId === officeId) {
    await db.collection('events').doc(id).delete()
  }

  return NextResponse.json({ success: true })
}
