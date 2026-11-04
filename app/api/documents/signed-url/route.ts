import { NextRequest, NextResponse } from 'next/server'
import { storage } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const officeId = cookieStore.get('officeId')?.value
  const agentId = cookieStore.get('agentId')?.value

  if (!officeId && !agentId) {
    return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })
  }

  const path = req.nextUrl.searchParams.get('path')
  if (!path) return NextResponse.json({ error: 'חסר נתיב' }, { status: 400 })

  const [signedUrl] = await storage.bucket().file(path).getSignedUrl({
    action: 'read',
    expires: Date.now() + 60 * 1000,
  })

  return NextResponse.json({ url: signedUrl })
}
