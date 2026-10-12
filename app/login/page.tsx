'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password })

    if (loginError || !data.user) {
      setError('מייל או סיסמה שגויים')
      setLoading(false)
      return
    }

    // Check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profile?.role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⚖️</div>
          <h1 className="text-2xl font-bold text-white">מערכת ניהול משרד עו&quot;ד</h1>
          <p className="text-slate-400 text-sm mt-1">התחבר לחשבון שלך</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">כתובת מייל</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="office@example.com"
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">סיסמה</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-3 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'מתחבר...' : 'כניסה למערכת'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          מערכת CRM לעורכי דין · Legal CRM
        </p>
      </div>
    </div>
  )
}
