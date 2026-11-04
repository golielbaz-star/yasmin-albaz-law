'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Office = {
  id: string
  name: string
  email: string
  createdAt: string
}

export default function AdminPage() {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  const [adminPass, setAdminPass] = useState('')
  const [offices, setOffices] = useState<Office[]>([])
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: adminPass }),
    })
    if (res.ok) {
      setAuthed(true)
      loadOffices()
    } else {
      setError('סיסמה שגויה')
    }
  }

  async function loadOffices() {
    const res = await fetch('/api/admin/offices')
    const data = await res.json()
    setOffices(data.offices || [])
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const res = await fetch('/api/admin/offices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'שגיאה')
      setLoading(false)
      return
    }

    setSuccess(`המשרד "${form.name}" נוצר בהצלחה!`)
    setForm({ name: '', email: '', password: '' })
    loadOffices()
    setLoading(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`למחוק את "${name}"?`)) return
    await fetch(`/api/admin/offices?id=${id}`, { method: 'DELETE' })
    loadOffices()
  }

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">פאנל ניהול</h1>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <input
              type="password"
              required
              value={adminPass}
              onChange={e => setAdminPass(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="סיסמת מנהל"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800">
              כניסה
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">פאנל ניהול</h1>
          <span className="text-gray-400 text-sm">{offices.length} משרדים פעילים</span>
        </div>

        {/* יצירת משרד חדש */}
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">פתיחת משרד חדש</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="שם המשרד"
            />
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="אימייל"
            />
            <input
              type="text"
              required
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="סיסמה ראשונית"
            />
            <button
              type="submit"
              disabled={loading}
              className="md:col-span-3 bg-black text-white py-3 rounded-xl hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? 'יוצר...' : 'צור משרד'}
            </button>
          </form>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}
        </div>

        {/* רשימת משרדים */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-right px-6 py-4 font-medium text-gray-600">שם המשרד</th>
                <th className="text-right px-6 py-4 font-medium text-gray-600">אימייל</th>
                <th className="text-right px-6 py-4 font-medium text-gray-600">תאריך הצטרפות</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {offices.map(office => (
                <tr key={office.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{office.name}</td>
                  <td className="px-6 py-4 text-gray-500">{office.email}</td>
                  <td className="px-6 py-4 text-gray-400">
                    {new Date(office.createdAt).toLocaleDateString('he-IL')}
                  </td>
                  <td className="px-6 py-4 text-left">
                    <button
                      onClick={() => handleDelete(office.id, office.name)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      מחיקה
                    </button>
                  </td>
                </tr>
              ))}
              {offices.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                    אין משרדים עדיין
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
