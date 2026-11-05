'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getStatus } from '@/lib/statuses'

type Client = {
  id: string
  name: string
  phone: string
  email: string
  cases: { id: string; title: string; status: string; insuranceCompany: string }[]
  archived: boolean
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [filter, setFilter] = useState<'active' | 'archived'>('active')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/clients')
      .then(r => r.json())
      .then(d => { setClients(d.clients || []); setLoading(false) })
  }, [])

  const filtered = clients
    .filter(c => filter === 'active' ? !c.archived : c.archived)
    .filter(c =>
      !search ||
      c.name?.includes(search) ||
      c.phone?.includes(search) ||
      c.email?.includes(search)
    )

  const activeCount = clients.filter(c => !c.archived).length
  const archivedCount = clients.filter(c => c.archived).length

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">לקוחות</h1>
          <p className="text-gray-500 text-sm mt-1">{clients.length} לקוחות סה"כ</p>
        </div>

        {/* פילטר + חיפוש */}
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setFilter('active')}
              className={`px-5 py-2.5 text-sm font-medium transition-colors ${filter === 'active' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              פעילים ({activeCount})
            </button>
            <button
              onClick={() => setFilter('archived')}
              className={`px-5 py-2.5 text-sm font-medium transition-colors ${filter === 'archived' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              ארכיון ({archivedCount})
            </button>
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חיפוש לקוח..."
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white flex-1 max-w-xs"
          />
        </div>

        {/* רשימת לקוחות */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">טוען...</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(client => {
              const activeCase = client.cases[0]
              const status = activeCase ? getStatus(activeCase.status) : null
              return (
                <div
                  key={client.id}
                  onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                  className="bg-white rounded-xl border shadow-sm p-5 hover:shadow-md transition-all cursor-pointer hover:border-gray-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm">
                          {client.name?.[0] || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{client.name}</p>
                          <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
                            {client.phone && <span>📞 {client.phone}</span>}
                            {client.email && <span>✉️ {client.email}</span>}
                          </div>
                        </div>
                      </div>
                      {activeCase && (
                        <div className="flex items-center gap-2 mt-2 mr-12">
                          {status && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                              {status.label}
                            </span>
                          )}
                          <span className="text-sm text-gray-600">{activeCase.title}</span>
                          {activeCase.insuranceCompany && (
                            <span className="text-xs text-gray-400">• {activeCase.insuranceCompany}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-gray-300 text-xl">←</div>
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                {filter === 'active' ? 'אין לקוחות פעילים' : 'אין לקוחות בארכיון'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
