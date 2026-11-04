'use client'

import { useState, useEffect } from 'react'
import { CASE_STATUSES, getStatus } from '@/lib/statuses'

type Doc = { id: string; name: string; url: string; createdAt: string }

type Case = {
  id: string
  title: string
  insuranceCompany: string
  clientPhone: string
  status: string
  notes: string
  createdAt: string
  Client: { name: string; phone: string; email: string }
  Document: Doc[]
}

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [form, setForm] = useState({
    clientName: '', clientPhone: '', clientEmail: '',
    title: '', insuranceCompany: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadCases() }, [])

  async function loadCases() {
    const res = await fetch('/api/cases')
    const data = await res.json()
    setCases(data.cases || [])
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setForm({ clientName: '', clientPhone: '', clientEmail: '', title: '', insuranceCompany: '' })
    setShowForm(false)
    setLoading(false)
    loadCases()
  }

  async function updateStatus(id: string, status: string) {
    await fetch('/api/cases', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    loadCases()
  }

  const filtered = filterStatus === 'all' ? cases : cases.filter(c => c.status === filterStatus)

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ניהול תיקים</h1>
            <p className="text-gray-500 text-sm mt-1">{cases.length} תיקים סה"כ</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-black text-white px-5 py-2.5 rounded-xl hover:bg-gray-800 font-medium"
          >
            + תיק חדש
          </button>
        </div>

        {/* טופס תיק חדש */}
        {showForm && (
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">פרטי התיק החדש</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                placeholder="חברת הביטוח *" />
              <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                className="md:col-span-2 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="תיאור התיק (כתובת נכס / מספר תיק) *" />
              <div className="md:col-span-2 flex gap-3">
                <button type="submit" disabled={loading}
                  className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 disabled:opacity-50">
                  {loading ? 'יוצר...' : 'יצירת תיק'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="border border-gray-200 px-6 py-3 rounded-xl hover:bg-gray-50">
                  ביטול
                </button>
              </div>
            </form>
          </div>
        )}

        {/* פילטר סטטוס */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filterStatus === 'all' ? 'bg-black text-white' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}
          >
            הכל ({cases.length})
          </button>
          {CASE_STATUSES.map(s => {
            const count = cases.filter(c => c.status === s.id).length
            if (count === 0) return null
            return (
              <button key={s.id}
                onClick={() => setFilterStatus(s.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filterStatus === s.id ? 'bg-black text-white' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}
              >
                {s.label} ({count})
              </button>
            )
          })}
        </div>

        {/* רשימת תיקים */}
        <div className="space-y-3">
          {filtered.map(c => {
            const status = getStatus(c.status)
            return (
              <div key={c.id} className="bg-white rounded-xl border shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(c.createdAt).toLocaleDateString('he-IL')}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mt-2">{c.title}</h3>
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>לקוח: {c.Client?.name}</span>
                      {c.insuranceCompany && <span>חברה: {c.insuranceCompany}</span>}
                      {c.clientPhone && <span>📞 {c.clientPhone}</span>}
                    </div>
                    {c.notes && (
                      <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-sm text-yellow-800">
                        💬 {c.notes}
                      </div>
                    )}
                    {c.Document?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {c.Document.map(doc => (
                          <button key={doc.id}
                            onClick={async () => {
                              const urlPath = doc.url.split('/documents/')[1]
                              const res = await fetch(`/api/documents/signed-url?path=${encodeURIComponent(urlPath)}`)
                              const data = await res.json()
                              if (data.url) {
                                const a = document.createElement('a')
                                a.href = data.url
                                a.target = '_blank'
                                a.rel = 'noreferrer'
                                document.body.appendChild(a)
                                a.click()
                                document.body.removeChild(a)
                              }
                            }}
                            className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs px-3 py-1.5 rounded-lg hover:bg-blue-100">
                            📎 {doc.name || 'מסמך'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* שינוי סטטוס */}
                  <select
                    value={c.status}
                    onChange={e => updateStatus(c.id, e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
                  >
                    {CASE_STATUSES.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              אין תיקים להצגה
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
