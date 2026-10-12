'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import DocumentModal from './DocumentModal'
import CalendarView from './CalendarView'
import TasksView from './TasksView'

export default function LawOfficeDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [clientFilter, setClientFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClient, setSelectedClient] = useState<any | null>(null)
  const [clientSubTab, setClientSubTab] = useState('details')
  const [clients, setClients] = useState<any[]>([])
  const [generalTasks, setGeneralTasks] = useState<any[]>([])
  const [todayMeetings, setTodayMeetings] = useState<any[]>([])

  useEffect(() => {
    const t = new Date()
    const dateStr = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
    supabase.from('meetings').select('*').eq('date', dateStr).order('time', { ascending: true })
      .then(({ data }) => setTodayMeetings(data || []))

    const channel = supabase.channel('meetings-today')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, () => {
        supabase.from('meetings').select('*').eq('date', dateStr).order('time', { ascending: true })
          .then(({ data }) => setTodayMeetings(data || []))
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])
  const [showAddClient, setShowAddClient] = useState(false)
  const [dbLoading, setDbLoading] = useState(true)

  const loadClients = useCallback(async () => {
    const { data: clientsData } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
    if (!clientsData) return

    const enriched = await Promise.all(clientsData.map(async (c) => {
      const { data: docs } = await supabase.from('documents').select('*').eq('client_id', c.id)
      const { data: tasks } = await supabase.from('tasks').select('*').eq('client_id', c.id)
      const { data: notes } = await supabase.from('notes').select('*').eq('client_id', c.id)
      return {
        ...c,
        idNumber: c.id_number,
        criticalDates: c.critical_dates,
        feeModel: c.fee_model,
        totalFee: c.total_fee,
        paidSoFar: c.paid_so_far,
        balanceDue: c.balance_due,
        statusText: c.status === 'active' ? 'תיק פעיל' : c.status === 'completed' ? 'תיק הושלם' : 'בתהליכי הקמה',
        documents: (docs || []).map(d => ({ name: d.name, date: d.uploaded_at, type: d.file_type, path: d.file_path, category: d.category || 'כללי' })),
        tasks: (tasks || []).map(t => ({ id: t.id, title: t.title, dueDate: t.due_date, dueDateIso: t.due_date_iso, completed: t.completed, description: t.description, priority: t.priority || 'normal' })),
        notes: (notes || []).map(n => {
          const d = new Date(n.created_at)
          const date = d.toLocaleDateString('he-IL') + ' ' + d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
          return { id: n.id, date, author: n.author, text: n.text }
        }),
      }
    }))

    // Load general tasks (not linked to any client)
    const { data: genTasks } = await supabase.from('tasks').select('*').is('client_id', null).order('due_date_iso', { ascending: true })
    setGeneralTasks((genTasks || []).map(t => ({ id: t.id, title: t.title, dueDate: t.due_date, dueDateIso: t.due_date_iso, completed: t.completed, description: t.description, priority: t.priority || 'normal' })))

    setClients(enriched)
    setDbLoading(false)
  }, [])

  useEffect(() => {
    loadClients()

    // האזנה לשינויים בזמן אמת — כשלקוח חדש ממלא את הטופס
    const channel = supabase
      .channel('clients-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'clients' }, () => {
        loadClients()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [loadClients])
  const emptyForm = { name: '', phone: '', email: '', idNumber: '', address: '', field: '', status: 'active', summary: '', criticalDates: '', feeModel: '', totalFee: '', paidSoFar: '₪0', balanceDue: '' }
  const [form, setForm] = useState(emptyForm)

  const statusOptions = [
    { value: 'active', label: 'תיק פעיל' },
    { value: 'onboarding', label: 'בתהליכי הקמה' },
    { value: 'completed', label: 'תיק הושלם' },
  ]

  const fieldOptions = ['נזיקין ותאונות', 'חוזים ומסחר', 'דיני עבודה', 'מקרקעין', 'דיני משפחה', 'פלילי', 'מנהלי', 'אחר']

  const [showDoc, setShowDoc] = useState<'quote' | 'receipt' | 'invoice' | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadCategory, setUploadCategory] = useState('כללי')
  const [uploadLabel, setUploadLabel] = useState('')
  const [editingDocPath, setEditingDocPath] = useState<string | null>(null)
  const [editingDocName, setEditingDocName] = useState('')

  async function handleSaveDocName(path: string) {
    if (!editingDocName.trim()) return
    await supabase.from('documents').update({ name: editingDocName.trim() }).eq('file_path', path)
    setEditingDocPath(null)
    await refreshSelectedClient(selectedClient.id)
  }
  const [docCategoryFilter, setDocCategoryFilter] = useState('הכל')

  const docCategories = ['כללי', 'חוזים', 'שכ"ט', 'זימונים', 'רפואי', 'פיננסי', 'התכתבות', 'פסיקות', 'אחר']

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selectedClient) return
    setUploadingFile(true)
    try {
      const ext = file.name.split('.').pop() || ''
    const safeName = Date.now() + '.' + ext
    const filePath = `${selectedClient.id}/${safeName}`
      const { error: uploadError } = await supabase.storage
        .from('client-files')
        .upload(filePath, file)
      if (uploadError) throw uploadError

      await supabase.from('documents').insert({
        client_id: selectedClient.id,
        name: uploadLabel.trim() || file.name,
        file_path: filePath,
        file_type: file.name.split('.').pop()?.toUpperCase() || 'קובץ',
        uploaded_at: new Date().toLocaleDateString('he-IL'),
        category: uploadCategory,
      })
      setUploadLabel('')
      await refreshSelectedClient(selectedClient.id)
    } catch (err: any) {
      alert('שגיאה בהעלאה: ' + err.message)
    } finally {
      setUploadingFile(false)
      e.target.value = ''
    }
  }

  async function handleDeleteDocument(doc: any) {
    if (!confirm(`למחוק את "${doc.name}"?`)) return
    await supabase.storage.from('client-files').remove([doc.path])
    await supabase.from('documents').delete().eq('file_path', doc.path)
    await refreshSelectedClient(selectedClient.id)
  }

  function getFileUrl(path: string) {
    const { data } = supabase.storage.from('client-files').getPublicUrl(path)
    return data.publicUrl
  }

  function getFileIcon(name: string) {
    const ext = name.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return '🖼️'
    if (ext === 'pdf') return '📕'
    if (['doc', 'docx'].includes(ext || '')) return '📝'
    if (['xls', 'xlsx'].includes(ext || '')) return '📊'
    return '📄'
  }
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState<any>({})

  const [newNoteText, setNewNoteText] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingNoteText, setEditingNoteText] = useState('')

  async function refreshSelectedClient(clientId: string) {
    const { data: docs } = await supabase.from('documents').select('*').eq('client_id', clientId)
    const { data: tasks } = await supabase.from('tasks').select('*').eq('client_id', clientId)
    const { data: notes } = await supabase.from('notes').select('*').eq('client_id', clientId).order('created_at', { ascending: false })
    setSelectedClient((prev: any) => ({
      ...prev,
      documents: (docs || []).map((d: any) => ({ name: d.name, date: d.uploaded_at, type: d.file_type, path: d.file_path })),
      tasks: (tasks || []).map((t: any) => ({ id: t.id, title: t.title, dueDate: t.due_date, dueDateIso: t.due_date_iso, completed: t.completed, description: t.description, priority: t.priority || 'normal' })),
      notes: (notes || []).map((n: any) => {
        const d = new Date(n.created_at)
        const date = d.toLocaleDateString('he-IL') + ' ' + d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
        return { id: n.id, date, author: n.author, text: n.text }
      }),
    }))
  }

  async function handleAddNote() {
    if (!newNoteText.trim()) return
    const { error } = await supabase.from('notes').insert({
      client_id: selectedClient.id,
      author: 'עו"ד',
      text: newNoteText.trim(),
    })
    if (!error) {
      setNewNoteText('')
      setAddingNote(false)
      await refreshSelectedClient(selectedClient.id)
    }
  }

  async function handleSaveNoteEdit(noteId: string) {
    if (!editingNoteText.trim()) return
    const { error } = await supabase.from('notes').update({ text: editingNoteText.trim() }).eq('id', noteId)
    if (!error) {
      setEditingNoteId(null)
      await refreshSelectedClient(selectedClient.id)
    }
  }

  async function handleDeleteNote(noteId: string) {
    if (!confirm('למחוק את התיעוד?')) return
    await supabase.from('notes').delete().eq('id', noteId)
    await refreshSelectedClient(selectedClient.id)
  }

  const [showAddClientTask, setShowAddClientTask] = useState(false)
  const [newClientTask, setNewClientTask] = useState({ title: '', due_date_iso: '', description: '', priority: 'normal' })

  const PRIORITIES = [
    { value: 'critical', label: 'קריטית',   color: 'bg-red-100 text-red-700',    dot: 'bg-red-500' },
    { value: 'urgent',   label: 'דחופה',    color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
    { value: 'normal',   label: 'רגילה',    color: 'bg-blue-100 text-blue-700',  dot: 'bg-blue-400' },
    { value: 'low',      label: 'לא דחופה', color: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' },
  ]
  function getPriorityInfo(p: string) {
    return PRIORITIES.find(x => x.value === p) || PRIORITIES[2]
  }
  const [savingTask, setSavingTask] = useState(false)

  async function handleAddClientTask() {
    if (!newClientTask.title.trim() || !selectedClient) return
    setSavingTask(true)
    const { error } = await supabase.from('tasks').insert({
      client_id: selectedClient.id,
      title: newClientTask.title.trim(),
      description: newClientTask.description.trim() || null,
      due_date_iso: newClientTask.due_date_iso || null,
      due_date: newClientTask.due_date_iso
        ? new Date(newClientTask.due_date_iso + 'T12:00:00').toLocaleDateString('he-IL')
        : null,
      priority: newClientTask.priority,
      completed: false,
    })
    if (!error) {
      setNewClientTask({ title: '', due_date_iso: '', description: '', priority: 'normal' })
      setShowAddClientTask(false)
      await refreshSelectedClient(selectedClient.id)
      await loadClients()
    }
    setSavingTask(false)
  }

  async function handleToggleClientTask(taskId: string, completed: boolean) {
    await supabase.from('tasks').update({ completed: !completed }).eq('id', taskId)
    await refreshSelectedClient(selectedClient.id)
    await loadClients()
  }

  async function handleDeleteClientTask(taskId: string) {
    if (!confirm('למחוק משימה זו?')) return
    await supabase.from('tasks').delete().eq('id', taskId)
    await refreshSelectedClient(selectedClient.id)
    await loadClients()
  }

  function startEdit() {
    setEditForm({
      name: selectedClient.name || '',
      phone: selectedClient.phone || '',
      email: selectedClient.email || '',
      idNumber: selectedClient.idNumber || '',
      address: selectedClient.address || '',
      field: selectedClient.field || '',
      status: selectedClient.status || 'active',
      summary: selectedClient.summary || '',
      criticalDates: selectedClient.criticalDates || '',
      feeModel: selectedClient.feeModel || '',
      totalFee: selectedClient.totalFee || '',
      paidSoFar: selectedClient.paidSoFar || '',
      balanceDue: selectedClient.balanceDue || '',
    })
    setEditMode(true)
  }

  async function saveEdit() {
    const { error } = await supabase.from('clients').update({
      name: editForm.name,
      phone: editForm.phone,
      email: editForm.email,
      id_number: editForm.idNumber,
      address: editForm.address,
      field: editForm.field,
      status: editForm.status,
      summary: editForm.summary,
      critical_dates: editForm.criticalDates,
      fee_model: editForm.feeModel,
      total_fee: editForm.totalFee,
      paid_so_far: editForm.paidSoFar,
      balance_due: editForm.balanceDue,
    }).eq('id', selectedClient.id)
    if (!error) {
      await loadClients()
      setEditMode(false)
      // עדכן גם את selectedClient
      setSelectedClient((prev: any) => ({ ...prev, ...editForm, statusText: statusOptions.find(s => s.value === editForm.status)?.label ?? '' }))
    }
  }

  async function handleAddClient() {
    if (!form.name || !form.phone) return
    const { error } = await supabase.from('clients').insert({
      name: form.name,
      phone: form.phone,
      email: form.email,
      id_number: form.idNumber,
      address: form.address,
      field: form.field,
      status: form.status,
      summary: form.summary,
      critical_dates: form.criticalDates,
      fee_model: form.feeModel,
      total_fee: form.totalFee,
      paid_so_far: form.paidSoFar || '₪0',
      balance_due: form.totalFee || '₪0',
      source: 'manual'
    })
    if (!error) {
      await loadClients()
      setForm(emptyForm)
      setShowAddClient(false)
    }
  }

  const filteredClients = clients.filter(client => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone.includes(searchQuery) ||
      client.field.toLowerCase().includes(searchQuery.toLowerCase())
    if (clientFilter === 'all') return matchesSearch
    return matchesSearch && client.status === clientFilter
  })

  const activeCount = clients.filter(c => c.status === 'active').length
  const completedCount = clients.filter(c => c.status === 'completed').length
  const onboardingCount = clients.filter(c => c.status === 'onboarding').length

  // כל המשימות הפתוחות מכל התיקים + כלליות, ממוינות לפי תאריך יעד
  const allOpenTasks = [
    ...clients.flatMap(c => (c.tasks || []).filter((t: any) => !t.completed).map((t: any) => ({ ...t, clientName: c.name, clientId: c.id }))),
    ...generalTasks.filter(t => !t.completed).map(t => ({ ...t, clientName: 'כללי', clientId: null })),
  ].sort((a, b) => {
    const priorityOrder: { [k: string]: number } = { critical: 0, urgent: 1, normal: 2, low: 3 }
    if (!a.dueDateIso && !b.dueDateIso) return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2)
    if (!a.dueDateIso) return 1
    if (!b.dueDateIso) return -1
    const dateDiff = a.dueDateIso.localeCompare(b.dueDateIso)
    if (dateDiff !== 0) return dateDiff
    return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2)
  })

  // התראות: משימות שתאריך היעד שלהן בעוד 3 ימים או פחות
  const today = new Date()
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const in3Days = new Date(today)
  in3Days.setDate(today.getDate() + 3)
  const in3DaysIso = `${in3Days.getFullYear()}-${String(in3Days.getMonth() + 1).padStart(2, '0')}-${String(in3Days.getDate()).padStart(2, '0')}`
  const urgentTasks = allOpenTasks.filter(t => t.dueDateIso && t.dueDateIso <= in3DaysIso)
  const todayTasks = allOpenTasks.filter(t => t.dueDateIso === todayIso)

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex font-sans" dir="rtl">

      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 hidden md:flex flex-col justify-between shadow-2xl">
        <div>
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-lg font-extrabold text-white tracking-wide">ניהול משרד עו&quot;ד</h2>
            <p className="text-xs text-blue-400 mt-1 font-medium">מערכת ניהול תיקים ולקוחות</p>
          </div>

          <nav className="p-4 space-y-1.5">
            {[
              { id: 'dashboard', label: 'לוח בקרה ראשי', icon: '📊' },
              { id: 'clients', label: 'תיקים ולקוחות', icon: '📁' },
              { id: 'calendar', label: 'יומן פגישות', icon: '📅' },
              { id: 'tasks', label: 'משימות', icon: '✅' },
              { id: 'finances', label: 'פיננסים ושכ"ט', icon: '💰' },
              { id: 'settings', label: 'הגדרות מערכת', icon: '⚙️' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSelectedClient(null); }}
                className={`w-full text-right px-4 py-3 rounded-xl font-medium text-sm transition flex items-center gap-3 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold'
                    : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <span>{tab.icon}</span> {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 flex items-center gap-3 bg-slate-950/40">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shadow text-sm">
            עד
          </div>
          <div>
            <p className="text-sm font-bold text-white">משרד עורכי דין</p>
            <p className="text-xs text-slate-400">מנהל ראשי</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-h-screen">
        {dbLoading ? (
          <div className="flex items-center justify-center h-full min-h-64">
            <div className="text-center text-slate-400">
              <div className="text-4xl mb-3 animate-pulse">⚖️</div>
              <p className="font-medium">טוען נתונים...</p>
            </div>
          </div>
        ) : (
        <div>

        {/* Dashboard tab */}
        {activeTab === 'dashboard' && !selectedClient && (
          <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">לוח בקרה משרדי</h1>
                <p className="text-sm text-slate-500 mt-1">סקירה כללית של פעילות המשרד</p>
              </div>
              <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-semibold border border-blue-100 flex items-center gap-2">
                <span>📅</span> {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                <span className="text-sm text-slate-500 font-medium">סך לקוחות במערכת</span>
                <div className="flex items-baseline justify-between mt-4">
                  <span className="text-3xl font-extrabold text-slate-900">{clients.length}</span>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg font-semibold">סה&quot;כ</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                <span className="text-sm text-slate-500 font-medium">תיקים פעילים</span>
                <div className="flex items-baseline justify-between mt-4">
                  <span className="text-3xl font-extrabold text-blue-600">{activeCount}</span>
                  <span className="text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg font-semibold">בטיפול</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                <span className="text-sm text-slate-500 font-medium">תיקים הושלמו</span>
                <div className="flex items-baseline justify-between mt-4">
                  <span className="text-3xl font-extrabold text-emerald-600">{completedCount}</span>
                  <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg font-semibold">סגורים</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                <span className="text-sm text-slate-500 font-medium">בתהליכי הקמה</span>
                <div className="flex items-baseline justify-between mt-4">
                  <span className="text-3xl font-extrabold text-amber-500">{onboardingCount}</span>
                  <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg font-semibold">חדשים</span>
                </div>
              </div>
            </div>

            {/* Urgent alerts + Open tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

              {/* התראות דחופות */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-900">🔔 התראות דחופות</h2>
                  {urgentTasks.length > 0 && (
                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">
                      {urgentTasks.length} פעיל
                    </span>
                  )}
                </div>
                {urgentTasks.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <p className="text-3xl mb-2">✅</p>
                    <p className="font-medium text-sm">אין התראות דחופות כרגע</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {urgentTasks.map((task, i) => {
                      const diffMs = task.dueDateIso ? new Date(task.dueDateIso + 'T12:00:00').getTime() - today.getTime() : 0
                      const diff = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
                      const displayDate = task.dueDate || task.dueDateIso || ''
                      return (
                        <div key={i} className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-100 rounded-xl">
                          <span className="text-red-500 text-lg mt-0.5">⚠️</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 text-sm truncate">{task.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {task.clientName} · יעד: {displayDate}
                            </p>
                          </div>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg whitespace-nowrap ${
                            diff <= 0 ? 'bg-red-200 text-red-800' :
                            diff === 1 ? 'bg-orange-100 text-orange-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {diff <= 0 ? 'היום!' : diff === 1 ? 'מחר' : `בעוד ${diff} ימים`}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* משימות להיום */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-900">✅ משימות להיום</h2>
                  <div className="flex items-center gap-2">
                    {todayTasks.length > 0 && (
                      <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">
                        {todayTasks.length} משימות
                      </span>
                    )}
                    <button onClick={() => setActiveTab('tasks')} className="text-xs text-blue-600 font-semibold hover:underline">
                      לכל המשימות →
                    </button>
                  </div>
                </div>
                {todayTasks.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <p className="text-3xl mb-2">🎉</p>
                    <p className="font-medium text-sm">אין משימות להיום</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {todayTasks.map((task, i) => {
                      const priMap: Record<string, { color: string; dot: string; label: string }> = { critical: { color: 'bg-red-100 text-red-700', dot: 'bg-red-500', label: 'קריטית' }, urgent: { color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500', label: 'דחופה' }, normal: { color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400', label: 'רגילה' }, low: { color: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400', label: 'לא דחופה' } }
                      const pri = priMap[task.priority || 'normal'] || priMap['normal']
                      return (
                        <div
                          key={i}
                          onClick={() => { if (task.clientId) { setSelectedClient(clients.find(c => c.id === task.clientId)); setClientSubTab('tasks'); setActiveTab('clients'); } else { setActiveTab('tasks') } }}
                          className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-blue-50 hover:border-blue-100 cursor-pointer transition"
                        >
                          <span className={`w-2 h-2 rounded-full shrink-0 ${pri.dot}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 text-sm truncate">{task.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{task.clientName}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${pri.color}`}>{pri.label}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Meetings today */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-900">📅 פגישות להיום</h2>
                <button
                  onClick={() => setActiveTab('calendar')}
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  לכל היומן →
                </button>
              </div>
              {todayMeetings.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-3xl mb-2">📭</p>
                  <p className="font-medium text-sm">אין פגישות מתוכננות להיום</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {todayMeetings.map((m: any) => (
                    <div key={m.id} className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 hover:bg-blue-50/40 transition">
                      <span className="bg-blue-600 text-white font-bold px-3 py-1.5 rounded-xl text-sm min-w-[58px] text-center">{m.time || '--:--'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{m.title}</p>
                        {m.client_name && <p className="text-xs text-slate-500 mt-0.5">👤 {m.client_name}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {m.duration && <span className="text-xs text-slate-400">{m.duration}</span>}
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          m.status === 'הושלמה' ? 'bg-emerald-100 text-emerald-800' :
                          m.status === 'בוטלה' ? 'bg-red-100 text-red-800' :
                          m.status === 'ממתין' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>{m.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-4">⚡ פעולות מהירות</h2>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowAddClient(true)}
                  className="bg-blue-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-700 transition"
                >
                  + הוסף לקוח חדש
                </button>
                <button
                  onClick={() => setActiveTab('calendar')}
                  className="bg-slate-100 text-slate-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-slate-200 transition"
                >
                  📅 קבע פגישה
                </button>
                <button
                  onClick={() => setActiveTab('finances')}
                  className="bg-slate-100 text-slate-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-slate-200 transition"
                >
                  💰 עדכן תשלום
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Clients tab */}
        {activeTab === 'clients' && !selectedClient && (
          <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">📁 ניהול תיקים ולקוחות</h1>
                <p className="text-sm text-slate-500 mt-1">צפה, סנן וערוך את כל תיקי הלקוחות</p>
              </div>
              <button onClick={() => setShowAddClient(true)} className="bg-blue-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition">
                + הוסף לקוח חדש
              </button>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                {[
                  { id: 'all', label: `הכל (${clients.length})`, active: 'bg-slate-900 text-white', inactive: 'bg-slate-100 text-slate-600 hover:bg-slate-200' },
                  { id: 'active', label: 'תיק פעיל', active: 'bg-blue-600 text-white', inactive: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
                  { id: 'completed', label: 'תיק הושלם', active: 'bg-emerald-600 text-white', inactive: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
                  { id: 'onboarding', label: 'בתהליכי הקמה', active: 'bg-amber-600 text-white', inactive: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
                ].map(btn => (
                  <button
                    key={btn.id}
                    onClick={() => setClientFilter(btn.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${clientFilter === btn.id ? btn.active : btn.inactive}`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
              <div className="w-full md:w-72">
                <input
                  type="text"
                  placeholder="חיפוש לפי שם, טלפון או תחום..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {filteredClients.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <p className="text-5xl mb-4">📂</p>
                  <p className="text-lg font-semibold text-slate-500">אין לקוחות במערכת עדיין</p>
                  <p className="text-sm mt-1">לחץ על &quot;הוסף לקוח חדש&quot; כדי להתחיל</p>
                </div>
              ) : (
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold">
                      <th className="py-4 pr-6">שם הלקוח</th>
                      <th className="py-4">תחום משפטי</th>
                      <th className="py-4">טלפון</th>
                      <th className="py-4">סטטוס תיק</th>
                      <th className="py-4 text-left pl-6">פעולה</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredClients.map((client) => (
                      <tr
                        key={client.id}
                        onClick={() => setSelectedClient(client)}
                        className="hover:bg-blue-50/50 cursor-pointer transition"
                      >
                        <td className="py-4 pr-6 font-bold text-slate-900">{client.name}</td>
                        <td className="py-4 text-slate-600">{client.field}</td>
                        <td className="py-4 text-slate-500">{client.phone}</td>
                        <td className="py-4">
                          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                            client.status === 'active' ? 'bg-blue-100 text-blue-800' :
                            client.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {client.statusText}
                          </span>
                        </td>
                        <td className="py-4 text-left pl-6">
                          <button className="text-blue-600 bg-blue-50 hover:bg-blue-100 font-semibold text-xs px-3.5 py-2 rounded-xl transition">
                            פתח כרטיס &larr;
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Client card */}
        {selectedClient && (
          <div>
            <button
              onClick={() => setSelectedClient(null)}
              className="mb-6 flex items-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition w-fit"
            >
              &rarr; חזרה לרשימת הלקוחות
            </button>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-900">{selectedClient.name}</h1>
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                    selectedClient.status === 'active' ? 'bg-blue-100 text-blue-800' :
                    selectedClient.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedClient.statusText}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  תחום: <span className="font-semibold text-slate-700">{selectedClient.field}</span> | טלפון: {selectedClient.phone}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-sm font-semibold px-4 py-2 rounded-xl transition">
                  💬 וואטסאפ
                </button>
                <button onClick={startEdit} className="bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm font-semibold px-4 py-2 rounded-xl transition">
                  ✏️ ערוך פרטים
                </button>
                <button
                  onClick={() => { setClientSubTab('tasks'); setShowAddClientTask(true) }}
                  className="bg-slate-900 text-white hover:bg-slate-800 text-sm font-semibold px-4 py-2 rounded-xl transition"
                >
                  + הוסף משימה
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 pb-4">
              {[
                { id: 'details', label: '👤 פרטים אישיים' },
                { id: 'docs', label: `📁 מסמכים (${selectedClient.documents?.length ?? 0})` },
                { id: 'tasks', label: `✅ משימות (${selectedClient.tasks?.length ?? 0})` },
                { id: 'finance', label: '💰 פיננסי ושכ"ט' },
                { id: 'invoices', label: '🧾 קבלות' },
                { id: 'notes', label: '📝 תיעוד שיחות' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setClientSubTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                    clientSubTab === tab.id ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">

              {clientSubTab === 'details' && !editMode && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-900 border-b pb-3">פרטים אישיים</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { label: 'טלפון', value: selectedClient.phone },
                      { label: 'אימייל', value: selectedClient.email },
                      { label: 'תעודת זהות', value: selectedClient.idNumber },
                      { label: 'כתובת מגורים', value: selectedClient.address },
                      { label: 'תחום משפטי', value: selectedClient.field },
                      { label: 'סטטוס', value: selectedClient.statusText },
                    ].map((f, i) => (
                      <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <span className="text-xs text-slate-400 font-semibold block mb-1">{f.label}</span>
                        <span className="font-bold text-slate-800">{f.value || '—'}</span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                      <span className="text-xs text-blue-600 font-bold block mb-1">תיאור המקרה:</span>
                      <p className="text-sm text-slate-700 leading-relaxed">{selectedClient.summary || '—'}</p>
                    </div>
                    <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                      <span className="text-xs text-amber-700 font-bold block mb-1">מועדים קריטיים:</span>
                      <p className="text-sm text-slate-700 leading-relaxed">{selectedClient.criticalDates || '—'}</p>
                    </div>
                  </div>
                </div>
              )}

              {clientSubTab === 'details' && editMode && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-900 border-b pb-3">עריכת פרטי לקוח</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: 'שם מלא', key: 'name' },
                      { label: 'טלפון', key: 'phone' },
                      { label: 'אימייל', key: 'email' },
                      { label: 'תעודת זהות', key: 'idNumber' },
                      { label: 'כתובת', key: 'address' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">{f.label}</label>
                        <input
                          value={editForm[f.key]}
                          onChange={e => setEditForm((p: any) => ({ ...p, [f.key]: e.target.value }))}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ))}

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">תחום משפטי</label>
                      <select value={editForm.field} onChange={e => setEditForm((p: any) => ({ ...p, field: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                        {fieldOptions.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">סטטוס תיק</label>
                      <select value={editForm.status} onChange={e => setEditForm((p: any) => ({ ...p, status: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                        {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">תיאור המקרה</label>
                      <textarea value={editForm.summary} onChange={e => setEditForm((p: any) => ({ ...p, summary: e.target.value }))}
                        rows={3} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">מועדים קריטיים</label>
                      <input value={editForm.criticalDates} onChange={e => setEditForm((p: any) => ({ ...p, criticalDates: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">מודל תשלום</label>
                      <input value={editForm.feeModel} onChange={e => setEditForm((p: any) => ({ ...p, feeModel: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">שכ"ט כולל</label>
                      <input value={editForm.totalFee} onChange={e => setEditForm((p: any) => ({ ...p, totalFee: e.target.value }))}
                        placeholder="₪0" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">שולם עד כה</label>
                      <input value={editForm.paidSoFar} onChange={e => setEditForm((p: any) => ({ ...p, paidSoFar: e.target.value }))}
                        placeholder="₪0" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">יתרה לגבייה</label>
                      <input value={editForm.balanceDue} onChange={e => setEditForm((p: any) => ({ ...p, balanceDue: e.target.value }))}
                        placeholder="₪0" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={saveEdit} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition">
                      💾 שמור שינויים
                    </button>
                    <button onClick={() => setEditMode(false)} className="px-6 bg-slate-100 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-200 transition">
                      ביטול
                    </button>
                  </div>
                </div>
              )}

              {clientSubTab === 'docs' && (
                <div>
                  <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h3 className="text-lg font-bold text-slate-900">תיקיית מסמכים</h3>
                    <span className="text-xs text-slate-400">{selectedClient.documents?.length ?? 0} מסמכים</span>
                  </div>

                  {/* אזור העלאה */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-5">
                    <p className="text-sm font-semibold text-slate-700 mb-3">העלאת מסמך חדש</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">כיתוב / שם המסמך</label>
                        <input
                          value={uploadLabel}
                          onChange={e => setUploadLabel(e.target.value)}
                          placeholder="לדוג׳ תעודת זהות, התכתבות עם הקבלן..."
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">קטגוריה</label>
                        <select
                          value={uploadCategory}
                          onChange={e => setUploadCategory(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {docCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <label className={`cursor-pointer bg-blue-600 text-white font-semibold text-sm px-5 py-2 rounded-xl hover:bg-blue-700 transition inline-flex items-center gap-2 ${uploadingFile ? 'opacity-60 pointer-events-none' : ''}`}>
                      {uploadingFile ? '⏳ מעלה...' : '📎 בחר קובץ להעלאה'}
                      <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploadingFile}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif" />
                    </label>
                    <p className="text-xs text-slate-400 mt-2">אם לא תמלא כיתוב — ישמר שם הקובץ המקורי</p>
                  </div>

                  {/* סינון לפי קטגוריה */}
                  {selectedClient.documents?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {['הכל', ...docCategories.filter(c => selectedClient.documents.some((d: any) => d.category === c))].map(cat => (
                        <button
                          key={cat}
                          onClick={() => setDocCategoryFilter(cat)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${docCategoryFilter === cat ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* רשימת מסמכים */}
                  {(!selectedClient.documents || selectedClient.documents.length === 0) ? (
                    <div className="text-center py-10 text-slate-400">
                      <p className="text-4xl mb-2">📂</p>
                      <p className="font-medium">אין מסמכים עדיין</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedClient.documents
                        .filter((doc: any) => docCategoryFilter === 'הכל' || doc.category === docCategoryFilter)
                        .map((doc: any, i: number) => (
                          <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/40 transition">
                            <div className="flex justify-between items-start gap-3">
                              <div className="flex items-start gap-3 min-w-0 flex-1">
                                <span className="text-2xl shrink-0 mt-0.5">{getFileIcon(doc.name)}</span>
                                <div className="min-w-0 flex-1">
                                  {editingDocPath === doc.path ? (
                                    <div className="flex gap-2 items-center">
                                      <input
                                        value={editingDocName}
                                        onChange={e => setEditingDocName(e.target.value)}
                                        autoFocus
                                        onKeyDown={e => e.key === 'Enter' && handleSaveDocName(doc.path)}
                                        className="flex-1 px-3 py-1.5 border border-blue-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                      <button onClick={() => handleSaveDocName(doc.path)} className="text-emerald-600 hover:text-emerald-700 font-bold text-sm">✓</button>
                                      <button onClick={() => setEditingDocPath(null)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <p className="font-semibold text-slate-800 text-sm truncate">{doc.name}</p>
                                      <button
                                        onClick={() => { setEditingDocPath(doc.path); setEditingDocName(doc.name) }}
                                        className="text-slate-300 hover:text-blue-500 transition shrink-0"
                                        title="ערוך כיתוב"
                                      >✏️</button>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-lg">{doc.category}</span>
                                    <span className="text-xs text-slate-400">{doc.date} · {doc.type}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <a href={getFileUrl(doc.path)} target="_blank" rel="noopener noreferrer"
                                  className="text-blue-600 bg-blue-50 hover:bg-blue-100 font-semibold text-xs px-3 py-2 rounded-xl transition">
                                  צפה / הורד
                                </a>
                                <button onClick={() => handleDeleteDocument(doc)}
                                  className="text-red-400 hover:text-red-600 hover:bg-red-50 text-xs px-2 py-2 rounded-xl transition">
                                  🗑️
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      {selectedClient.documents.filter((d: any) => docCategoryFilter === 'הכל' || d.category === docCategoryFilter).length === 0 && (
                        <p className="text-center py-8 text-slate-400 text-sm">אין מסמכים בקטגוריה זו.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {clientSubTab === 'tasks' && (
                <div>
                  <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h3 className="text-lg font-bold text-slate-900">משימות לטיפול</h3>
                    <button
                      onClick={() => { setShowAddClientTask(true); setNewClientTask({ title: '', due_date_iso: '', description: '', priority: 'normal' }) }}
                      className="bg-blue-600 text-white font-semibold text-xs px-4 py-2 rounded-xl hover:bg-blue-700 transition"
                    >
                      + הוסף משימה
                    </button>
                  </div>

                  {/* טופס הוספת משימה */}
                  {showAddClientTask && (
                    <div className="mb-5 bg-blue-50 border border-blue-100 rounded-2xl p-4">
                      <p className="text-sm font-bold text-slate-700 mb-3">משימה חדשה</p>
                      <div className="space-y-3">
                        <input
                          value={newClientTask.title}
                          onChange={e => setNewClientTask(p => ({ ...p, title: e.target.value }))}
                          autoFocus
                          placeholder="כותרת המשימה..."
                          onKeyDown={e => e.key === 'Enter' && handleAddClientTask()}
                          className="w-full px-4 py-2.5 border border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">תאריך יעד</label>
                            <input
                              type="date"
                              value={newClientTask.due_date_iso}
                              onChange={e => setNewClientTask(p => ({ ...p, due_date_iso: e.target.value }))}
                              className="w-full px-3 py-2 border border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">הערות</label>
                            <input
                              value={newClientTask.description}
                              onChange={e => setNewClientTask(p => ({ ...p, description: e.target.value }))}
                              placeholder="פרטים נוספים..."
                              className="w-full px-3 py-2 border border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-2">עדיפות</label>
                          <div className="flex flex-wrap gap-2">
                            {PRIORITIES.map(p => (
                              <button
                                key={p.value}
                                type="button"
                                onClick={() => setNewClientTask(prev => ({ ...prev, priority: p.value }))}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                                  newClientTask.priority === p.value ? `${p.color} border-current` : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'
                                }`}
                              >
                                <span className={`w-2 h-2 rounded-full ${p.dot}`} />
                                {p.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleAddClientTask}
                            disabled={!newClientTask.title.trim() || savingTask}
                            className="bg-blue-600 text-white font-bold text-sm px-5 py-2 rounded-xl hover:bg-blue-700 transition disabled:opacity-40"
                          >
                            {savingTask ? 'שומר...' : '+ הוסף'}
                          </button>
                          <button
                            onClick={() => setShowAddClientTask(false)}
                            className="bg-white text-slate-600 font-semibold text-sm px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
                          >
                            ביטול
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {(!selectedClient.tasks || selectedClient.tasks.length === 0) ? (
                    <div className="text-center py-10 text-slate-400">
                      <p className="text-3xl mb-2">📋</p>
                      <p className="text-sm">אין משימות לתיק זה. לחץ &quot;הוסף משימה&quot; כדי להתחיל.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedClient.tasks.map((task: any) => {
                        const pri = getPriorityInfo(task.priority || 'normal')
                        return (
                          <div key={task.id} className={`flex items-center gap-3 p-4 bg-white rounded-xl border transition ${task.completed ? 'opacity-60 border-slate-100' : 'border-slate-100 hover:border-slate-200'}`}>
                            <button
                              onClick={() => handleToggleClientTask(task.id, task.completed)}
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                                task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-blue-400'
                              }`}
                            >
                              {task.completed && <span className="text-xs leading-none">✓</span>}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className={`font-semibold text-sm ${task.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.title}</p>
                              {task.description && <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>}
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${pri.color}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${pri.dot}`} />{pri.label}
                                </span>
                                {(task.dueDate || task.dueDateIso) && (
                                  <span className="text-xs text-slate-400">יעד: {task.dueDate || task.dueDateIso}</span>
                                )}
                              </div>
                            </div>
                            {task.completed && (
                              <span className="text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 bg-emerald-100 text-emerald-800">הושלם</span>
                            )}
                            <button
                              onClick={() => handleDeleteClientTask(task.id)}
                              className="text-slate-300 hover:text-red-500 transition shrink-0"
                              title="מחק"
                            >
                              🗑️
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {clientSubTab === 'finance' && (
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4 border-b pb-3">שכר טרחה ומודל תשלום</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                      <span className="text-xs text-slate-400 font-semibold block mb-1">מודל תשלום</span>
                      <span className="font-extrabold text-slate-900 text-lg">{selectedClient.feeModel || '—'}</span>
                    </div>
                    <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                      <span className="text-xs text-emerald-700 font-semibold block mb-1">שכ&quot;ט כולל</span>
                      <span className="font-extrabold text-emerald-700 text-xl">{selectedClient.totalFee || '—'}</span>
                    </div>
                    <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                      <span className="text-xs text-blue-700 font-semibold block mb-1">יתרה לגבייה</span>
                      <span className="font-extrabold text-blue-700 text-xl">{selectedClient.balanceDue || '—'}</span>
                    </div>
                  </div>
                  <button className="bg-slate-900 text-white font-semibold text-xs px-5 py-2.5 rounded-xl hover:bg-slate-800 transition">
                    + עדכן תשלום
                  </button>
                </div>
              )}

              {clientSubTab === 'invoices' && (
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-5 border-b pb-3">מסמכים פיננסיים</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <button
                      onClick={() => setShowDoc('quote')}
                      className="flex flex-col items-center gap-3 p-6 bg-violet-50 border-2 border-violet-100 rounded-2xl hover:border-violet-400 hover:bg-violet-100 transition group"
                    >
                      <span className="text-4xl">📋</span>
                      <div className="text-center">
                        <p className="font-bold text-violet-700 group-hover:text-violet-800">הצעת מחיר</p>
                        <p className="text-xs text-violet-500 mt-1">לפני התחלת הטיפול</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setShowDoc('invoice')}
                      className="flex flex-col items-center gap-3 p-6 bg-cyan-50 border-2 border-cyan-100 rounded-2xl hover:border-cyan-400 hover:bg-cyan-100 transition group"
                    >
                      <span className="text-4xl">🧾</span>
                      <div className="text-center">
                        <p className="font-bold text-cyan-700 group-hover:text-cyan-800">חשבונית</p>
                        <p className="text-xs text-cyan-500 mt-1">דרישת תשלום ללקוח</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setShowDoc('receipt')}
                      className="flex flex-col items-center gap-3 p-6 bg-emerald-50 border-2 border-emerald-100 rounded-2xl hover:border-emerald-400 hover:bg-emerald-100 transition group"
                    >
                      <span className="text-4xl">✅</span>
                      <div className="text-center">
                        <p className="font-bold text-emerald-700 group-hover:text-emerald-800">קבלה</p>
                        <p className="text-xs text-emerald-500 mt-1">אישור קבלת תשלום</p>
                      </div>
                    </button>
                  </div>

                  <div className="text-center py-4 text-slate-400 text-xs bg-amber-50 border border-amber-100 rounded-xl">
                    💡 בהמשך ניתן לחבר למערכת חשבונית ירוקה / iCount להפקת מסמכים רשמיים
                  </div>
                </div>
              )}

              {clientSubTab === 'notes' && (
                <div>
                  <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h3 className="text-lg font-bold text-slate-900">תיעודי שיחה</h3>
                    <button
                      onClick={() => { setAddingNote(true); setNewNoteText('') }}
                      className="bg-blue-600 text-white font-semibold text-xs px-4 py-2 rounded-xl hover:bg-blue-700 transition"
                    >
                      + הוסף תיעוד
                    </button>
                  </div>

                  {/* טופס הוספת תיעוד חדש */}
                  {addingNote && (
                    <div className="mb-5 bg-blue-50 border border-blue-100 rounded-2xl p-4">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">תיעוד שיחה חדש</label>
                      <textarea
                        value={newNoteText}
                        onChange={e => setNewNoteText(e.target.value)}
                        placeholder="תאר את תוכן השיחה, החלטות, פעולות נדרשות..."
                        rows={4}
                        autoFocus
                        className="w-full px-4 py-3 border border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
                      />
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={handleAddNote}
                          disabled={!newNoteText.trim()}
                          className="bg-blue-600 text-white font-bold text-sm px-5 py-2 rounded-xl hover:bg-blue-700 transition disabled:opacity-40"
                        >
                          💾 שמור תיעוד
                        </button>
                        <button
                          onClick={() => setAddingNote(false)}
                          className="bg-white text-slate-600 font-semibold text-sm px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
                        >
                          ביטול
                        </button>
                      </div>
                    </div>
                  )}

                  {(!selectedClient.notes || selectedClient.notes.length === 0) ? (
                    <p className="text-center py-10 text-slate-400">אין תיעודי שיחה עדיין.</p>
                  ) : (
                    <div className="space-y-4">
                      {selectedClient.notes.map((note: any) => (
                        <div key={note.id} className="border-r-4 border-blue-600 pr-4 py-3 bg-slate-50 rounded-l-xl">
                          <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
                            <span>{note.date} · ע&quot;י: <span className="font-semibold text-slate-600">{note.author}</span></span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => { setEditingNoteId(note.id); setEditingNoteText(note.text) }}
                                className="text-blue-500 hover:text-blue-700 font-semibold"
                              >
                                ✏️ ערוך
                              </button>
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="text-red-400 hover:text-red-600 font-semibold"
                              >
                                🗑️ מחק
                              </button>
                            </div>
                          </div>

                          {editingNoteId === note.id ? (
                            <div>
                              <textarea
                                value={editingNoteText}
                                onChange={e => setEditingNoteText(e.target.value)}
                                rows={4}
                                autoFocus
                                className="w-full px-4 py-3 border border-blue-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
                              />
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => handleSaveNoteEdit(note.id)}
                                  className="bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-blue-700 transition"
                                >
                                  💾 שמור
                                </button>
                                <button
                                  onClick={() => setEditingNoteId(null)}
                                  className="bg-white text-slate-600 font-semibold text-xs px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
                                >
                                  ביטול
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-800 leading-relaxed">{note.text}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <CalendarView />
        )}

        {activeTab === 'tasks' && (
          <TasksView />
        )}

        {activeTab === 'finances' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">💰 פיננסים ושכר טרחה</h1>
            <p className="text-sm text-slate-500 mb-6">מעקב אחרי כלל ההכנסות, גבייה ומקדמות.</p>
            <div className="p-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
              דוח פיננסי — בקרוב
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">⚙️ הגדרות מערכת</h1>
            <p className="text-sm text-slate-500 mb-6">הגדרת הודעות אוטומטיות, חיבורים חיצוניים ופרטי משרד.</p>
            <div className="p-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
              הגדרות מתקדמות — בקרוב
            </div>
          </div>
        )}

        </div>
        )}

      </main>

      {/* מודאל מסמכים פיננסיים */}
      {showDoc && selectedClient && (
        <DocumentModal
          client={selectedClient}
          type={showDoc}
          onClose={() => setShowDoc(null)}
        />
      )}

      {/* מודאל הוספת לקוח */}
      {showAddClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAddClient(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

            {/* כותרת */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-bold text-slate-900">הוספת לקוח חדש</h2>
                <p className="text-sm text-slate-500 mt-0.5">מלא את הפרטים כדי לפתוח תיק חדש</p>
              </div>
              <button onClick={() => setShowAddClient(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
            </div>

            <div className="p-6 space-y-6">

              {/* פרטים אישיים */}
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">פרטים אישיים</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">שם מלא <span className="text-red-500">*</span></label>
                    <input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="ישראל ישראלי"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">טלפון <span className="text-red-500">*</span></label>
                    <input
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="050-0000000"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">אימייל</label>
                    <input
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="email@example.com"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">תעודת זהות</label>
                    <input
                      value={form.idNumber}
                      onChange={e => setForm(f => ({ ...f, idNumber: e.target.value }))}
                      placeholder="000000000"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">כתובת מגורים</label>
                    <input
                      value={form.address}
                      onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                      placeholder="רחוב, מספר, עיר"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* פרטי התיק */}
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">פרטי התיק</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">תחום משפטי</label>
                    <select
                      value={form.field}
                      onChange={e => setForm(f => ({ ...f, field: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">בחר תחום...</option>
                      {fieldOptions.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">סטטוס תיק</label>
                    <select
                      value={form.status}
                      onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">תיאור המקרה</label>
                    <textarea
                      value={form.summary}
                      onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
                      placeholder="תאר בקצרה את המקרה / הבקשה של הלקוח..."
                      rows={3}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">מועדים קריטיים</label>
                    <input
                      value={form.criticalDates}
                      onChange={e => setForm(f => ({ ...f, criticalDates: e.target.value }))}
                      placeholder="לדוג׳ שימוע ב-20/11/2026, מועד הגשה ב-05/12/2026"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* שכר טרחה */}
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">שכר טרחה</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">מודל תשלום</label>
                    <input
                      value={form.feeModel}
                      onChange={e => setForm(f => ({ ...f, feeModel: e.target.value }))}
                      placeholder="לדוג׳ שכר קבוע ₪5,000 / אחוזים 15%"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">שכ&quot;ט כולל</label>
                    <input
                      value={form.totalFee}
                      onChange={e => setForm(f => ({ ...f, totalFee: e.target.value }))}
                      placeholder="₪0"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* כפתורים */}
            <div className="flex gap-3 p-6 border-t border-slate-200">
              <button
                onClick={handleAddClient}
                disabled={!form.name || !form.phone}
                className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                פתח תיק לקוח
              </button>
              <button
                onClick={() => { setShowAddClient(false); setForm(emptyForm) }}
                className="px-6 bg-slate-100 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-200 transition"
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
