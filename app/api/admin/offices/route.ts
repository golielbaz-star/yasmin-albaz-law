import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'
import bcrypt from 'bcryptjs'

function isAdminAuthed(req: NextRequest) {
  return req.cookies.get('adminAuth')?.value === 'true'
}

export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: 'לא מורשה' }, { status: 401 })
  }

  const snap = await db.collection('offices').orderBy('createdAt', 'desc').get()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const offices = snap.docs.map((doc: any) => {
    const { password, ...data } = doc.data()
    return { id: doc.id, ...data }
  })

  return NextResponse.json({ offices })
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: 'לא מורשה' }, { status: 401 })
  }

  const { name, email, password } = await req.json()

  const existing = await db.collection('offices').where('email', '==', email).limit(1).get()
  if (!existing.empty) {
    return NextResponse.json({ error: 'האימייל כבר קיים במערכת' }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  await db.collection('offices').add({
    name,
    email,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: 'לא מורשה' }, { status: 401 })
  }

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'חסר ID' }, { status: 400 })

  await db.collection('offices').doc(id).delete()
  return NextResponse.json({ success: true })
}
