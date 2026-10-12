import { NextRequest, NextResponse } from 'next/server'
import getSupabaseAdmin from '../../../../lib/supabaseAdmin'

// GET - list all firms with stats
export async function GET(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  const auth = req.headers.get('authorization')
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = auth.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: firms, error } = await supabaseAdmin.from('firms').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const firmsWithStats = await Promise.all((firms || []).map(async (firm) => {
    const { count: clientCount } = await supabaseAdmin.from('clients').select('*', { count: 'exact', head: true }).eq('firm_id', firm.id)
    const { data: firmProfile } = await supabaseAdmin.from('profiles').select('id').eq('firm_id', firm.id).eq('role', 'firm').single()
    return { ...firm, clientCount: clientCount || 0, userId: firmProfile?.id || null }
  }))

  return NextResponse.json({ firms: firmsWithStats })
}

// POST - create new firm + auth user
export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  const auth = req.headers.get('authorization')
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = auth.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, email, password } = await req.json()
  if (!name || !email || !password) {
    return NextResponse.json({ error: 'שם, מייל וסיסמה נדרשים' }, { status: 400 })
  }

  const { data: firm, error: firmError } = await supabaseAdmin
    .from('firms')
    .insert({ name, email })
    .select()
    .single()
  if (firmError) return NextResponse.json({ error: firmError.message }, { status: 500 })

  const { data: newUser, error: userError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (userError) {
    await supabaseAdmin.from('firms').delete().eq('id', firm.id)
    return NextResponse.json({ error: userError.message }, { status: 500 })
  }

  const { error: profileError } = await supabaseAdmin.from('profiles').insert({
    id: newUser.user.id,
    firm_id: firm.id,
    role: 'firm',
  })
  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
    await supabaseAdmin.from('firms').delete().eq('id', firm.id)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ firm, userId: newUser.user.id })
}
