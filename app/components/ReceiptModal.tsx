'use client'
import { useRef } from 'react'

interface Props {
  client: any
  receiptNumber: string
  amount: string
  description: string
  onClose: () => void
}

export default function ReceiptModal({ client, receiptNumber, amount, description, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null)

  function handlePrint() {
    const content = printRef.current?.innerHTML
    const win = window.open('', '_blank')
    if (!win || !content) return
    win.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8" />
        <title>קבלה ${receiptNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; direction: rtl; color: #1e293b; background: white; }
          .receipt { max-width: 700px; margin: 40px auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 12px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #1e293b; }
          .office-name { font-size: 22px; font-weight: 800; color: #1e293b; }
          .office-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
          .receipt-title { text-align: left; }
          .receipt-title h2 { font-size: 24px; font-weight: 800; color: #2563eb; }
          .receipt-title .num { font-size: 13px; color: #64748b; margin-top: 4px; }
          .section { margin-bottom: 24px; }
          .section-title { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
          .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
          .row .label { color: #64748b; }
          .row .value { font-weight: 600; color: #1e293b; }
          .total-box { background: #f8fafc; border: 2px solid #2563eb; border-radius: 10px; padding: 20px; margin: 24px 0; display: flex; justify-content: space-between; align-items: center; }
          .total-box .label { font-size: 16px; font-weight: 700; color: #1e293b; }
          .total-box .amount { font-size: 28px; font-weight: 800; color: #2563eb; }
          .footer { text-align: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; }
          .stamp { display: inline-block; border: 2px solid #16a34a; color: #16a34a; font-weight: 800; font-size: 16px; padding: 8px 20px; border-radius: 8px; transform: rotate(-5deg); margin-top: 16px; }
          @media print { body { margin: 0; } .receipt { border: none; margin: 0; } }
        </style>
      </head>
      <body>
        ${content}
        <script>window.onload = () => { window.print(); window.close(); }<\/script>
      </body>
      </html>
    `)
    win.document.close()
  }

  const today = new Date()
  const dateStr = today.toLocaleDateString('he-IL')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        {/* כפתורי פעולה */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">תצוגת קבלה</h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="bg-blue-600 text-white font-bold text-sm px-5 py-2 rounded-xl hover:bg-blue-700 transition flex items-center gap-2"
            >
              🖨️ הדפס / שמור PDF
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none px-2">×</button>
          </div>
        </div>

        {/* תוכן הקבלה */}
        <div className="p-6">
          <div ref={printRef}>
            <div className="receipt" style={{ fontFamily: 'Arial, sans-serif', direction: 'rtl', color: '#1e293b' }}>

              {/* כותרת */}
              <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', paddingBottom: '24px', borderBottom: '2px solid #1e293b' }}>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 800 }}>משרד עורכי דין</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>שירותים משפטיים מקצועיים</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#2563eb' }}>קבלה</div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>מס׳ {receiptNumber}</div>
                </div>
              </div>

              {/* פרטי לקוח */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                  פרטי הלקוח
                </div>
                {[
                  { label: 'שם', value: client.name },
                  { label: 'טלפון', value: client.phone },
                  { label: 'אימייל', value: client.email || '—' },
                  { label: 'תחום', value: client.field || '—' },
                ].map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '14px' }}>
                    <span style={{ color: '#64748b' }}>{r.label}</span>
                    <span style={{ fontWeight: 600 }}>{r.value}</span>
                  </div>
                ))}
              </div>

              {/* פרטי התשלום */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                  פרטי התשלום
                </div>
                {[
                  { label: 'תאריך', value: dateStr },
                  { label: 'תיאור', value: description || 'שכר טרחה משפטי' },
                  { label: 'מודל תשלום', value: client.feeModel || '—' },
                ].map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '14px' }}>
                    <span style={{ color: '#64748b' }}>{r.label}</span>
                    <span style={{ fontWeight: 600 }}>{r.value}</span>
                  </div>
                ))}
              </div>

              {/* סכום */}
              <div style={{ background: '#f8fafc', border: '2px solid #2563eb', borderRadius: '10px', padding: '20px', margin: '24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: 700 }}>סכום ששולם</span>
                <span style={{ fontSize: '28px', fontWeight: 800, color: '#2563eb' }}>{amount}</span>
              </div>

              {/* חותמת */}
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <div style={{ display: 'inline-block', border: '2px solid #16a34a', color: '#16a34a', fontWeight: 800, fontSize: '16px', padding: '8px 24px', borderRadius: '8px', transform: 'rotate(-5deg)' }}>
                  ✓ שולם
                </div>
              </div>

              {/* פוטר */}
              <div style={{ textAlign: 'center', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', fontSize: '11px', color: '#94a3b8' }}>
                מסמך זה מהווה אישור קבלת תשלום פנימי בלבד · בהמשך יוחלף בחשבונית מס רשמית
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
