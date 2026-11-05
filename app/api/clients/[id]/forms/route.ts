import { NextRequest, NextResponse } from 'next/server'
import { db, storage } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'

async function getOfficeId() {
  const cookieStore = await cookies()
  return cookieStore.get('officeId')?.value
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const officeId = await getOfficeId()
  if (!officeId) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const { id: clientId } = await params

  const snap = await db.collection('clientForms')
    .where('clientId', '==', clientId)
    .where('officeId', '==', officeId)
    .orderBy('createdAt', 'desc')
    .get()

  const forms = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }))
  return NextResponse.json({ forms })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const officeId = await getOfficeId()
  if (!officeId) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const { id: clientId } = await params
  const formData = await req.formData()
  const file = formData.get('file') as File
  const type = formData.get('type') as string || 'אחר'

  if (!file) return NextResponse.json({ error: 'לא נבחר קובץ' }, { status: 400 })

  const ext = file.name.split('.').pop() || 'file'
  const fileName = `forms/${clientId}/${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const bucket = storage.bucket()
  const fileRef = bucket.file(fileName)
  await fileRef.save(buffer, { contentType: file.type })

  const [url] = await fileRef.getSignedUrl({
    action: 'read',
    expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
  })

  const docRef = await db.collection('clientForms').add({
    clientId,
    officeId,
    name: file.name,
    type,
    url,
    path: fileName,
    createdAt: new Date().toISOString(),
  })

  const doc = await docRef.get()
  return NextResponse.json({ form: { id: docRef.id, ...doc.data() } })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const officeId = await getOfficeId()
  if (!officeId) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const { id: clientId } = await params
  const formId = req.nextUrl.searchParams.get('formId')
  if (!formId) return NextResponse.json({ error: 'חסר ID' }, { status: 400 })

  const formDoc = await db.collection('clientForms').doc(formId).get()
  if (formDoc.exists && formDoc.data()?.clientId === clientId) {
    await db.collection('clientForms').doc(formId).delete()
  }

  return NextResponse.json({ success: true })
}
