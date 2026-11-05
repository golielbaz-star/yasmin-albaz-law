'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import FloatingActions from '@/components/FloatingActions'

type Client = {
  id: string
  name: string
  phone: string
  email: string
  notes: string
  status: 'lead' | 'active' | 'inactive'
  createdAt: string
}

const STATUS_CONFIG = {
  lead:     { label: 'ליד חדש',      color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  active:   { label: 'לקוח פעיל',   color: 'bg-green-100 text-green-700',   dot: 'bg-green-500'  },
  inactive: { label: 'לא פעיל',     color: 'bg-red-100 text-red-700',       dot: 'bg-red-500'    },
}

type FilterType = 'all' | 'lead' | 'active' | 'inactive'

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  function loadClients() {
    setLoading(true)
    fetch('/api/clients')
      .then(r => r.json())
      .then(d => { setClients(d.clients || []); setLoading(false) })
  }

  useEffect(() => { loadClients() }, [])

  const filtered = clients
    .filter(c => filter === 'all' || c.status === filter)
    .filter(c =>
      !search ||
      c.name?.includes(search) ||
      c.phone?.includes(search) ||
      c.email?.includes(search)
    )

  const counts = {
    all:      clients.length,
    lead:     clients.filter(c => c.status === 'lead').length,
    active:   clients.filter(c => c.status === 'active').length,
    inactive: clients.filter(c => c.status === 'inactive').length,
  }

  const filters: { id: FilterType; label: string }[] = [
    { id: 'all',      label: `הכל (${counts.all})` },
    { id: 'lead',     label: `לידים (${counts.lead})` },
    { id: 'active',   label: `פעילים (${counts.active})` },
    { id: 'inactive', label: `לא פעילים (${counts.inactive})` },
  ]

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">לקוחות ולידים</h1>
          <p className="text-gray-500 text-sm mt-1">{clients.length} סה"כ</p>
        </div>

        {/* פילטרים + חיפוש */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden">
            {filters.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors ${filter === f.id ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חיפוש..."
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white flex-1 max-w-xs"
          />
        </div>

        {/* רשימה */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">טוען...</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(client => {
              const cfg = STATUS_CONFIG[client.status] || STATUS_CONFIG.active
              return (
                <div
                  key={client.id}
                  onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                  className="bg-white rounded-xl border shadow-sm p-5 hover:shadow-md transition-all cursor-pointer hover:border-gray-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm relative ${
                        client.status === 'lead' ? 'bg-yellow-100 text-yellow-700' :
                        client.status === 'active' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {client.name?.[0] || '?'}
                        <span className={`absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full border-2 border-white ${cfg.dot}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{client.name}</p>
                        <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
                          {client.phone && <span>📞 {client.phone}</span>}
                          {client.email && <span>✉️ {client.email}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      <span className="text-gray-300">←</span>
                    </div>
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div className="text-center py-16 text-gray-400">אין תוצאות</div>
            )}
          </div>
        )}
      </div>

      <FloatingActions onCreated={loadClients} />
    </div>
  )
}
