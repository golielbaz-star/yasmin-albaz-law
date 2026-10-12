'use client'
import { useRef, useState } from 'react'

type DocType = 'quote' | 'receipt' | 'invoice'

interface Props {
  client: any
  type: DocType
  onClose: () => void
}

const docConfig = {
  quote: {
    title: 'הצעת מחיר',
    color: '#7c3aed',
    label: 'סכום הצעה',
    amountLabel: 'סכום מוצע',
    stamp: null,
    note: 'מסמך זה מהווה הצעת מחיר בלבד ואינו מחייב תשלום',
  },
  receipt: {
    title: 'קבלה',
    color: '#2563eb',
    label: 'סכום ששולם',
    amountLabel: 'סכום ששולם',
    stamp: '✓ שולם',
    stampColor: '#16a34a',
    note: 'מסמך זה מהווה אישור קבלת תשלום פנימי · בהמשך יוחלף בחשבונית מס רשמית',
  },
  invoice: {
    title: 'חשבונית',
    color: '#0891b2',
    label: 'סכום לתשלום',
    amountLabel: 'לתשלום',
    stamp: null,
    note: 'מסמך זה מהווה דרישת תשלום פנימית · בהמשך יוחלף בחשבונית מס רשמית',
  },
}

export default function DocumentModal({ client, type, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null)
  const config = docConfig[type]
  const today = new Date()
  const dateStr = today.toLocaleDateString('he-IL')
  const docNumber = Date.now().toString().slice(-5)

  const [amount, setAmount] = useState(type === 'quote' ? (client.totalFee || '') : (client.paidSoFar || ''))
  const [description, setDescription] = useState('שכר טרחה משפטי')
  const [validUntil, setValidUntil] = useState('') // רק להצעת מחיר
  const [dueDate, setDueDate] = useState('') // רק לחשבונית
  const [notes, setNotes] = useState('')

  function handlePrint() {
    const content = printRef.current?.innerHTML
    const win = window.open('', '_blank')
    if (!win || !content) return
    win.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8" />
        <title>${config.title} ${docNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; direction: rtl; color: #1e293b; background: white; }
          .doc { max-width: 700px; margin: 30px auto; padding: 40px; }
          @media print { body { margin: 0; } .doc { margin: 0; padding: 30px; } }
        </style>
      </head>
      <body>
        <div class="doc">${content}</div>
        <script>window.onload = () => { window.print(); window.close(); }<\/script>
      </body>
      </html>
    `)
    win.document.close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">הפקת {config.title}</h2>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="bg-blue-600 text-white font-bold text-sm px-5 py-2 rounded-xl hover:bg-blue-700 transition">
              🖨️ הדפס / שמור PDF
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none px-2">×</button>
          </div>
        </div>

        {/* Fields */}
        <div className="p-5 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{config.label}</label>
            <input value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="₪0"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">תיאור השירות</label>
            <input value={description} onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {type === 'quote' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">בתוקף עד</label>
              <input value={validUntil} onChange={e => setValidUntil(e.target.value)}
                placeholder="לדוג׳ 30/11/2026"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}
          {type === 'invoice' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">תאריך לתשלום</label>
              <input value={dueDate} onChange={e => setDueDate(e.target.value)}
                placeholder="לדוג׳ 30/11/2026"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">הערות (לא חובה)</label>
            <input value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="הערות נוספות שיופיעו במסמך..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {/* Document preview */}
        <div className="p-6">
          <div ref={printRef} style={{ fontFamily: 'Arial, sans-serif', direction: 'rtl', color: '#1e293b' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', paddingBottom: '20px', borderBottom: `3px solid ${config.color}` }}>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 800 }}>משרד עורכי דין</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>שירותים משפטיים מקצועיים</div>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: config.color }}>{config.title}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>מס׳ {docNumber} · {dateStr}</div>
              </div>
            </div>

            {/* Client info */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '1px', marginBottom: '8px' }}>פרטי הלקוח</div>
              {[
                { label: 'שם', value: client.name },
                { label: 'טלפון', value: client.phone },
                ...(client.email ? [{ label: 'אימייל', value: client.email }] : []),
                ...(client.field ? [{ label: 'תחום', value: client.field }] : []),
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f1f5f9', fontSize: '14px' }}>
                  <span style={{ color: '#64748b' }}>{r.label}</span>
                  <span style={{ fontWeight: 600 }}>{r.value}</span>
                </div>
              ))}
            </div>

            {/* Service details */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '1px', marginBottom: '8px' }}>פרטי השירות</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f1f5f9', fontSize: '14px' }}>
                <span style={{ color: '#64748b' }}>תיאור</span>
                <span style={{ fontWeight: 600 }}>{description}</span>
              </div>
              {type === 'quote' && validUntil && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f1f5f9', fontSize: '14px' }}>
                  <span style={{ color: '#64748b' }}>בתוקף עד</span>
                  <span style={{ fontWeight: 600, color: '#dc2626' }}>{validUntil}</span>
                </div>
              )}
              {type === 'invoice' && dueDate && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f1f5f9', fontSize: '14px' }}>
                  <span style={{ color: '#64748b' }}>לתשלום עד</span>
                  <span style={{ fontWeight: 600, color: '#dc2626' }}>{dueDate}</span>
                </div>
              )}
            </div>

            {/* Amount */}
            <div style={{ background: '#f8fafc', border: `2px solid ${config.color}`, borderRadius: '10px', padding: '18px 20px', margin: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '15px', fontWeight: 700 }}>{config.amountLabel}</span>
              <span style={{ fontSize: '26px', fontWeight: 800, color: config.color }}>{amount || '—'}</span>
            </div>

            {/* Stamp (receipt only) */}
            {type === 'receipt' && (
              <div style={{ textAlign: 'center', margin: '16px 0' }}>
                <span style={{ display: 'inline-block', border: '2px solid #16a34a', color: '#16a34a', fontWeight: 800, fontSize: '16px', padding: '8px 24px', borderRadius: '8px', transform: 'rotate(-5deg)' }}>
                  ✓ שולם
                </span>
              </div>
            )}

            {/* Notes */}
            {notes && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px 16px', margin: '16px 0', fontSize: '13px', color: '#92400e' }}>
                <strong>הערות:</strong> {notes}
              </div>
            )}

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: '28px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', fontSize: '11px', color: '#94a3b8' }}>
              {config.note}
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
