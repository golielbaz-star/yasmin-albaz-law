'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { getStatus } from '@/lib/statuses'

type Meeting = {
  id: string
  date: string
  notes: string
  createdAt: string
}

type Form = {
  id: string
  name: string
  type: string
  url: string
  createdAt: string
}

type ClientData = {
  id: string
  name: string
  phone: string
  email: string
  cases: { id: string; title: string; status: string; insuranceCompany: string; clientPhone: string; notes: string }[]
}

type Task = {
  id: string
  title: string
  status: string
  dueDate: string | null
  caseTitle: string | null
}

const FORM_TYPES = ['הסכם שכר טירחה', 'ייפוי כוח', 'אישור', 'חוזה', 'אחר']

export default function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = use(params)
  const router = useRouter()
  const [tab, setTab] = useState<'details' | 'meetings' | 'tasks' | 'forms'>('details')
  const [client, setClient] = useState<ClientData | null>(null)
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [forms, setForms] = useState<Form[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  // פגישה חדשה
  const [showMeetingForm, setShowMeetingForm] = useState(false)
  const [meetingForm, setMeetingForm] = useState({ date: '', notes: '' })
  const [savingMeeting, setSavingMeeting] = useState(false)

  // טופס חדש
  const [showFormUpload, setShowFormUpload] = useState(false)
  const [formFile, setFormFile] = useState<File | null>(null)
  const [formType, setFormType] = useState('הסכם שכר טירחה')
  const [uploadingForm, setUploadingForm] = useState(false)

  useEffect(() => {
    loadAll()
  }, [clientId])

  async function loadAll() {
    setLoading(true)
    const [clientsRes, meetingsRes, formsRes, tasksRes] = await Promise.all([
      fetch('/api/clients'),
      fetch(`/api/clients/${clientId}/meetings`),
      fetch(`/api/clients/${clientId}/forms`),
      fetch('/api/tasks'),
    ])

    const clientsData = await clientsRes.json()
    const found = clientsData.clients?.find((c: ClientData) => c.id === clientId)
    setClient(found || null)

    const meetingsData = await meetingsRes.json()
    setMeetings(meetingsData.meetings || [])

    const formsData = await formsRes.json()
    setForms(formsData.forms || [])

    const tasksData = await tasksRes.json()
    const caseId = found?.cases?.[0]?.id
    const clientTasks = (tasksData.tasks || []).filter((t: Task) =>
      found?.cases?.some((c: any) => c.id === t.caseTitle || t.caseTitle === found?.cases?.[0]?.title)
    )
    setTasks(tasksData.tasks || [])
    setLoading(false)
  }

  async function addMeeting(e: React.FormEvent) {
    e.preventDefault()
    setSavingMeeting(true)
    await fetch(`/api/clients/${clientId}/meetings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(meetingForm),
    })
    setMeetingForm({ date: '', notes: '' })
    setShowMeetingForm(false)
    setSavingMeeting(false)
    const res = await fetch(`/api/clients/${clientId}/meetings`)
    const data = await res.json()
    setMeetings(data.meetings || [])
  }

  async function deleteMeeting(meetingId: string) {
    if (!confirm('למחוק פגישה זו?')) return
    await fetch(`/api/clients/${clientId}/meetings?meetingId=${meetingId}`, { method: 'DELETE' })
    setMeetings(prev => prev.filter(m => m.id !== meetingId))
  }

  async function uploadForm(e: React.FormEvent) {
    e.preventDefault()
    if (!formFile) return
    setUploadingForm(true)
    const fd = new FormData()
    fd.append('file', formFile)
    fd.append('type', formType)
    await fetch(`/api/clients/${clientId}/forms`, { method: 'POST', body: fd })
    setFormFile(null)
    setShowFormUpload(false)
    setUploadingForm(false)
    const res = await fetch(`/api/clients/${clientId}/forms`)
    const data = await res.json()
    setForms(data.forms || [])
  }

  async function deleteForm(formId: string) {
    if (!confirm('למחוק טופס זה?')) return
    await fetch(`/api/clients/${clientId}/forms?formId=${formId}`, { method: 'DELETE' })
    setForms(prev => prev.filter(f => f.id !== formId))
  }

  if (loading) return <div dir="rtl" className="p-8 text-gray-400">טוען...</div>
  if (!client) return <div dir="rtl" className="p-8 text-gray-400">לקוח לא נמצא</div>

  const mainCase = client.cases?.[0]
  const status = mainCase ? getStatus(mainCase.status) : null

  const tabs = [
    { id: 'details', label: 'פרטי לקוח', icon: '👤' },
    { id: 'meetings', label: 'ריכוז פגישות', icon: '📅' },
    { id: 'tasks', label: 'משימות', icon: '✓' },
    { id: 'forms', label: 'טפסים', icon: '📄' },
  ] as const

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => router.push('/dashboard/clients')} className="text-sm text-gray-400 hover:text-gray-600 mb-3 flex items-center gap-1">
            → חזרה ללקוחות
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-bold text-lg">
              {client.name?.[0] || '?'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{client.name}</h1>
              <div className="flex gap-4 text-sm text-gray-500 mt-0.5">
                {client.phone && <span>📞 {client.phone}</span>}
                {client.email && <span>✉️ {client.email}</span>}
              </div>
            </div>
            {status && (
              <span className={`mr-auto px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                {status.label}
              </span>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t.id ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">

        {/* פרטי לקוח */}
        {tab === 'details' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
              <h2 className="font-semibold text-gray-800 text-lg">פרטים אישיים</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">שם מלא</p>
                  <p className="font-medium text-gray-900">{client.name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">טלפון</p>
                  <p className="font-medium text-gray-900">{client.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">אימייל</p>
                  <p className="font-medium text-gray-900">{client.email || '—'}</p>
                </div>
              </div>
            </div>

            {client.cases.map(c => {
              const s = getStatus(c.status)
              return (
                <div key={c.id} className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-gray-800 text-lg">פרטי התיק</h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">שם התיק</p>
                      <p className="font-medium text-gray-900">{c.title || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">חברת ביטוח</p>
                      <p className="font-medium text-gray-900">{c.insuranceCompany || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">טלפון</p>
                      <p className="font-medium text-gray-900">{c.clientPhone || '—'}</p>
                    </div>
                    {c.notes && (
                      <div className="md:col-span-2">
                        <p className="text-xs text-gray-400 mb-1">הערות</p>
                        <p className="font-medium text-gray-900">{c.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ריכוז פגישות */}
        {tab === 'meetings' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-gray-800">פגישות ({meetings.length})</h2>
              <button
                onClick={() => setShowMeetingForm(true)}
                className="bg-black text-white px-4 py-2 rounded-xl text-sm hover:bg-gray-800"
              >
                + פגישה חדשה
              </button>
            </div>

            {showMeetingForm && (
              <div className="bg-white rounded-xl border shadow-sm p-5">
                <form onSubmit={addMeeting} className="space-y-3">
                  <input
                    type="date"
                    required
                    value={meetingForm.date}
                    onChange={e => setMeetingForm({ ...meetingForm, date: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <textarea
                    value={meetingForm.notes}
                    onChange={e => setMeetingForm({ ...meetingForm, notes: e.target.value })}
                    placeholder="תיעוד הפגישה..."
                    rows={4}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black resize-none"
                  />
                  <div className="flex gap-3">
                    <button type="submit" disabled={savingMeeting}
                      className="bg-black text-white px-5 py-2 rounded-xl text-sm hover:bg-gray-800 disabled:opacity-50">
                      {savingMeeting ? 'שומר...' : 'שמור פגישה'}
                    </button>
                    <button type="button" onClick={() => setShowMeetingForm(false)}
                      className="border border-gray-200 px-5 py-2 rounded-xl text-sm hover:bg-gray-50">
                      ביטול
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-3">
              {meetings.map(m => (
                <div key={m.id} className="bg-white rounded-xl border shadow-sm p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📅</span>
                        <p className="font-semibold text-gray-900">
                          {new Date(m.date).toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                      {m.notes && (
                        <p className="text-gray-600 text-sm whitespace-pre-wrap mr-7">{m.notes}</p>
                      )}
                    </div>
                    <button onClick={() => deleteMeeting(m.id)} className="text-gray-300 hover:text-red-500 text-sm mr-2">
                      מחק
                    </button>
                  </div>
                </div>
              ))}
              {meetings.length === 0 && !showMeetingForm && (
                <div className="text-center py-12 text-gray-400">אין פגישות רשומות עדיין</div>
              )}
            </div>
          </div>
        )}

        {/* משימות */}
        {tab === 'tasks' && (
          <div className="space-y-3">
            <h2 className="font-semibold text-gray-800">משימות</h2>
            {tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').map(t => (
              <div key={t.id} className="bg-white rounded-xl border shadow-sm p-4 flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${t.status === 'due' ? 'bg-red-500' : 'bg-blue-500'}`} />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{t.title}</p>
                  {t.dueDate && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(t.dueDate).toLocaleDateString('he-IL')}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length === 0 && (
              <div className="text-center py-12 text-gray-400">אין משימות פתוחות</div>
            )}
          </div>
        )}

        {/* טפסים */}
        {tab === 'forms' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-gray-800">טפסים ({forms.length})</h2>
              <button
                onClick={() => setShowFormUpload(true)}
                className="bg-black text-white px-4 py-2 rounded-xl text-sm hover:bg-gray-800"
              >
                + העלאת טופס
              </button>
            </div>

            {showFormUpload && (
              <div className="bg-white rounded-xl border shadow-sm p-5">
                <form onSubmit={uploadForm} className="space-y-3">
                  <select
                    value={formType}
                    onChange={e => setFormType(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black bg-white"
                  >
                    {FORM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input
                    type="file"
                    required
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={e => setFormFile(e.target.files?.[0] || null)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm"
                  />
                  <div className="flex gap-3">
                    <button type="submit" disabled={uploadingForm || !formFile}
                      className="bg-black text-white px-5 py-2 rounded-xl text-sm hover:bg-gray-800 disabled:opacity-50">
                      {uploadingForm ? 'מעלה...' : 'העלה'}
                    </button>
                    <button type="button" onClick={() => setShowFormUpload(false)}
                      className="border border-gray-200 px-5 py-2 rounded-xl text-sm hover:bg-gray-50">
                      ביטול
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-3">
              {forms.map(f => (
                <div key={f.id} className="bg-white rounded-xl border shadow-sm p-4 flex items-center gap-3">
                  <span className="text-2xl">📄</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{f.name}</p>
                    <div className="flex gap-3 items-center mt-0.5">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{f.type}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(f.createdAt).toLocaleDateString('he-IL')}
                      </span>
                    </div>
                  </div>
                  <a href={f.url} target="_blank" rel="noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    פתח
                  </a>
                  <button onClick={() => deleteForm(f.id)} className="text-gray-300 hover:text-red-500 text-sm">
                    מחק
                  </button>
                </div>
              ))}
              {forms.length === 0 && !showFormUpload && (
                <div className="text-center py-12 text-gray-400">אין טפסים עדיין</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
