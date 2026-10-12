'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

type ViewMode = 'day' | 'week' | 'month'

const PRIORITIES = [
  { value: 'critical', label: 'קריטית',    color: 'bg-red-100 text-red-700 border-red-200',    dot: 'bg-red-500' },
  { value: 'urgent',   label: 'דחופה',     color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  { value: 'normal',   label: 'רגילה',     color: 'bg-blue-100 text-blue-700 border-blue-200',  dot: 'bg-blue-400' },
  { value: 'low',      label: 'לא דחופה',  color: 'bg-slate-100 text-slate-500 border-slate-200', dot: 'bg-slate-400' },
]

function getPriority(p: string) {
  return PRIORITIES.find(x => x.value === p) || PRIORITIES[2]
}

function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getDateRange(mode: ViewMode, date: Date) {
  if (mode === 'day') {
    return { start: new Date(date), end: new Date(date) }
  } else if (mode === 'week') {
    const start = new Date(date)
    start.setDate(date.getDate() - date.getDay())
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return { start, end }
  } else {
    const start = new Date(date.getFullYear(), date.getMonth(), 1)
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    return { start, end }
  }
}

function TaskRow({ task, onToggle, onDelete, showDate = false }: {
  task: any
  onToggle: (t: any) => void
  onDelete: (id: string) => void
  showDate?: boolean
}) {
  const clientName = task.clients?.name
  const priority = getPriority(task.priority || 'normal')
  return (
    <div className={`flex items-center gap-3 p-3 border rounded-xl transition ${task.completed ? 'opacity-60 bg-slate-50 border-slate-100' : `bg-white border-slate-100 hover:border-slate-200`}`}>
      <button
        onClick={() => onToggle(task)}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
          task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-blue-400'
        }`}
      >
        {task.completed && <span className="text-xs leading-none">✓</span>}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${task.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.title}</p>
        {task.description && <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${priority.color}`}>{priority.label}</span>
          {clientName && <span className="text-xs text-blue-600 font-medium">👤 {clientName}</span>}
          {showDate && task.due_date_iso && (
            <span className="text-xs text-slate-400">
              {new Date(task.due_date_iso + 'T12:00:00').toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
      </div>
      {task.completed && (
        <span className="text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 bg-emerald-100 text-emerald-700">הושלם</span>
      )}
      <button
        onClick={() => onDelete(task.id)}
        className="text-slate-300 hover:text-red-500 transition shrink-0 text-base"
        title="מחק"
      >
        🗑️
      </button>
    </div>
  )
}

export default function TasksView() {
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [tasks, setTasks] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', due_date_iso: '', description: '', client_id: '', priority: 'normal' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('clients').select('id, name').order('name').then(({ data }) => setClients(data || []))
  }, [])

  const loadTasks = useCallback(async () => {
    setLoading(true)
    const { start, end } = getDateRange(viewMode, currentDate)
    const startStr = toISODate(start)
    const endStr = toISODate(end)

    const priorityOrder: { [k: string]: number } = { critical: 0, urgent: 1, normal: 2, low: 3 }
    const { data } = await supabase
      .from('tasks')
      .select('*, clients(name)')
      .gte('due_date_iso', startStr)
      .lte('due_date_iso', endStr)
      .order('due_date_iso', { ascending: true })
    if (data) data.sort((a, b) => {
      if (a.due_date_iso !== b.due_date_iso) return 0
      return (priorityOrder[a.priority || 'normal'] ?? 2) - (priorityOrder[b.priority || 'normal'] ?? 2)
    })

    setTasks(data || [])
    setLoading(false)
  }, [viewMode, currentDate])

  useEffect(() => { loadTasks() }, [loadTasks])

  function navigate(dir: 1 | -1) {
    const d = new Date(currentDate)
    if (viewMode === 'day') d.setDate(d.getDate() + dir)
    else if (viewMode === 'week') d.setDate(d.getDate() + dir * 7)
    else d.setMonth(d.getMonth() + dir)
    setCurrentDate(d)
  }

  function getLabel() {
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    } else if (viewMode === 'week') {
      const { start, end } = getDateRange('week', currentDate)
      return `${start.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })} – ${end.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}`
    } else {
      return currentDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })
    }
  }

  async function handleAddTask() {
    if (!newTask.title.trim()) return
    setSaving(true)
    const insert: any = {
      title: newTask.title.trim(),
      description: newTask.description.trim() || null,
      due_date_iso: newTask.due_date_iso || null,
      due_date: newTask.due_date_iso
        ? new Date(newTask.due_date_iso + 'T12:00:00').toLocaleDateString('he-IL')
        : null,
      priority: newTask.priority,
      completed: false,
    }
    if (newTask.client_id) insert.client_id = newTask.client_id
    const { error } = await supabase.from('tasks').insert(insert)
    if (!error) {
      setNewTask({ title: '', due_date_iso: '', description: '', client_id: '', priority: 'normal' })
      setShowAddTask(false)
      await loadTasks()
    }
    setSaving(false)
  }

  async function toggleTask(task: any) {
    await supabase.from('tasks').update({ completed: !task.completed }).eq('id', task.id)
    await loadTasks()
  }

  async function deleteTask(id: string) {
    if (!confirm('למחוק משימה זו?')) return
    await supabase.from('tasks').delete().eq('id', id)
    await loadTasks()
  }

  const today = toISODate(new Date())
  const tasksByDate: { [date: string]: any[] } = {}
  tasks.forEach(t => {
    const d = t.due_date_iso || 'unknown'
    if (!tasksByDate[d]) tasksByDate[d] = []
    tasksByDate[d].push(t)
  })

  function getDaysInRange() {
    const { start, end } = getDateRange(viewMode, currentDate)
    const days: string[] = []
    const d = new Date(start)
    while (d <= end) {
      days.push(toISODate(new Date(d)))
      d.setDate(d.getDate() + 1)
    }
    return days
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">✅ משימות</h1>
          <p className="text-sm text-slate-500 mt-1">ניהול וצפייה במשימות לפי תאריך</p>
        </div>
        <button
          onClick={() => setShowAddTask(true)}
          className="bg-blue-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-700 transition"
        >
          + משימה חדשה
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {([['day', 'יום'], ['week', 'שבוע'], ['month', 'חודש']] as [ViewMode, string][]).map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${viewMode === mode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center font-bold text-sm transition">→</button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-xl transition"
          >
            היום
          </button>
          <span className="font-semibold text-slate-700 text-sm text-center min-w-[200px]">{getLabel()}</span>
          <button onClick={() => navigate(1)} className="w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center font-bold text-sm transition">←</button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
          <div className="text-4xl mb-3 animate-pulse">⏳</div>
          <p className="text-sm">טוען משימות...</p>
        </div>
      ) : viewMode === 'day' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            {currentDate.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
            {toISODate(currentDate) === today && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">היום</span>
            )}
          </h3>
          {(tasksByDate[toISODate(currentDate)] || []).length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-sm">אין משימות ליום זה</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(tasksByDate[toISODate(currentDate)] || []).map(task => (
                <TaskRow key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
              ))}
            </div>
          )}
        </div>
      ) : viewMode === 'week' ? (
        <div className="space-y-3">
          {getDaysInRange().map(dateStr => {
            const dayTasks = tasksByDate[dateStr] || []
            const d = new Date(dateStr + 'T12:00:00')
            const isToday = dateStr === today
            return (
              <div key={dateStr} className={`bg-white rounded-2xl shadow-sm border p-4 ${isToday ? 'border-blue-300' : 'border-slate-200'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 ${isToday ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {d.getDate()}
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${isToday ? 'text-blue-700' : 'text-slate-700'}`}>
                      {d.toLocaleDateString('he-IL', { weekday: 'long' })}
                    </p>
                    <p className="text-xs text-slate-400">{d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })}</p>
                  </div>
                  {dayTasks.length > 0 && (
                    <span className="mr-auto text-xs bg-amber-100 text-amber-700 font-bold px-2.5 py-1 rounded-full">
                      {dayTasks.length} משימות
                    </span>
                  )}
                </div>
                {dayTasks.length === 0 ? (
                  <p className="text-xs text-slate-300 mr-13 pr-1">אין משימות</p>
                ) : (
                  <div className="space-y-2">
                    {dayTasks.map(task => (
                      <TaskRow key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        // Month view
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'].map(d => (
              <div key={d} className="text-center text-xs font-bold text-slate-400 py-2">{d}</div>
            ))}
          </div>
          {(() => {
            const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
            const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
            const cells = []
            for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} />)
            for (let day = 1; day <= daysInMonth; day++) {
              const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const dayTasks = tasksByDate[dateStr] || []
              const isToday = dateStr === today
              cells.push(
                <div key={day} className={`min-h-20 p-2 rounded-xl border text-sm transition ${isToday ? 'border-blue-400 bg-blue-50' : 'border-slate-100 hover:border-slate-300'}`}>
                  <p className={`font-bold text-sm mb-1 ${isToday ? 'text-blue-700' : 'text-slate-600'}`}>{day}</p>
                  {dayTasks.slice(0, 2).map(task => {
                    const p = getPriority(task.priority || 'normal')
                    return (
                      <div key={task.id} className={`text-xs px-1.5 py-0.5 rounded mb-0.5 truncate font-medium flex items-center gap-1 ${task.completed ? 'bg-emerald-100 text-emerald-700 line-through' : p.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.dot}`} />
                        {task.title}
                      </div>
                    )
                  })}
                  {dayTasks.length > 2 && <p className="text-xs text-slate-400">+{dayTasks.length - 2}</p>}
                </div>
              )
            }
            return <div className="grid grid-cols-7 gap-1">{cells}</div>
          })()}

          <div className="mt-6 border-t border-slate-100 pt-5">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p className="text-3xl mb-2">🎉</p>
                <p className="text-sm">אין משימות בחודש זה</p>
              </div>
            ) : (
              <>
                <h3 className="font-bold text-slate-700 mb-3 text-sm">כל המשימות בחודש ({tasks.length})</h3>
                <div className="space-y-2">
                  {tasks.map(task => (
                    <TaskRow key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} showDate />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add task modal */}
      {showAddTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAddTask(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">משימה חדשה</h2>
              <button onClick={() => setShowAddTask(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">כותרת המשימה <span className="text-red-500">*</span></label>
                <input
                  value={newTask.title}
                  onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                  placeholder="לדוג׳ הגשת כתב תביעה, שיחה עם לקוח..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">תאריך יעד</label>
                <input
                  type="date"
                  value={newTask.due_date_iso}
                  onChange={e => setNewTask(p => ({ ...p, due_date_iso: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">עדיפות</label>
                <div className="grid grid-cols-2 gap-2">
                  {PRIORITIES.map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setNewTask(prev => ({ ...prev, priority: p.value }))}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition ${
                        newTask.priority === p.value ? `${p.color} border-current` : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${p.dot}`} />
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">קשר ללקוח (לא חובה)</label>
                <select
                  value={newTask.client_id}
                  onChange={e => setNewTask(p => ({ ...p, client_id: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">ללא קשר ללקוח ספציפי</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">הערות (לא חובה)</label>
                <textarea
                  value={newTask.description}
                  onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  placeholder="פרטים נוספים..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-slate-200">
              <button
                onClick={handleAddTask}
                disabled={!newTask.title.trim() || saving}
                className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 transition disabled:opacity-40"
              >
                {saving ? 'שומר...' : '+ הוסף משימה'}
              </button>
              <button
                onClick={() => setShowAddTask(false)}
                className="px-5 bg-slate-100 text-slate-700 font-semibold py-2.5 rounded-xl hover:bg-slate-200 transition"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
