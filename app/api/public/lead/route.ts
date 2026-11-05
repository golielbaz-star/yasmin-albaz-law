import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  const { officeId, name, phone, email, notes } = await req.json()

  if (!officeId || !name || !phone) {
    return NextResponse.json({ error: 'שם וטלפון חובה' }, { status: 400 })
  }

  // וודא שהמשרד קיים
  const officeDoc = await db.collection('offices').doc(officeId).get()
  if (!officeDoc.exists) {
    return NextResponse.json({ error: 'משרד לא נמצא' }, { status: 404 })
  }

  await db.collection('clients').add({
    officeId,
    name,
    phone,
    email: email || '',
    notes: notes || '',
    status: 'lead',
    createdAt: new Date().toISOString(),
  })

  return NextResponse.json({ success: true })
}
