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

  const snap = await db.collection('tasks')
    .where('officeId', '==', officeId)
    .get()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tasks = snap.docs
    .map((doc: any) => ({ id: doc.id, ...doc.data() }))
    .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  return NextResponse.json({ tasks })
}

export async function POST(req: NextRequest) {
  const officeId = await getOfficeId()
  if (!officeId) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const { title, dueDate, caseTitle } = await req.json()

  const docRef = await db.collection('tasks').add({
    officeId,
    title,
    dueDate: dueDate || null,
    caseTitle: caseTitle || null,
    status: 'active',
    done: false,
    createdAt: new Date().toISOString(),
  })

  const taskDoc = await docRef.get()
  return NextResponse.json({ task: { id: docRef.id, ...taskDoc.data() } })
}

export async function PATCH(req: NextRequest) {
  const officeId = await getOfficeId()
  if (!officeId) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const { id, status } = await req.json()

  const taskDoc = await db.collection('tasks').doc(id).get()
  if (!taskDoc.exists || taskDoc.data()?.officeId !== officeId) {
    return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
  }

  await db.collection('tasks').doc(id).update({ status })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const officeId = await getOfficeId()
  if (!officeId) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'חסר ID' }, { status: 400 })

  const taskDoc = await db.collection('tasks').doc(id).get()
  if (taskDoc.exists && taskDoc.data()?.officeId === officeId) {
    await db.collection('tasks').doc(id).delete()
  }

  return NextResponse.json({ success: true })
}
