import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/firebase-admin'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import NotificationBell from '@/components/NotificationBell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const officeId = cookieStore.get('officeId')?.value
  if (!officeId) redirect('/login')

  const officeDoc = await db.collection('offices').doc(officeId).get()
  if (!officeDoc.exists) redirect('/login')

  const office = officeDoc.data() as { name: string }

  return (
    <div className="min-h-screen flex bg-gray-50" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 bg-black text-white flex flex-col fixed h-full">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-bold tracking-tight">LawCRM</h1>
          <p className="text-gray-400 text-xs mt-1 truncate">{office.name}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition-colors text-sm">
            <span>📊</span> לוח בקרה
          </Link>
          <Link href="/dashboard/cases" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition-colors text-sm">
            <span>📁</span> תיקים
          </Link>
          <Link href="/dashboard/clients" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition-colors text-sm">
            <span>👤</span> לקוחות
          </Link>
          <Link href="/dashboard/tasks" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition-colors text-sm">
            <span>✓</span> משימות
          </Link>
          <Link href="/dashboard/agents" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition-colors text-sm">
            <span>🏢</span> נציגי ביטוח
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10 space-y-1">
          <NotificationBell />
          <LogoutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 mr-64 min-h-screen">
        {children}
      </main>
    </div>
  )
}
