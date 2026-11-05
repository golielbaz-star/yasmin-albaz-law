'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'

type CalEvent = {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  type: 'meeting' | 'hearing' | 'task' | 'other'
  clientName: string
  notes: string
  googleEventId?: string
}

type Client = { id: string; name: string }

const EVENT_TYPES = [
  { id: 'meeting', label: 'פגישה', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'hearing', label: 'דיון', color: 'bg-red-100 text-red-800 border-red-200' },
  { id: 'task', label: 'משימה', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { id: 'other', label: 'אחר', color: 'bg-gray-100 text-gray-700 border-gray-200' },
]

function typeColor(type: string) {
  return EVENT_TYPES.find(t => t.id === type)?.color ?? EVENT_TYPES[3].color
}

function typeLabel(type: string) {
  return EVENT_TYPES.find(t => t.id === type)?.label ?? 'אחר'
}

const HE_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
const HE_MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function startOfWeek(d: Date) {
  const day = d.getDay() // 0=Sun
  const result = new Date(d)
  result.setDate(d.getDate() - day)
  return result
}

function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export default function CalendarPage() {
  const searchParams = useSearchParams()
  const [view, setView] = useState<'week' | 'month' | 'day'>('week')
  const [anchor, setAnchor] = useState(new Date())
  const [events, setEvents] = useState<CalEvent[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')
  const [googleConnected, setGoogleConnected] = useState(false)

  // Modal
  const [showModal, setShowModal] = useState(false)
  const [editEvent, setEditEvent] = useState<CalEvent | null>(null)
  const [form, setForm] = useState({
    title: '', date: '', startTime: '', endTime: '',
    type: 'meeting', clientId: '', clientName: '', notes: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (searchParams.get('synced') === '1') {
      setSyncMsg('חובר בהצלחה ל-Google Calendar!')
      setGoogleConnected(true)
    }
  }, [searchParams])

  const loadEvents = useCallback(async () => {
    setLoading(true)
    let from: string, to: string

    if (view === 'month') {
      from = `${anchor.getFullYear()}-${String(anchor.getMonth() + 1).padStart(2, '0')}-01`
      const lastDay = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate()
      to = `${anchor.getFullYear()}-${String(anchor.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    } else if (view === 'week') {
      const ws = startOfWeek(anchor)
      from = toDateStr(ws)
      to = toDateStr(addDays(ws, 6))
    } else {
      from = to = toDateStr(anchor)
    }

    const res = await fetch(`/api/events?from=${from}&to=${to}`)
    const data = await res.json()
    setEvents(data.events || [])
    setLoading(false)
  }, [view, anchor])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(d => setClients(d.clients || []))
    // Check if Google connected
    fetch('/api/calendar/google/status').then(r => r.json()).then(d => setGoogleConnected(d.connected))
  }, [])

  function openNew(date?: string) {
    setEditEvent(null)
    setForm({
      title: '', date: date || toDateStr(anchor),
      startTime: '', endTime: '', type: 'meeting',
      clientId: '', clientName: '', notes: '',
    })
    setShowModal(true)
  }

  function openEdit(ev: CalEvent) {
    setEditEvent(ev)
    setForm({
      title: ev.title, date: ev.date,
      startTime: ev.startTime, endTime: ev.endTime,
      type: ev.type, clientId: '', clientName: ev.clientName,
      notes: ev.notes,
    })
    setShowModal(true)
  }

  async function saveEvent(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = { ...form }
    if (editEvent) {
      await fetch('/api/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editEvent.id, ...payload }),
      })
    } else {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }
    setSaving(false)
    setShowModal(false)
    loadEvents()
  }

  async function deleteEvent(id: string) {
    if (!confirm('למחוק אירוע זה?')) return
    await fetch(`/api/events?id=${id}`, { method: 'DELETE' })
    setShowModal(false)
    loadEvents()
  }

  async function syncGoogle() {
    setSyncing(true)
    setSyncMsg('')
    const res = await fetch('/api/calendar/google/sync', { method: 'POST' })
    const data = await res.json()
    setSyncing(false)
    if (data.success) {
      setSyncMsg(`יובאו ${data.imported} אירועים מ-Google Calendar`)
      loadEvents()
    } else {
      setSyncMsg('שגיאה בסנכרון')
    }
  }

  // ─── Weekly View ────────────────────────────────────────────────────────────
  function WeekView() {
    const ws = startOfWeek(anchor)
    const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i))
    const todayStr = toDateStr(new Date())

    return (
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b">
          {days.map(d => {
            const ds = toDateStr(d)
            const isToday = ds === todayStr
            return (
              <div key={ds} className={`p-3 text-center border-l last:border-l-0 ${isToday ? 'bg-black text-white' : 'bg-gray-50'}`}>
                <p className="text-xs font-medium opacity-70">{HE_DAYS[d.getDay()]}</p>
                <p className={`text-lg font-bold mt-0.5 ${isToday ? 'text-white' : 'text-gray-900'}`}>{d.getDate()}</p>
              </div>
            )
          })}
        </div>
        <div className="grid grid-cols-7 min-h-[480px]">
          {days.map(d => {
            const ds = toDateStr(d)
            const dayEvents = events.filter(e => e.date === ds)
            return (
              <div key={ds} className="border-l last:border-l-0 p-2 space-y-1 relative group min-h-[480px]">
                <button
                  onClick={() => openNew(ds)}
                  className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 bg-black text-white rounded-full text-xs flex items-center justify-center"
                >+</button>
                {dayEvents.map(ev => (
                  <button
                    key={ev.id}
                    onClick={() => openEdit(ev)}
                    className={`w-full text-right text-xs px-2 py-1.5 rounded-lg border ${typeColor(ev.type)} hover:opacity-80 transition-opacity`}
                  >
                    {ev.startTime && <span className="font-mono opacity-70 ml-1">{ev.startTime}</span>}
                    <span className="font-medium truncate block">{ev.title}</span>
                    {ev.clientName && <span className="opacity-70 truncate block">{ev.clientName}</span>}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ─── Monthly View ───────────────────────────────────────────────────────────
  function MonthView() {
    const year = anchor.getFullYear()
    const month = anchor.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const todayStr = toDateStr(new Date())

    const cells: (number | null)[] = [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ]
    while (cells.length % 7 !== 0) cells.push(null)

    return (
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b">
          {HE_DAYS.map(d => (
            <div key={d} className="p-3 text-center text-xs font-medium text-gray-500 bg-gray-50 border-l last:border-l-0">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (!day) return <div key={i} className="border-l border-b last:border-l-0 h-28 bg-gray-50/50" />
            const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const dayEvents = events.filter(e => e.date === ds)
            const isToday = ds === todayStr
            return (
              <div key={ds} className="border-l border-b last:border-l-0 h-28 p-1 relative group hover:bg-gray-50 cursor-pointer" onClick={() => { setAnchor(new Date(year, month, day)); setView('day') }}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium mb-1 ${isToday ? 'bg-black text-white' : 'text-gray-700'}`}>
                  {day}
                </div>
                <div className="space-y-0.5 overflow-hidden">
                  {dayEvents.slice(0, 3).map(ev => (
                    <div key={ev.id} className={`text-xs px-1.5 py-0.5 rounded truncate border ${typeColor(ev.type)}`}>
                      {ev.startTime && <span className="font-mono opacity-70 ml-1">{ev.startTime}</span>}
                      {ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <p className="text-xs text-gray-400 pr-1">+{dayEvents.length - 3} נוספים</p>
                  )}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); openNew(ds) }}
                  className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 bg-black text-white rounded-full text-xs flex items-center justify-center"
                >+</button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ─── Daily View ─────────────────────────────────────────────────────────────
  function DayView() {
    const ds = toDateStr(anchor)
    const dayEvents = events.filter(e => e.date === ds)
    const hours = Array.from({ length: 14 }, (_, i) => i + 7) // 07:00–20:00

    return (
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">
            {anchor.toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h3>
          <button onClick={() => openNew(ds)} className="bg-black text-white px-3 py-1.5 rounded-xl text-sm hover:bg-gray-800">
            + הוסף
          </button>
        </div>
        <div>
          {hours.map(h => {
            const hStr = String(h).padStart(2, '0') + ':00'
            const hEvents = dayEvents.filter(e => e.startTime?.startsWith(String(h).padStart(2, '0')))
            return (
              <div key={h} className="flex border-b last:border-b-0 min-h-[52px]">
                <div className="w-16 flex-shrink-0 p-2 text-xs text-gray-400 font-mono border-l bg-gray-50/50">
                  {hStr}
                </div>
                <div className="flex-1 p-1 space-y-1">
                  {hEvents.map(ev => (
                    <button
                      key={ev.id}
                      onClick={() => openEdit(ev)}
                      className={`w-full text-right text-sm px-3 py-2 rounded-lg border ${typeColor(ev.type)} hover:opacity-80 flex items-center justify-between`}
                    >
                      <span className="font-medium">{ev.title}</span>
                      <span className="text-xs opacity-70 font-mono">
                        {ev.startTime}{ev.endTime && ` – ${ev.endTime}`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
          {dayEvents.length === 0 && (
            <div className="text-center py-16 text-gray-400">אין אירועים היום</div>
          )}
        </div>
      </div>
    )
  }

  // ─── Navigation helpers ─────────────────────────────────────────────────────
  function prev() {
    if (view === 'month') setAnchor(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
    else if (view === 'week') setAnchor(d => addDays(d, -7))
    else setAnchor(d => addDays(d, -1))
  }

  function next() {
    if (view === 'month') setAnchor(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))
    else if (view === 'week') setAnchor(d => addDays(d, 7))
    else setAnchor(d => addDays(d, 1))
  }

  function headerLabel() {
    if (view === 'month') return `${HE_MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`
    if (view === 'week') {
      const ws = startOfWeek(anchor)
      const we = addDays(ws, 6)
      return `${ws.getDate()} – ${we.getDate()} ${HE_MONTHS[we.getMonth()]} ${we.getFullYear()}`
    }
    return anchor.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">יומן</h1>
            <p className="text-gray-400 text-sm mt-0.5">ניהול פגישות ואירועים</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Google Calendar */}
            {googleConnected ? (
              <button
                onClick={syncGoogle}
                disabled={syncing}
                className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-xl text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                <span>🔄</span> {syncing ? 'מסנכרן...' : 'סנכרן Google'}
              </button>
            ) : (
              <a
                href="/api/calendar/google/auth"
                className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-xl text-sm hover:bg-gray-50"
              >
                <span>📅</span> חבר Google Calendar
              </a>
            )}
            <button
              onClick={() => openNew()}
              className="bg-black text-white px-5 py-2 rounded-xl text-sm hover:bg-gray-800 font-medium"
            >
              + אירוע חדש
            </button>
          </div>
        </div>

        {syncMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
            {syncMsg}
          </div>
        )}

        {/* Calendar controls */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={prev} className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600">
              ›
            </button>
            <button onClick={() => setAnchor(new Date())} className="px-3 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-100">
              היום
            </button>
            <button onClick={next} className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600">
              ‹
            </button>
            <span className="font-semibold text-gray-900 text-sm mr-2">{headerLabel()}</span>
          </div>

          {/* View toggle */}
          <div className="flex border border-gray-200 rounded-xl overflow-hidden">
            {(['day', 'week', 'month'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${view === v ? 'bg-black text-white' : 'hover:bg-gray-50 text-gray-600'}`}
              >
                {v === 'day' ? 'יומי' : v === 'week' ? 'שבועי' : 'חודשי'}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-3 flex-wrap">
          {EVENT_TYPES.map(t => (
            <span key={t.id} className={`text-xs px-2.5 py-1 rounded-full border ${t.color}`}>{t.label}</span>
          ))}
        </div>

        {/* Calendar */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">טוען...</div>
        ) : (
          <>
            {view === 'week' && <WeekView />}
            {view === 'month' && <MonthView />}
            {view === 'day' && <DayView />}
          </>
        )}
      </div>

      {/* Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{editEvent ? 'עריכת אירוע' : 'אירוע חדש'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <form onSubmit={saveEvent} className="space-y-3">
              <input
                required
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="כותרת *"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black text-sm"
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">תאריך *</label>
                  <input
                    required
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-black text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">סוג</label>
                  <select
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-black text-sm bg-white"
                  >
                    {EVENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">שעת התחלה</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={e => setForm({ ...form, startTime: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-black text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">שעת סיום</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={e => setForm({ ...form, endTime: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-black text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">לקוח (אופציונלי)</label>
                <select
                  value={form.clientId}
                  onChange={e => {
                    const c = clients.find(c => c.id === e.target.value)
                    setForm({ ...form, clientId: e.target.value, clientName: c?.name || '' })
                  }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-black text-sm bg-white"
                >
                  <option value="">— ללא לקוח —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="הערות..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black text-sm resize-none"
              />

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-black text-white py-3 rounded-xl text-sm hover:bg-gray-800 disabled:opacity-50 font-medium">
                  {saving ? 'שומר...' : editEvent ? 'שמור שינויים' : 'צור אירוע'}
                </button>
                {editEvent && (
                  <button type="button" onClick={() => deleteEvent(editEvent.id)}
                    className="px-4 py-3 rounded-xl text-sm text-red-500 border border-red-200 hover:bg-red-50">
                    מחק
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
