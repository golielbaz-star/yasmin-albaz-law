'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

type Firm = {
  id: string
  name: string
  email: string
  status: string
  created_at: string
  clientCount: number
  userId: string | null
}

type Modal = 'create' | 'edit' | 'preview' | null

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [firms, setFirms] = useState<Firm[]>([])
  const [token, setToken] = useState('')
  const [modal, setModal] = useState<Modal>(null)
  const [selectedFirm, setSelectedFirm] = useState<Firm | null>(null)
  const [saving, setSaving] = useState(false)
  const [actionMsg, setActionMsg] = useState('')

  // Create form
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '' })
  // Edit form
  const [editForm, setEditForm] = useState({ name: '', status: 'active', password: '' })
  // Preview data
  const [previewData, setPreviewData] = useState<{ clients: any[], tasks: any[] } | null>(null)

  const loadFirms = useCallback(async (tok: string) => {
    const res = await fetch('/api/admin/firms', {
      headers: { authorization: `Bearer ${tok}` },
    })
    if (res.ok) {
      const json = await res.json()
      setFirms(json.firms || [])
    }
  }, [])

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (profile?.role !== 'admin') { router.push('/dashboard'); return }

      setToken(session.access_token)
      await loadFirms(session.access_token)
      setLoading(false)
    }
    init()
  }, [router, loadFirms])

  async function handleCreate() {
    if (!createForm.name || !createForm.email || !createForm.password) return
    setSaving(true)
    const res = await fetch('/api/admin/firms', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(createForm),
    })
    const json = await res.json()
    if (res.ok) {
      setActionMsg(`חשבון נוצר בהצלחה`)
      setCreateForm({ name: '', email: '', password: '' })
      setModal(null)
      await loadFirms(token)
    } else {
      setActionMsg(`שגיאה: ${json.error}`)
    }
    setSaving(false)
    setTimeout(() => setActionMsg(''), 4000)
  }

  async function handleEdit() {
    if (!selectedFirm) return
    setSaving(true)
    const body: any = { name: editForm.name, status: editForm.status }
    if (editForm.password) body.password = editForm.password
    const res = await fetch(`/api/admin/firms/${selectedFirm.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (res.ok) {
      setActionMsg('עודכן בהצלחה')
      setModal(null)
      await loadFirms(token)
    } else {
      setActionMsg(`שגיאה: ${json.error}`)
    }
    setSaving(false)
    setTimeout(() => setActionMsg(''), 4000)
  }

  async function handleDelete(firm: Firm) {
    if (!confirm(`למחוק את "${firm.name}"?\n\nכל הלקוחות והנתונים יימחקו לצמיתות.`)) return
    const res = await fetch(`/api/admin/firms/${firm.id}`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      setActionMsg(`"${firm.name}" נמחק`)
      await loadFirms(token)
    } else {
      const json = await res.json()
      setActionMsg(`שגיאה: ${json.error}`)
    }
    setTimeout(() => setActionMsg(''), 4000)
  }

  async function handleToggleStatus(firm: Firm) {
    const newStatus = firm.status === 'active' ? 'suspended' : 'active'
    const res = await fetch(`/api/admin/firms/${firm.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      setActionMsg(newStatus === 'active' ? 'חשבון הופעל' : 'חשבון הושהה')
      await loadFirms(token)
    }
    setTimeout(() => setActionMsg(''), 3000)
  }

  async function handlePreview(firm: Firm) {
    setSelectedFirm(firm)
    setPreviewData(null)
    setModal('preview')
    const res = await fetch(`/api/admin/firms/${firm.id}`, {
      headers: { authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (res.ok) setPreviewData({ clients: json.clients, tasks: json.tasks })
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center" dir="rtl">
        <div className="text-center text-slate-400">
          <div className="text-4xl mb-3 animate-pulse">⚖️</div>
          <p>טוען...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100" dir="rtl">
      {/* Header */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚖️</span>
          <div>
            <h1 className="font-bold text-lg">פאנל ניהול מערכת</h1>
            <p className="text-slate-400 text-xs">Legal CRM Admin</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-sm">{firms.length} משרדים רשומים</span>
          <button
            onClick={handleLogout}
            className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl text-sm transition"
          >
            יציאה
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {/* Action message */}
        {actionMsg && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm font-medium">
            {actionMsg}
          </div>
        )}

        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">חשבונות משרדים</h2>
          <button
            onClick={() => { setCreateForm({ name: '', email: '', password: '' }); setModal('create') }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition flex items-center gap-2"
          >
            <span>+</span> פתיחת חשבון חדש
          </button>
        </div>

        {/* Firms table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {firms.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <div className="text-4xl mb-3">🏢</div>
              <p className="font-medium">אין משרדים רשומים עדיין</p>
              <p className="text-sm mt-1">לחץ על "פתיחת חשבון חדש" להוספת משרד ראשון</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-right px-6 py-4 font-semibold text-slate-600">שם המשרד</th>
                  <th className="text-right px-6 py-4 font-semibold text-slate-600">מייל</th>
                  <th className="text-right px-6 py-4 font-semibold text-slate-600">לקוחות</th>
                  <th className="text-right px-6 py-4 font-semibold text-slate-600">תאריך יצירה</th>
                  <th className="text-right px-6 py-4 font-semibold text-slate-600">סטטוס</th>
                  <th className="text-right px-6 py-4 font-semibold text-slate-600">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {firms.map((firm) => (
                  <tr key={firm.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900">{firm.name}</td>
                    <td className="px-6 py-4 text-slate-600 text-xs">{firm.email}</td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg font-semibold text-xs">
                        {firm.clientCount} לקוחות
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(firm.created_at).toLocaleDateString('he-IL')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg font-semibold text-xs ${
                        firm.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {firm.status === 'active' ? 'פעיל' : 'מושהה'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* Preview */}
                        <button
                          onClick={() => handlePreview(firm)}
                          title="בצע בדיקה"
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition"
                        >
                          👁 בדיקה
                        </button>
                        {/* Edit */}
                        <button
                          onClick={() => {
                            setSelectedFirm(firm)
                            setEditForm({ name: firm.name, status: firm.status, password: '' })
                            setModal('edit')
                          }}
                          title="ערוך"
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-medium transition"
                        >
                          ✏️ עריכה
                        </button>
                        {/* Toggle status */}
                        <button
                          onClick={() => handleToggleStatus(firm)}
                          title={firm.status === 'active' ? 'השהה חשבון' : 'הפעל חשבון'}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                            firm.status === 'active'
                              ? 'bg-orange-50 hover:bg-orange-100 text-orange-700'
                              : 'bg-green-50 hover:bg-green-100 text-green-700'
                          }`}
                        >
                          {firm.status === 'active' ? '⏸ השהה' : '▶ הפעל'}
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(firm)}
                          title="מחק"
                          className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-medium transition"
                        >
                          🗑 מחק
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* === CREATE MODAL === */}
      {modal === 'create' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-5">פתיחת חשבון חדש</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">שם המשרד</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="משרד עורכי דין כהן ושות'"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">מייל העורך דין</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="lawyer@office.com"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">סיסמה ראשונית</label>
                <input
                  type="text"
                  value={createForm.password}
                  onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="לפחות 6 תווים"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-400 mt-1">העורך דין יוכל לשנות אחרי הכניסה</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreate}
                disabled={saving || !createForm.name || !createForm.email || !createForm.password}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-2.5 text-sm transition disabled:opacity-50"
              >
                {saving ? 'יוצר...' : 'צור חשבון'}
              </button>
              <button
                onClick={() => setModal(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === EDIT MODAL === */}
      {modal === 'edit' && selectedFirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-5">עריכת "{selectedFirm.name}"</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">שם המשרד</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">סטטוס</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">פעיל</option>
                  <option value="suspended">מושהה</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">סיסמה חדשה (אופציונלי)</label>
                <input
                  type="text"
                  value={editForm.password}
                  onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="השאר ריק אם לא לשנות"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleEdit}
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-2.5 text-sm transition disabled:opacity-50"
              >
                {saving ? 'שומר...' : 'שמור שינויים'}
              </button>
              <button
                onClick={() => setModal(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === PREVIEW MODAL === */}
      {modal === 'preview' && selectedFirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900">בדיקת "{selectedFirm.name}"</h3>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>

            {!previewData ? (
              <div className="text-center py-8 text-slate-400">
                <div className="text-3xl mb-2 animate-pulse">⏳</div>
                <p>טוען נתונים...</p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-700">{previewData.clients.length}</div>
                    <div className="text-xs text-blue-600 mt-1">לקוחות</div>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-700">
                      {previewData.clients.filter(c => c.status === 'active').length}
                    </div>
                    <div className="text-xs text-emerald-600 mt-1">תיקים פעילים</div>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-amber-700">{previewData.tasks.length}</div>
                    <div className="text-xs text-amber-600 mt-1">משימות</div>
                  </div>
                </div>

                {/* Clients list */}
                <div>
                  <h4 className="font-semibold text-slate-700 mb-3 text-sm">לקוחות אחרונים</h4>
                  {previewData.clients.length === 0 ? (
                    <p className="text-slate-400 text-sm">אין לקוחות עדיין</p>
                  ) : (
                    <div className="space-y-2">
                      {previewData.clients.slice(0, 5).map(c => (
                        <div key={c.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5">
                          <div>
                            <p className="font-medium text-sm text-slate-900">{c.name}</p>
                            <p className="text-xs text-slate-500">{c.field} · {c.phone}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
                            c.status === 'active' ? 'bg-green-100 text-green-700' :
                            c.status === 'completed' ? 'bg-slate-100 text-slate-600' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {c.status === 'active' ? 'פעיל' : c.status === 'completed' ? 'הושלם' : 'הקמה'}
                          </span>
                        </div>
                      ))}
                      {previewData.clients.length > 5 && (
                        <p className="text-xs text-slate-400 text-center pt-1">
                          +{previewData.clients.length - 5} לקוחות נוספים
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
