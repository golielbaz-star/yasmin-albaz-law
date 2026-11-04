import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  const snap = await db.collection('agents').where('email', '==', email).limit(1).get()
  if (snap.empty) {
    return NextResponse.json({ error: 'אימייל או סיסמה שגויים' }, { status: 401 })
  }

  const doc = snap.docs[0]
  const agent = doc.data()

  const valid = await bcrypt.compare(password, agent.password)
  if (!valid) {
    return NextResponse.json({ error: 'אימייל או סיסמה שגויים' }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set('agentId', doc.id, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7 })
  response.cookies.set('agentOfficeId', agent.officeId, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7 })
  return response
}
