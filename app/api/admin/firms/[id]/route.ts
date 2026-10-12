import { NextRequest, NextResponse } from 'next/server'
import getSupabaseAdmin from '../../../../../lib/supabaseAdmin'

async function verifyAdmin(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  const auth = req.headers.get('authorization')
  if (!auth) return null
  const token = auth.replace('Bearer ', '')
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) return null
  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

// PATCH - update firm (name, status, password)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabaseAdmin = getSupabaseAdmin()
  const { id } = await params
  const body = await req.json()
  const { name, status, password } = body

  if (name !== undefined || status !== undefined) {
    const updates: any = {}
    if (name !== undefined) updates.name = name
    if (status !== undefined) updates.status = status
    const { error } = await supabaseAdmin.from('firms').update(updates).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (password) {
    const { data: profile } = await supabaseAdmin
      .from('profiles').select('id').eq('firm_id', id).eq('role', 'firm').single()
    if (profile?.id) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(profile.id, { password })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}

// DELETE - delete firm + auth user
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabaseAdmin = getSupabaseAdmin()
  const { id } = await params

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('id').eq('firm_id', id).eq('role', 'firm').single()

  if (profile?.id) {
    await supabaseAdmin.auth.admin.deleteUser(profile.id)
  }

  const { error } = await supabaseAdmin.from('firms').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

// GET - get firm data (for admin preview)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabaseAdmin = getSupabaseAdmin()
  const { id } = await params

  const { data: firm } = await supabaseAdmin.from('firms').select('*').eq('id', id).single()
  const { data: clients } = await supabaseAdmin.from('clients').select('*').eq('firm_id', id).order('created_at', { ascending: false })
  const { data: tasks } = await supabaseAdmin.from('tasks').select('*').eq('firm_id', id).is('client_id', null)

  return NextResponse.json({ firm, clients: clients || [], tasks: tasks || [] })
}
