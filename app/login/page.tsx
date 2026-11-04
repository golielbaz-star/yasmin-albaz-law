'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'שגיאה בהתחברות')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen flex" dir="rtl">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-black items-center justify-center p-12">
        <div className="text-white space-y-4">
          <h1 className="text-5xl font-bold tracking-tight">LawCRM</h1>
          <p className="text-gray-400 text-xl">ניהול חכם. עבודה יעילה.</p>
          <div className="mt-12 space-y-4 text-gray-400 text-sm">
            <div className="flex items-center gap-3">
              <span className="text-white text-lg">✦</span>
              <span>ניהול לקוחות ותיקים במקום אחד</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white text-lg">✦</span>
              <span>תזכורות ומשימות אוטומטיות</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white text-lg">✦</span>
              <span>גישה מכל מקום ובכל זמן</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">התחברות למשרד</h2>
            <p className="mt-2 text-gray-500">ברוכים השבים למערכת</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">כתובת אימייל</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-black shadow-sm text-gray-900"
                placeholder="office@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">סיסמה</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-black shadow-sm text-gray-900"
                placeholder="הכנס סיסמה"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3.5 rounded-xl hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 shadow-sm"
            >
              {loading ? 'מתחבר...' : 'התחברות'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500">
            אין לך חשבון?{' '}
            <Link href="/register" className="text-black font-semibold hover:underline">
              הרשמה
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
