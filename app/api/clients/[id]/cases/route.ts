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

  const snap = await db.collection('cases')
    .where('clientId', '==', clientId)
    .where('officeId', '==', officeId)
    .get()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cases = snap.docs
    .map((d: any) => ({ id: d.id, ...d.data() }))
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return NextResponse.json({ cases })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const officeId = await getOfficeId()
  if (!officeId) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const { id: clientId } = await params
  const { title, notes } = await req.json()

  const docRef = await db.collection('cases').add({
    clientId,
    officeId,
    title,
    notes: notes || '',
    status: 'new',
    createdAt: new Date().toISOString(),
  })

  const doc = await docRef.get()
  return NextResponse.json({ case: { id: docRef.id, ...doc.data() } })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const officeId = await getOfficeId()
  if (!officeId) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const { id: clientId } = await params
  const { caseId, status, title, notes } = await req.json()

  const caseDoc = await db.collection('cases').doc(caseId).get()
  if (!caseDoc.exists || caseDoc.data()?.clientId !== clientId || caseDoc.data()?.officeId !== officeId) {
    return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
  }

  const updates: Record<string, string> = {}
  if (status !== undefined) updates.status = status
  if (title !== undefined) updates.title = title
  if (notes !== undefined) updates.notes = notes

  await db.collection('cases').doc(caseId).update(updates)
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const officeId = await getOfficeId()
  if (!officeId) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const { id: clientId } = await params
  const caseId = req.nextUrl.searchParams.get('caseId')
  if (!caseId) return NextResponse.json({ error: 'חסר ID' }, { status: 400 })

  const caseDoc = await db.collection('cases').doc(caseId).get()
  if (caseDoc.exists && caseDoc.data()?.clientId === clientId && caseDoc.data()?.officeId === officeId) {
    await db.collection('cases').doc(caseId).delete()
  }

  return NextResponse.json({ success: true })
}
