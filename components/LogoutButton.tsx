'use client'

import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full text-right text-gray-400 hover:text-white text-sm px-4 py-2 rounded-xl hover:bg-white/10 transition-colors"
    >
      התנתקות
    </button>
  )
}
