'use client'

import { useState, useEffect } from 'react'

type Agent = {
  id: string
  name: string
  email: string
  companyName: string
  createdAt: string
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [form, setForm] = useState({ name: '', email: '', password: '', companyName: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { loadAgents() }, [])

  async function loadAgents() {
    const res = await fetch('/api/agents')
    const data = await res.json()
    setAgents(data.agents || [])
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const res = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      setSuccess(`הסוכן "${form.name}" נוצר בהצלחה!`)
      setForm({ name: '', email: '', password: '', companyName: '' })
      loadAgents()
    } else {
      const d = await res.json()
      setError(d.error)
    }
    setLoading(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`למחוק את "${name}"?`)) return
    await fetch(`/api/agents?id=${id}`, { method: 'DELETE' })
    loadAgents()
  }

  return (
    <div className="p-8 space-y-8" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">נציגי חברות ביטוח</h1>
        <p className="text-gray-400 text-sm mt-1">ניהול גישה לפורטל הגשת תיקים</p>
      </div>

      {/* טופס הוספה */}
      <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">הוספת נציג חדש</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
            className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="שם הנציג *" />
          <input required value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})}
            className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="שם חברת הביטוח *" />
          <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})}
            className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="אימייל *" />
          <input required value={form.password} onChange={e => setForm({...form, password: e.target.value})}
            className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="סיסמה ראשונית *" />
          <button type="submit" disabled={loading}
            className="md:col-span-2 bg-black text-white py-3 rounded-xl hover:bg-gray-800 disabled:opacity-50 font-medium">
            {loading ? 'יוצר...' : 'הוסף נציג'}
          </button>
        </form>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}
      </div>

      {/* רשימת נציגים */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-right px-6 py-4 font-medium text-gray-600">שם הנציג</th>
              <th className="text-right px-6 py-4 font-medium text-gray-600">חברת ביטוח</th>
              <th className="text-right px-6 py-4 font-medium text-gray-600">אימייל</th>
              <th className="text-right px-6 py-4 font-medium text-gray-600">תאריך הוספה</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {agents.map(a => (
              <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{a.name}</td>
                <td className="px-6 py-4 text-gray-500">{a.companyName}</td>
                <td className="px-6 py-4 text-gray-400">{a.email}</td>
                <td className="px-6 py-4 text-gray-400">{new Date(a.createdAt).toLocaleDateString('he-IL')}</td>
                <td className="px-6 py-4 text-left">
                  <button onClick={() => handleDelete(a.id, a.name)} className="text-red-500 hover:text-red-700 text-xs">
                    מחיקה
                  </button>
                </td>
              </tr>
            ))}
            {agents.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">אין נציגים עדיין</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
