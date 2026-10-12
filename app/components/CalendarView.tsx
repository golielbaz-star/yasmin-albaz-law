'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']

const STATUS_COLORS: Record<string, string> = {
  'נקבעה': 'bg-blue-100 text-blue-800 border-blue-200',
  'הושלמה': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'בוטלה': 'bg-red-100 text-red-800 border-red-200',
  'ממתין': 'bg-amber-100 text-amber-800 border-amber-200',
}

function ConflictModal({ conflict, time, onConfirm, onCancel }: { conflict: any, time: string, onConfirm: () => void, onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center" dir="rtl">
        <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">חפיפה בלוח הזמנים</h3>
        <p className="text-sm text-slate-500 mb-1">כבר קיימת פגישה בשעה <span className="font-bold text-slate-700">{time}</span>:</p>
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 my-4">
          <p className="font-bold text-amber-800 text-sm">"{conflict.title}"</p>
          {conflict.client_name && <p className="text-xs text-amber-600 mt-0.5">👤 {conflict.client_name}</p>}
        </div>
        <p className="text-sm text-slate-500 mb-5">האם להוסיף בכל זאת?</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 bg-slate-100 text-slate-700 font-semibold py-2.5 rounded-xl hover:bg-slate-200 transition text-sm">
            ביטול
          </button>
          <button onClick={onConfirm} className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 transition text-sm">
            הוסף בכל זאת
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CalendarView() {
  const today = new Date()
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [meetings, setMeetings] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [conflictModal, setConflictModal] = useState<{ conflict: any, pendingPayload: any } | null>(null)

  const emptyForm = { client_id: '', client_name: '', title: '', date: '', time: '09:00', duration: '30 דקות', notes: '', status: 'נקבעה' }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    loadMeetings()
    loadClients()
  }, [currentDate])

  async function loadMeetings() {
    setLoading(true)
    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0')
    const from = `${year}-${month}-01`
    const lastDay = new Date(year, currentDate.getMonth() + 1, 0).getDate()
    const to = `${year}-${month}-${String(lastDay).padStart(2, '0')}`

    const { data } = await supabase
      .from('meetings')
      .select('*')
      .gte('date', from)
      .lte('date', to)
      .order('time', { ascending: true })
    setMeetings(data || [])
    setLoading(false)
  }

  async function loadClients() {
    const { data } = await supabase.from('clients').select('id, name').order('name')
    setClients(data || [])
  }

  async function handleSave() {
    if (!form.title || !form.date) return

    const payload = {
      ...form,
      client_id: form.client_id || null,
      client_name: form.client_id ? clients.find(c => c.id === form.client_id)?.name || form.client_name : form.client_name,
    }

    // בדיקת חפיפה
    if (form.time) {
      const { data: existing } = await supabase
        .from('meetings')
        .select('id, title, client_name')
        .eq('date', form.date)
        .eq('time', form.time)
        .neq('id', selectedMeeting?.id || '00000000-0000-0000-0000-000000000000')

      if (existing && existing.length > 0) {
        setConflictModal({ conflict: existing[0], pendingPayload: payload })
        return
      }
    }

    await commitSave(payload)
  }

  async function commitSave(payload: any) {
    if (selectedMeeting) {
      await supabase.from('meetings').update(payload).eq('id', selectedMeeting.id)
    } else {
      await supabase.from('meetings').insert(payload)
    }
    setShowForm(false)
    setSelectedMeeting(null)
    setForm(emptyForm)
    setConflictModal(null)
    loadMeetings()
  }

  async function handleDelete(id: string) {
    if (!confirm('למחוק פגישה זו?')) return
    await supabase.from('meetings').delete().eq('id', id)
    setSelectedDay(null)
    loadMeetings()
  }

  function openNewMeeting(day: Date) {
    const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
    setForm({ ...emptyForm, date: dateStr })
    setSelectedMeeting(null)
    setShowForm(true)
  }

  function openEditMeeting(m: any) {
    setForm({ ...m, client_id: m.client_id || '' })
    setSelectedMeeting(m)
    setShowForm(true)
  }

  // בניית ימי החודש
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days: (Date | null)[] = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d))

  function meetingsForDay(day: Date) {
    const str = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
    return meetings.filter(m => m.date === str)
  }

  function isToday(day: Date) {
    return day.getDate() === today.getDate() && day.getMonth() === today.getMonth() && day.getFullYear() === today.getFullYear()
  }

  const selectedDayMeetings = selectedDay ? meetingsForDay(selectedDay) : []

  return (
    <div className="space-y-6" dir="rtl">

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">📅 יומן פגישות</h1>
          <p className="text-sm text-slate-500 mt-1">לחץ על יום להצגת פגישות או הוספה חדשה</p>
        </div>
        <button
          onClick={() => { setSelectedDay(null); setForm({ ...emptyForm, date: '' }); setSelectedMeeting(null); setShowForm(true) }}
          className="bg-blue-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-600/20"
        >
          + פגישה חדשה
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Calendar grid */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

          {/* Month nav */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <button
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-600 font-bold transition"
            >›</button>
            <h2 className="text-lg font-bold text-slate-900">
              {MONTHS[month]} {year}
            </h2>
            <button
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-600 font-bold transition"
            >‹</button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-slate-100">
            {DAYS.map(d => (
              <div key={d} className="py-2 text-center text-xs font-bold text-slate-400">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          {loading ? (
            <div className="py-20 text-center text-slate-400 animate-pulse">טוען...</div>
          ) : (
            <div className="grid grid-cols-7">
              {days.map((day, i) => {
                if (!day) return <div key={i} className="border-b border-l border-slate-100 min-h-[80px]" />
                const dayMeetings = meetingsForDay(day)
                const isSelected = selectedDay?.toDateString() === day.toDateString()
                const todayDay = isToday(day)
                return (
                  <div
                    key={i}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`border-b border-l border-slate-100 min-h-[80px] p-1.5 cursor-pointer transition ${
                      isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold mb-1 ${
                      todayDay ? 'bg-blue-600 text-white' : 'text-slate-700'
                    }`}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-0.5">
                      {dayMeetings.slice(0, 2).map(m => (
                        <div key={m.id} className={`text-xs px-1.5 py-0.5 rounded-md font-medium truncate border ${STATUS_COLORS[m.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                          {m.time && <span className="ml-1">{m.time}</span>}{m.title}
                        </div>
                      ))}
                      {dayMeetings.length > 2 && (
                        <div className="text-xs text-slate-400 px-1">+{dayMeetings.length - 2} נוספות</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          {selectedDay ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-900">
                  {selectedDay.getDate()} {MONTHS[selectedDay.getMonth()]}
                </h3>
                <button
                  onClick={() => openNewMeeting(selectedDay)}
                  className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-blue-700 transition"
                >
                  + הוסף
                </button>
              </div>
              {selectedDayMeetings.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-3xl mb-2">📭</p>
                  <p className="text-sm">אין פגישות ביום זה</p>
                  <button onClick={() => openNewMeeting(selectedDay)} className="mt-3 text-blue-600 text-sm font-semibold hover:underline">+ הוסף פגישה</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayMeetings.map(m => (
                    <div key={m.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-bold text-slate-800 text-sm">{m.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${STATUS_COLORS[m.status] || ''}`}>{m.status}</span>
                      </div>
                      {m.client_name && <p className="text-xs text-slate-500 mb-1">👤 {m.client_name}</p>}
                      {m.time && <p className="text-xs text-slate-500">🕐 {m.time} · {m.duration}</p>}
                      {m.notes && <p className="text-xs text-slate-400 mt-1 italic">{m.notes}</p>}
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => openEditMeeting(m)} className="text-blue-600 text-xs font-semibold hover:underline">ערוך</button>
                        <button onClick={() => handleDelete(m.id)} className="text-red-400 text-xs font-semibold hover:underline">מחק</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <h3 className="font-bold text-slate-900 mb-4">פגישות החודש</h3>
              {meetings.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-3xl mb-2">📅</p>
                  <p className="text-sm">אין פגישות החודש</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {meetings.map(m => (
                    <div key={m.id} onClick={() => setSelectedDay(new Date(m.date + 'T12:00:00'))}
                      className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-blue-50 transition">
                      <div className="text-center bg-white border border-slate-200 rounded-xl px-2 py-1 min-w-[40px]">
                        <p className="text-xs text-slate-400 leading-none">{MONTHS[new Date(m.date + 'T12:00:00').getMonth()].slice(0, 3)}</p>
                        <p className="text-base font-bold text-slate-900 leading-none">{new Date(m.date + 'T12:00:00').getDate()}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">{m.title}</p>
                        <p className="text-xs text-slate-400">{m.time} {m.client_name ? `· ${m.client_name}` : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* מודאל חפיפה */}
      {conflictModal && (
        <ConflictModal
          conflict={conflictModal.conflict}
          time={form.time}
          onConfirm={() => commitSave(conflictModal.pendingPayload)}
          onCancel={() => setConflictModal(null)}
        />
      )}

      {/* Modal - Add/Edit meeting */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">{selectedMeeting ? 'עריכת פגישה' : 'פגישה חדשה'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">נושא הפגישה <span className="text-red-500">*</span></label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="לדוג׳ ייעוץ ראשוני, שימוע, חתימת חוזה..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">תאריך <span className="text-red-500">*</span></label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">שעה</label>
                  <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">לקוח</label>
                  <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value, client_name: '' }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">ללא לקוח ספציפי</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">משך</label>
                  <select value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    {['15 דקות', '30 דקות', '45 דקות', 'שעה', 'שעה וחצי', 'שעתיים'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">סטטוס</label>
                <div className="flex gap-2">
                  {['נקבעה', 'הושלמה', 'בוטלה', 'ממתין'].map(s => (
                    <button key={s} onClick={() => setForm(f => ({ ...f, status: s }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${form.status === s ? STATUS_COLORS[s] : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">הערות</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="הערות נוספות לפגישה..."
                  rows={2} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-slate-200">
              <button onClick={handleSave} disabled={!form.title || !form.date}
                className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-40">
                {selectedMeeting ? '💾 שמור שינויים' : '+ הוסף פגישה'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-6 bg-slate-100 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-200 transition">
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
