'use client'

import { useState, useEffect } from 'react'
import { getStatus } from '@/lib/statuses'
import DropZone from '@/components/DropZone'

type Case = {
  id: string
  title: string
  status: string
  showStatusToCompany: boolean
  createdAt: string
  Client: { name: string }
}

export default function PortalPage() {
  const [authed, setAuthed] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [cases, setCases] = useState<Case[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ clientName: '', clientPhone: '', clientEmail: '', title: '', insuranceCompany: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [uploadingCaseId, setUploadingCaseId] = useState<string | null>(null)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])

  useEffect(() => {
    fetch('/api/portal/cases').then(r => {
      if (r.ok) { setAuthed(true); r.json().then(d => setCases(d.cases)) }
    })
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/auth/portal-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginForm),
    })
    if (res.ok) {
      setAuthed(true)
      loadCases()
    } else {
      const d = await res.json()
      setLoginError(d.error)
    }
  }

  async function loadCases() {
    const res = await fetch('/api/portal/cases')
    const data = await res.json()
    setCases(data.cases || [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/portal/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const data = await res.json()
      const caseId = data.case?.id

      // העלה קבצים שצורפו
      if (caseId && pendingFiles.length > 0) {
        for (const file of pendingFiles) {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('caseId', caseId)
          await fetch('/api/portal/upload', { method: 'POST', body: formData })
        }
      }

      setForm({ clientName: '', clientPhone: '', clientEmail: '', title: '', insuranceCompany: '', notes: '' })
      setPendingFiles([])
      setShowForm(false)
      loadCases()
    }
    setLoading(false)
  }

  if (!authed) {
    return (
      <main className="min-h-screen flex" dir="rtl">
        <div className="hidden lg:flex w-1/2 bg-black items-center justify-center p-12">
          <div className="text-white space-y-4">
            <h1 className="text-5xl font-bold tracking-tight">LawCRM</h1>
            <p className="text-gray-400 text-xl">פורטל חברות ביטוח</p>
            <div className="mt-8 space-y-3 text-gray-400 text-sm">
              <div className="flex items-center gap-3"><span className="text-white">✦</span><span>העלאת תיקים חדשים בקלות</span></div>
              <div className="flex items-center gap-3"><span className="text-white">✦</span><span>מעקב אחר סטטוס הטיפול</span></div>
              <div className="flex items-center gap-3"><span className="text-white">✦</span><span>תקשורת ישירה עם המשרד</span></div>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center bg-gray-50 p-8">
          <div className="w-full max-w-md space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">כניסה לפורטל</h2>
              <p className="mt-2 text-gray-500">לנציגי חברות ביטוח</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="email" required value={loginForm.email}
                onChange={e => setLoginForm({...loginForm, email: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="אימייל" />
              <input type="password" required value={loginForm.password}
                onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="סיסמה" />
              {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
              <button type="submit" className="w-full bg-black text-white py-3.5 rounded-xl hover:bg-gray-800 font-medium">
                כניסה
              </button>
            </form>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">פורטל הגשת תיקים</h1>
            <p className="text-gray-400 text-sm mt-1">{cases.length} תיקים הוגשו</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-black text-white px-5 py-2.5 rounded-xl hover:bg-gray-800 font-medium">
            + תיק חדש
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">פרטי התיק</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input required value={form.clientName} onChange={e => setForm({...form, clientName: e.target.value})}
                className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="שם הלקוח *" />
              <input required value={form.clientPhone} onChange={e => setForm({...form, clientPhone: e.target.value})}
                className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="טלפון הלקוח *" />
              <input value={form.clientEmail} onChange={e => setForm({...form, clientEmail: e.target.value})}
                className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="אימייל הלקוח" />
              <input required value={form.insuranceCompany} onChange={e => setForm({...form, insuranceCompany: e.target.value})}
                className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="שם חברת הביטוח *" />
              <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                className="md:col-span-2 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="תיאור התיק / כתובת הנכס *" />
              <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                className="md:col-span-2 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black resize-none"
                rows={3}
                placeholder="הערות נוספות (אופציונלי)" />
              {/* העלאת מסמכים */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">מסמכים (אופציונלי)</label>
                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault()
                    const files = Array.from(e.dataTransfer.files)
                    setPendingFiles(prev => [...prev, ...files])
                  }}
                  onClick={() => document.getElementById('portalFileInput')?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                >
                  <input id="portalFileInput" type="file" multiple className="hidden"
                    onChange={e => setPendingFiles(prev => [...prev, ...Array.from(e.target.files || [])])} />
                  <p className="text-gray-400 text-sm">📎 גרור קבצים לכאן או לחץ לבחירה</p>
                </div>
                {pendingFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {pendingFiles.map((f, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                        <span className="text-gray-700 truncate">{f.name}</span>
                        <button type="button" onClick={() => setPendingFiles(prev => prev.filter((_, j) => j !== i))}
                          className="text-gray-400 hover:text-red-500 mr-2">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="md:col-span-2 flex gap-3">
                <button type="submit" disabled={loading}
                  className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 disabled:opacity-50">
                  {loading ? 'שולח...' : 'שליחת התיק'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="border border-gray-200 px-6 py-3 rounded-xl hover:bg-gray-50">
                  ביטול
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-3">
          {cases.map(c => {
            const status = getStatus(c.status)
            const isUploading = uploadingCaseId === c.id
            return (
              <div key={c.id} className="bg-white rounded-xl border shadow-sm p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-gray-900">{c.title}</h3>
                    <p className="text-sm text-gray-500">לקוח: {c.Client?.name}</p>
                    <p className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString('he-IL')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setUploadingCaseId(isUploading ? null : c.id)}
                      className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-gray-600"
                    >
                      📎 הוסף מסמך
                    </button>
                    {c.showStatusToCompany ? (
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-400">
                        בטיפול
                      </span>
                    )}
                  </div>
                </div>
                {isUploading && (
                  <DropZone caseId={c.id} onUploaded={() => setUploadingCaseId(null)} />
                )}
              </div>
            )
          })}
          {cases.length === 0 && (
            <div className="text-center py-16 text-gray-400">אין תיקים עדיין</div>
          )}
        </div>
      </div>
    </main>
  )
}
