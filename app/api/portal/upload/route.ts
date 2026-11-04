import { NextRequest, NextResponse } from 'next/server'
import { db, storage } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const agentId = cookieStore.get('agentId')?.value
  if (!agentId) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  const caseId = formData.get('caseId') as string

  if (!file) return NextResponse.json({ error: 'לא נבחר קובץ' }, { status: 400 })

  const ext = file.name.split('.').pop() || 'file'
  const fileName = `${caseId}/${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const bucket = storage.bucket()
  const fileRef = bucket.file(fileName)

  await fileRef.save(buffer, { contentType: file.type })

  const [signedUrl] = await fileRef.getSignedUrl({
    action: 'read',
    expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
  })

  await db.collection('documents').add({
    caseId,
    name: file.name,
    url: signedUrl,
    path: fileName,
    createdAt: new Date().toISOString(),
  })

  return NextResponse.json({ url: signedUrl })
}
