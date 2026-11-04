import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'כל השדות נדרשים' }, { status: 400 })
  }

  const existing = await db.collection('offices').where('email', '==', email).limit(1).get()
  if (!existing.empty) {
    return NextResponse.json({ error: 'האימייל כבר רשום במערכת' }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const docRef = await db.collection('offices').add({
    name,
    email,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  })

  const response = NextResponse.json({ success: true })
  response.cookies.set('officeId', docRef.id, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  return response
}
