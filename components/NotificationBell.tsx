'use client'

import { useState, useEffect, useRef } from 'react'

type Notification = {
  id: string
  type: 'new_case' | 'task'
  title: string
  subtitle?: string
  time: string
}

type Toast = Notification

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const lastCaseCountRef = useRef<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function check() {
      const casesRes = await fetch('/api/cases')
      if (casesRes.ok) {
        const { cases } = await casesRes.json()
        if (lastCaseCountRef.current === null) {
          lastCaseCountRef.current = cases.length
        } else if (cases.length > lastCaseCountRef.current) {
          const newCount = cases.length - lastCaseCountRef.current
          for (let i = 0; i < newCount; i++) {
            const c = cases[i]
            const notif: Notification = {
              id: `case-${c.id}-${Date.now()}`,
              type: 'new_case',
              title: 'תיק חדש התקבל',
              subtitle: c.title,
              time: 'עכשיו',
            }
            setNotifications(prev => [notif, ...prev])
            setToasts(prev => [notif, ...prev])
          }
          lastCaseCountRef.current = cases.length
        }
      }

      const tasksRes = await fetch('/api/tasks')
      if (tasksRes.ok) {
        const { tasks } = await tasksRes.json()
        const today = new Date().toDateString()
        const dueTasks = tasks.filter((t: any) =>
          t.dueDate && new Date(t.dueDate).toDateString() === today && !t.done
        )
        setNotifications(prev => {
          const existingIds = new Set(prev.map(n => n.id))
          const newOnes: Notification[] = dueTasks
            .filter((t: any) => !existingIds.has(`task-${t.id}`))
            .map((t: any) => ({
              id: `task-${t.id}`,
              type: 'task' as const,
              title: 'משימה להיום',
              subtitle: t.title,
              time: 'היום',
            }))
          return [...newOnes, ...prev]
        })
      }
    }

    check()
    const interval = setInterval(check, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function dismiss(id: string) {
    setNotifications(prev => prev.filter(n => n.id !== id))
    setToasts(prev => prev.filter(n => n.id !== id))
  }

  return (
    <>
      {/* פעמון */}
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="relative flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition-colors text-sm"
        >
          <span className="text-lg">🔔</span>
          <span>התראות</span>
          {notifications.length > 0 && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {notifications.length > 9 ? '9+' : notifications.length}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute bottom-14 right-0 w-80 bg-white rounded-2xl shadow-2xl border overflow-hidden z-50" dir="rtl">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold text-gray-900 text-sm">התראות ({notifications.length})</h3>
              {notifications.length > 0 && (
                <button onClick={() => setNotifications([])} className="text-xs text-gray-400 hover:text-gray-600">
                  נקה הכל
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm">אין התראות</div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className="px-4 py-3 border-b last:border-0 hover:bg-gray-50 flex items-start gap-3">
                    <span className="text-lg mt-0.5">{n.type === 'new_case' ? '📁' : '✅'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{n.title}</p>
                      {n.subtitle && <p className="text-xs text-gray-500 truncate mt-0.5">{n.subtitle}</p>}
                      <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                    </div>
                    <button onClick={() => dismiss(n.id)} className="text-gray-300 hover:text-gray-600 text-lg leading-none mt-0.5">
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* פופאפ */}
      <div className="fixed bottom-6 left-6 z-50 space-y-3">
        {toasts.map(t => (
          <div key={t.id} className="bg-black text-white rounded-2xl shadow-2xl p-5 w-80 flex items-start gap-4">
            <div className="text-2xl">{t.type === 'new_case' ? '📁' : '✅'}</div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{t.title}</p>
              {t.subtitle && <p className="text-gray-300 text-sm mt-0.5 truncate">{t.subtitle}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="text-gray-400 hover:text-white text-lg leading-none">
              ×
            </button>
          </div>
        ))}
      </div>
    </>
  )
}
