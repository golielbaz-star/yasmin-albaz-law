import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'

async function getOfficeId() {
  const cookieStore = await cookies()
  return cookieStore.get('officeId')?.value
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const officeId = await getOfficeId()
  if (!officeId) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const doc = await db.collection('clients').doc(id).get()
  if (!doc.exists || doc.data()?.officeId !== officeId) {
    return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
  }

  await db.collection('clients').doc(id).update(body)
  return NextResponse.json({ success: true })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const officeId = await getOfficeId()
  if (!officeId) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const { id } = await params

  const doc = await db.collection('clients').doc(id).get()
  if (!doc.exists || doc.data()?.officeId !== officeId) {
    return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
  }

  await db.collection('clients').doc(id).delete()
  return NextResponse.json({ success: true })
}
