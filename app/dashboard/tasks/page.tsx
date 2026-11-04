'use client'

import { useState, useEffect } from 'react'

type Task = {
  id: string
  title: string
  dueDate: string | null
  caseTitle: string | null
  status: 'active' | 'due' | 'completed' | 'cancelled'
  createdAt: string
}

const STATUSES = [
  { id: 'active',    label: 'פעילה',           color: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500' },
  { id: 'due',       label: 'הגיע הזמן לטפל',  color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  { id: 'completed', label: 'הושלמה',          color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  { id: 'cancelled', label: 'בוטלה',           color: 'bg-gray-100 text-gray-400',   dot: 'bg-gray-400' },
]

function getStatus(id: string) {
  return STATUSES.find(s => s.id === id) ?? STATUSES[0]
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState({ title: '', dueDate: '', caseTitle: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadTasks() }, [])

  async function loadTasks() {
    const res = await fetch('/api/tasks')
    const data = await res.json()
    setTasks(data.tasks || [])
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setForm({ title: '', dueDate: '', caseTitle: '' })
    setShowForm(false)
    setLoading(false)
    loadTasks()
  }

  async function updateStatus(id: string, status: string) {
    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    loadTasks()
  }

  async function deleteTask(id: string) {
    if (!confirm('למחוק משימה זו?')) return
    await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' })
    loadTasks()
  }

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)
  const activeCount = tasks.filter(t => t.status === 'active' || t.status === 'due').length

  return (
    <div className="p-8 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">משימות</h1>
          <p className="text-gray-400 text-sm mt-1">{activeCount} משימות פעילות</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-black text-white px-5 py-2.5 rounded-xl hover:bg-gray-800 font-medium">
          + משימה חדשה
        </button>
      </div>

      {/* טופס */}
      {showForm && (
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">משימה חדשה</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              className="md:col-span-3 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="תיאור המשימה *" />
            <input value={form.caseTitle} onChange={e => setForm({...form, caseTitle: e.target.value})}
              className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="קשור לתיק (אופציונלי)" />
            <input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})}
              className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black text-gray-700" />
            <div className="flex gap-3">
              <button type="submit" disabled={loading}
                className="flex-1 bg-black text-white py-3 rounded-xl hover:bg-gray-800 disabled:opacity-50">
                {loading ? 'שומר...' : 'שמור'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="border border-gray-200 px-4 py-3 rounded-xl hover:bg-gray-50">
                ביטול
              </button>
            </div>
          </form>
        </div>
      )}

      {/* פילטרים */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === 'all' ? 'bg-black text-white' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}>
          הכל ({tasks.length})
        </button>
        {STATUSES.map(s => {
          const count = tasks.filter(t => t.status === s.id).length
          return (
            <button key={s.id} onClick={() => setFilter(s.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === s.id ? 'bg-black text-white' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}>
              {s.label} ({count})
            </button>
          )
        })}
      </div>

      {/* רשימת משימות */}
      <div className="space-y-3">
        {filtered.map(t => {
          const s = getStatus(t.status)
          const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status === 'active'
          return (
            <div key={t.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${isOverdue ? 'border-orange-300' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                    <p className={`font-medium ${t.status === 'completed' || t.status === 'cancelled' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {t.title}
                    </p>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-400 pr-4">
                    {t.caseTitle && <span>📁 {t.caseTitle}</span>}
                    {t.dueDate && (
                      <span className={isOverdue ? 'text-orange-500 font-medium' : ''}>
                        📅 {new Date(t.dueDate).toLocaleDateString('he-IL')}
                        {isOverdue && ' — באיחור!'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select value={t.status} onChange={e => updateStatus(t.id, e.target.value)}
                    className={`text-xs px-3 py-1.5 rounded-xl border-0 font-medium focus:outline-none focus:ring-2 focus:ring-black cursor-pointer ${s.color}`}>
                    {STATUSES.map(st => (
                      <option key={st.id} value={st.id}>{st.label}</option>
                    ))}
                  </select>
                  <button onClick={() => deleteTask(t.id)} className="text-gray-300 hover:text-red-500 text-lg">
                    ×
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">אין משימות</div>
        )}
      </div>
    </div>
  )
}
