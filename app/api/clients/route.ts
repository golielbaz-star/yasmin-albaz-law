import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const officeId = cookieStore.get('officeId')?.value
  if (!officeId) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const casesSnap = await db.collection('cases')
    .where('officeId', '==', officeId)
    .orderBy('createdAt', 'desc')
    .get()

  const clientIds = [...new Set(casesSnap.docs.map((d: any) => d.data().clientId).filter(Boolean))]

  const clients = await Promise.all(clientIds.map(async (clientId: string) => {
    const clientDoc = await db.collection('clients').doc(clientId).get()
    if (!clientDoc.exists) return null
    const clientData = clientDoc.data()!

    const clientCases = casesSnap.docs
      .filter((d: any) => d.data().clientId === clientId)
      .map((d: any) => ({ id: d.id, ...d.data() }))

    const isArchived = clientCases.every((c: any) => c.status === 'done')

    return {
      id: clientId,
      ...clientData,
      cases: clientCases,
      archived: isArchived,
    }
  }))

  return NextResponse.json({ clients: clients.filter(Boolean) })
}
