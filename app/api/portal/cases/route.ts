import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'

async function getAgent() {
  const cookieStore = await cookies()
  const agentId = cookieStore.get('agentId')?.value
  const officeId = cookieStore.get('agentOfficeId')?.value
  return { agentId, officeId }
}

export async function GET() {
  const { agentId, officeId } = await getAgent()
  if (!agentId || !officeId) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const snap = await db.collection('cases')
    .where('officeId', '==', officeId)
    .where('agentId', '==', agentId)
    .get()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cases = await Promise.all(snap.docs.sort((a: any, b: any) => new Date(b.data().createdAt).getTime() - new Date(a.data().createdAt).getTime()).map(async (doc: any) => {
    const data = doc.data()
    let client = null
    if (data.clientId) {
      const clientDoc = await db.collection('clients').doc(data.clientId).get()
      if (clientDoc.exists) client = clientDoc.data()
    }
    return { id: doc.id, ...data, Client: client }
  }))

  return NextResponse.json({ cases })
}

export async function POST(req: NextRequest) {
  try {
    const { agentId, officeId } = await getAgent()
    if (!agentId || !officeId) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

    const { clientName, clientPhone, clientEmail, title, insuranceCompany, notes } = await req.json()

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
      agentId,
      notes: notes || '',
      status: 'new',
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, case: { id: caseRef.id } })
  } catch (e) {
    console.error('Unexpected error:', e)
    return NextResponse.json({ error: 'שגיאה לא צפויה' }, { status: 500 })
  }
}
