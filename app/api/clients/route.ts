import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'

async function getOfficeId() {
  const cookieStore = await cookies()
  return cookieStore.get('officeId')?.value
}

export async function GET() {
  const officeId = await getOfficeId()
  if (!officeId) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const snap = await db.collection('clients')
    .where('officeId', '==', officeId)
    .orderBy('createdAt', 'desc')
    .get()

  const clients = snap.docs.map((d: any) => ({
    id: d.id,
    ...d.data(),
    status: d.data().status || 'active',
  }))

  return NextResponse.json({ clients })
}

export async function POST(req: NextRequest) {
  const officeId = await getOfficeId()
  if (!officeId) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const { name, phone, email, notes, status } = await req.json()

  if (!name) return NextResponse.json({ error: 'שם חובה' }, { status: 400 })

  const docRef = await db.collection('clients').add({
    officeId,
    name,
    phone: phone || '',
    email: email || '',
    notes: notes || '',
    status: status || 'active',
    createdAt: new Date().toISOString(),
  })

  const doc = await docRef.get()
  return NextResponse.json({ client: { id: docRef.id, ...doc.data() } })
}
