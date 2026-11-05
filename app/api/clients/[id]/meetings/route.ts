import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'

async function getOfficeId() {
  const cookieStore = await cookies()
  return cookieStore.get('officeId')?.value
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const officeId = await getOfficeId()
  if (!officeId) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const { id: clientId } = await params

  const snap = await db.collection('meetings')
    .where('clientId', '==', clientId)
    .where('officeId', '==', officeId)
    .orderBy('date', 'desc')
    .get()

  const meetings = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }))
  return NextResponse.json({ meetings })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const officeId = await getOfficeId()
  if (!officeId) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const { id: clientId } = await params
  const { date, notes } = await req.json()

  const docRef = await db.collection('meetings').add({
    clientId,
    officeId,
    date,
    notes: notes || '',
    documents: [],
    createdAt: new Date().toISOString(),
  })

  const doc = await docRef.get()
  return NextResponse.json({ meeting: { id: docRef.id, ...doc.data() } })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const officeId = await getOfficeId()
  if (!officeId) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const { id: clientId } = await params
  const meetingId = req.nextUrl.searchParams.get('meetingId')
  if (!meetingId) return NextResponse.json({ error: 'חסר ID' }, { status: 400 })

  const meetingDoc = await db.collection('meetings').doc(meetingId).get()
  if (meetingDoc.exists && meetingDoc.data()?.clientId === clientId) {
    await db.collection('meetings').doc(meetingId).delete()
  }

  return NextResponse.json({ success: true })
}
