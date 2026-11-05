'use client'

import { useState } from 'react'

type Props = {
  onCreated?: () => void
}

export default function FloatingActions({ onCreated }: Props) {
  const [open, setOpen] = useState(false)
  const [modal, setModal] = useState<'client' | 'task' | null>(null)

  // טופס לקוח
  const [clientForm, setClientForm] = useState({
    clientName: '', clientPhone: '', clientEmail: '',
    title: '', insuranceCompany: ''
  })
  const [savingClient, setSavingClient] = useState(false)

  // טופס משימה
  const [taskForm, setTaskForm] = useState({ title: '', dueDate: '', caseTitle: '' })
  const [savingTask, setSavingTask] = useState(false)

  function openModal(type: 'client' | 'task') {
    setOpen(false)
    setModal(type)
  }

  function closeModal() {
    setModal(null)
    setClientForm({ clientName: '', clientPhone: '', clientEmail: '', title: '', insuranceCompany: '' })
    setTaskForm({ title: '', dueDate: '', caseTitle: '' })
  }

  async function submitClient(e: React.FormEvent) {
    e.preventDefault()
    setSavingClient(true)
    await fetch('/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientForm),
    })
    setSavingClient(false)
    closeModal()
    onCreated?.()
  }

  async function submitTask(e: React.FormEvent) {
    e.preventDefault()
    setSavingTask(true)
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskForm),
    })
    setSavingTask(false)
    closeModal()
    onCreated?.()
  }

  return (
    <>
      {/* כפתור צף */}
      <div className="fixed bottom-8 left-8 z-40 flex flex-col items-end gap-3">
        {open && (
          <>
            <button
              onClick={() => openModal('task')}
              className="flex items-center gap-3 bg-white border border-gray-200 shadow-lg rounded-2xl px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
            >
              <span>✓</span> משימה חדשה
            </button>
            <button
              onClick={() => openModal('client')}
              className="flex items-center gap-3 bg-white border border-gray-200 shadow-lg rounded-2xl px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
            >
              <span>👤</span> לקוח חדש
            </button>
          </>
        )}
        <button
          onClick={() => setOpen(!open)}
          className="w-14 h-14 bg-black text-white rounded-full shadow-xl text-2xl flex items-center justify-center hover:bg-gray-800 transition-all"
        >
          {open ? '×' : '+'}
        </button>
      </div>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
      )}

      {/* מודל לקוח חדש */}
      {modal === 'client' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">לקוח חדש</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <form onSubmit={submitClient} className="space-y-3">
              <input
                required
                value={clientForm.clientName}
                onChange={e => setClientForm({ ...clientForm, clientName: e.target.value })}
                placeholder="שם הלקוח *"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black text-sm"
              />
              <input
                required
                value={clientForm.clientPhone}
                onChange={e => setClientForm({ ...clientForm, clientPhone: e.target.value })}
                placeholder="טלפון *"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black text-sm"
              />
              <input
                value={clientForm.clientEmail}
                onChange={e => setClientForm({ ...clientForm, clientEmail: e.target.value })}
                placeholder="אימייל"
                type="email"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black text-sm"
              />
              <input
                required
                value={clientForm.insuranceCompany}
                onChange={e => setClientForm({ ...clientForm, insuranceCompany: e.target.value })}
                placeholder="חברת ביטוח *"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black text-sm"
              />
              <input
                required
                value={clientForm.title}
                onChange={e => setClientForm({ ...clientForm, title: e.target.value })}
                placeholder="תיאור התיק *"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black text-sm"
              />
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={savingClient}
                  className="flex-1 bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 text-sm"
                >
                  {savingClient ? 'יוצר...' : 'צור לקוח'}
                </button>
                <button type="button" onClick={closeModal}
                  className="px-5 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm">
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* מודל משימה חדשה */}
      {modal === 'task' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">משימה חדשה</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <form onSubmit={submitTask} className="space-y-3">
              <input
                required
                value={taskForm.title}
                onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="כותרת המשימה *"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black text-sm"
              />
              <input
                type="date"
                value={taskForm.dueDate}
                onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black text-sm"
              />
              <input
                value={taskForm.caseTitle}
                onChange={e => setTaskForm({ ...taskForm, caseTitle: e.target.value })}
                placeholder="שם התיק (אופציונלי)"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black text-sm"
              />
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={savingTask}
                  className="flex-1 bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 text-sm"
                >
                  {savingTask ? 'יוצר...' : 'צור משימה'}
                </button>
                <button type="button" onClick={closeModal}
                  className="px-5 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm">
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
