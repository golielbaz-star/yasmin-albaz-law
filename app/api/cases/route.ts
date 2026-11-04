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

  const casesSnap = await db.collection('cases')
    .where('officeId', '==', officeId)
    .orderBy('createdAt', 'desc')
    .get()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cases = await Promise.all(casesSnap.docs.map(async (doc: any) => {
    const data = doc.data()

    let client = null
    if (data.clientId) {
      const clientDoc = await db.collection('clients').doc(data.clientId).get()
      if (clientDoc.exists) client = clientDoc.data()
    }

    const docsSnap = await db.collection('documents').where('caseId', '==', doc.id).get()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const documents = docsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }))

    return {
      id: doc.id,
      ...data,
      Client: client,
      Document: documents,
    }
  }))

  return NextResponse.json({ cases })
}

export async function POST(req: NextRequest) {
  const officeId = await getOfficeId()
  if (!officeId) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const { clientName, clientPhone, clientEmail, title, insuranceCompany } = await req.json()

  const clientRef = await db.collection('clients').add({
    officeId,
    name: clientName,
    phone: clientPhone || '',
    email: clientEmail || '',
    createdAt: new Date().toISOString(),
  })

  const caseRef = await db.collection('cases').add({
    officeId,
    clientId: clientRef.id,
    title,
    insuranceCompany: insuranceCompany || '',
    clientPhone: clientPhone || '',
    status: 'new',
    createdAt: new Date().toISOString(),
  })

  const caseDoc = await caseRef.get()
  return NextResponse.json({ case: { id: caseRef.id, ...caseDoc.data() } })
}

export async function PATCH(req: NextRequest) {
  const officeId = await getOfficeId()
  if (!officeId) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const { id, status } = await req.json()

  const caseDoc = await db.collection('cases').doc(id).get()
  if (!caseDoc.exists || caseDoc.data()?.officeId !== officeId) {
    return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
  }

  await db.collection('cases').doc(id).update({ status })
  return NextResponse.json({ success: true })
}
