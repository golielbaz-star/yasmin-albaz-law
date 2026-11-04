'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CASE_STATUSES } from '@/lib/statuses'

type Case = {
  id: string
  title: string
  status: string
  createdAt: string
  Client?: { name: string }
  insuranceCompany?: string
}

type Task = {
  id: string
  title: string
  dueDate: string | null
  caseTitle: string | null
  status: 'active' | 'due' | 'completed' | 'cancelled'
}

export default function DashboardPage() {
  const [cases, setCases] = useState<Case[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [clientCount, setClientCount] = useState(0)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [officeName, setOfficeName] = useState('')

  useEffect(() => {
    async function load() {
      const [casesRes, tasksRes] = await Promise.all([
        fetch('/api/cases'),
        fetch('/api/tasks'),
      ])
      const casesData = await casesRes.json()
      const tasksData = await tasksRes.json()

      const allCases: Case[] = casesData.cases || []
      setCases(allCases)
      setTasks(tasksData.tasks || [])

      // unique clients count
      const uniqueClients = new Set(allCases.map((c: any) => c.Client?.name).filter(Boolean))
      setClientCount(uniqueClients.size)
    }
    load()
  }, [])

  const total = cases.length
  const doneCases = cases.filter(c => c.status === 'done')
  const activeCases = cases.filter(c => c.status !== 'done')
  const todayStr = new Date().toISOString().slice(0, 10)
  const pendingTasks = tasks.filter(t =>
    (t.status === 'active' || t.status === 'due') &&
    t.dueDate && t.dueDate.slice(0, 10) <= todayStr
  )

  const statusCases = selectedStatus ? cases.filter(c => c.status === selectedStatus) : []
  const selectedStatusLabel = CASE_STATUSES.find(s => s.id === selectedStatus)?.label

  return (
    <div className="p-8 space-y-8" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">לוח בקרה</h1>
        <p className="text-gray-400 mt-1">סקירת הפעילות שלך</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <p className="text-sm text-gray-400 mb-1">תיקים פעילים</p>
          <p className="text-4xl font-bold text-gray-900">{activeCases.length}</p>
        </div>
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <p className="text-sm text-gray-400 mb-1">תיקים הושלמו</p>
          <p className="text-4xl font-bold text-gray-900">{doneCases.length}</p>
        </div>
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <p className="text-sm text-gray-400 mb-1">לקוחות</p>
          <p className="text-4xl font-bold text-gray-900">{clientCount}</p>
        </div>
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <p className="text-sm text-gray-400 mb-1">משימות לטיפול</p>
          <p className={`text-4xl font-bold ${pendingTasks.length > 0 ? 'text-orange-500' : 'text-gray-900'}`}>
            {pendingTasks.length}
          </p>
        </div>
      </div>

      {/* Tasks pending */}
      {pendingTasks.length > 0 && (
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">משימות לטיפול</h2>
            <Link href="/dashboard/tasks" className="text-sm text-gray-400 hover:text-black transition-colors">
              כל המשימות ←
            </Link>
          </div>
          <div className="space-y-2">
            {pendingTasks.slice(0, 5).map(t => {
              const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status === 'active'
              return (
                <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${isOverdue ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'}`}>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${t.status === 'due' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                  <span className="text-sm text-gray-800 flex-1">{t.title}</span>
                  {t.caseTitle && <span className="text-xs text-gray-400">📁 {t.caseTitle}</span>}
                  {t.dueDate && (
                    <span className={`text-xs ${isOverdue ? 'text-orange-500 font-medium' : 'text-gray-400'}`}>
                      {new Date(t.dueDate).toLocaleDateString('he-IL')}
                      {isOverdue && ' — באיחור!'}
                    </span>
                  )}
                </div>
              )
            })}
            {pendingTasks.length > 5 && (
              <p className="text-sm text-gray-400 text-center pt-1">ועוד {pendingTasks.length - 5} משימות...</p>
            )}
          </div>
        </div>
      )}

      {/* Status breakdown — clickable */}
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">פילוח לפי סטטוס</h2>
        <div className="space-y-3">
          {CASE_STATUSES.map(s => {
            const count = cases.filter(c => c.status === s.id).length
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            const isSelected = selectedStatus === s.id
            return (
              <button
                key={s.id}
                onClick={() => setSelectedStatus(isSelected ? null : s.id)}
                className={`w-full flex items-center gap-4 rounded-xl px-3 py-2 transition-colors text-right ${isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'} ${count === 0 ? 'opacity-40 cursor-default' : 'cursor-pointer'}`}
                disabled={count === 0}
              >
                <span className="text-sm text-gray-600 w-40 shrink-0">{s.label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="bg-black h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-sm text-gray-500 w-6 text-left font-medium">{count}</span>
                {count > 0 && (
                  <span className="text-xs text-gray-400">{isSelected ? '▲' : '▼'}</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Drill-down */}
        {selectedStatus && statusCases.length > 0 && (
          <div className="mt-5 border-t pt-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              תיקים בסטטוס: <span className="text-black">{selectedStatusLabel}</span>
            </h3>
            <div className="space-y-2">
              {statusCases.map(c => (
                <div key={c.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.title}</p>
                    {c.Client?.name && (
                      <p className="text-xs text-gray-400 mt-0.5">לקוח: {c.Client.name}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {c.insuranceCompany && (
                      <span className="text-xs text-gray-400">{c.insuranceCompany}</span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(c.createdAt).toLocaleDateString('he-IL')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick action */}
      <Link
        href="/dashboard/cases"
        className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium"
      >
        צפייה בכל התיקים ←
      </Link>
    </div>
  )
}
