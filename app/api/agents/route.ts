import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

async function getOfficeId() {
  const cookieStore = await cookies()
  return cookieStore.get('officeId')?.value
}

export async function GET() {
  const officeId = await getOfficeId()
  if (!officeId) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const snap = await db.collection('agents')
    .where('officeId', '==', officeId)
    .orderBy('createdAt', 'desc')
    .get()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const agents = snap.docs.map((doc: any) => {
    const { password, ...data } = doc.data()
    return { id: doc.id, ...data }
  })

  return NextResponse.json({ agents })
}

export async function POST(req: NextRequest) {
  const officeId = await getOfficeId()
  if (!officeId) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const { name, email, password, companyName } = await req.json()
  const hashedPassword = await bcrypt.hash(password, 10)

  await db.collection('agents').add({
    officeId,
    name,
    email,
    password: hashedPassword,
    companyName,
    createdAt: new Date().toISOString(),
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const officeId = await getOfficeId()
  if (!officeId) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'חסר ID' }, { status: 400 })

  // הסר קשר לתיקים לפני המחיקה
  const casesSnap = await db.collection('cases').where('agentId', '==', id).get()
  const batch = db.batch()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  casesSnap.docs.forEach((doc: any) => batch.update(doc.ref, { agentId: null }))
  batch.delete(db.collection('agents').doc(id))
  await batch.commit()

  return NextResponse.json({ success: true })
}
