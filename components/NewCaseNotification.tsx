'use client'

import { useEffect, useState, useRef } from 'react'

type Notification = {
  id: string
  title: string
  company: string
}

export default function NewCaseNotification({ officeId }: { officeId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const lastCountRef = useRef<number | null>(null)

  useEffect(() => {
    async function checkNewCases() {
      const res = await fetch('/api/cases')
      if (!res.ok) return
      const data = await res.json()
      const cases = data.cases || []

      console.log('Cases count:', cases.length, 'Last count:', lastCountRef.current)

      if (lastCountRef.current === null) {
        lastCountRef.current = cases.length
        return
      }

      if (cases.length > lastCountRef.current) {
        const newCases = cases.slice(0, cases.length - lastCountRef.current)
        newCases.forEach((c: any) => {
          const notification: Notification = {
            id: c.id,
            title: c.title || 'תיק חדש',
            company: c.insuranceCompany || '',
          }
          setNotifications(prev => [...prev, notification])
        })
        lastCountRef.current = cases.length
      }
    }

    checkNewCases()
    const interval = setInterval(checkNewCases, 10000)
    return () => clearInterval(interval)
  }, [officeId])

  if (notifications.length === 0) return null

  return (
    <div className="fixed bottom-6 left-6 z-50 space-y-3">
      {notifications.map(n => (
        <div key={n.id} className="bg-black text-white rounded-2xl shadow-2xl p-5 w-80 flex items-start gap-4">
          <div className="text-2xl">📁</div>
          <div className="flex-1">
            <p className="font-semibold text-sm">תיק חדש התקבל!</p>
            <p className="text-gray-300 text-sm mt-0.5 truncate">{n.title}</p>
            {n.company && <p className="text-gray-400 text-xs mt-0.5">{n.company}</p>}
          </div>
          <button
            onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))}
            className="text-gray-400 hover:text-white text-lg leading-none"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
