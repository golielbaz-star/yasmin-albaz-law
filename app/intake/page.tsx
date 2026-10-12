'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

const fieldOptions = ['נזיקין ותאונות', 'חוזים ומסחר', 'דיני עבודה', 'מקרקעין', 'דיני משפחה', 'פלילי', 'מנהלי', 'אחר']

export default function IntakePage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [fileLabels, setFileLabels] = useState<{ [key: number]: string }>({})
  const [form, setForm] = useState({
    name: '', phone: '', email: '', id_number: '', address: '',
    field: '', summary: '', critical_dates: ''
  })

  function setField(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)])
    }
  }

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index))
    setFileLabels(prev => {
      const updated = { ...prev }
      delete updated[index]
      return updated
    })
  }

  async function handleSubmit() {
    if (!form.name || !form.phone) return
    setLoading(true)

    try {
      // שמירת הלקוח
      const { data: client, error } = await supabase
        .from('clients')
        .insert({
          name: form.name,
          phone: form.phone,
          email: form.email,
          id_number: form.id_number,
          address: form.address,
          field: form.field,
          status: 'onboarding',
          summary: form.summary,
          critical_dates: form.critical_dates,
          source: 'intake_form'
        })
        .select()
        .single()

      if (error) throw error

      // העלאת קבצים
      for (const [idx, file] of files.entries()) {
        const ext = file.name.split('.').pop() || ''
        const safeName = Date.now() + '.' + ext
        const filePath = `${client.id}/${safeName}`
        const { error: uploadError } = await supabase.storage
          .from('client-files')
          .upload(filePath, file)

        if (uploadError) {
          console.error('Upload error:', uploadError)
        } else {
          const ext = file.name.split('.').pop()?.toUpperCase() || 'קובץ'
          const label = fileLabels[idx]?.trim() || file.name
          const { error: dbError } = await supabase.from('documents').insert({
            client_id: client.id,
            name: label,
            file_path: filePath,
            file_type: ext,
            uploaded_at: new Date().toLocaleDateString('he-IL'),
            category: 'כללי'
          })
          if (dbError) console.error('DB error:', dbError)
        }
      }

      setSubmitted(true)
    } catch (err: any) {
      console.error('Intake error:', err)
      alert('שגיאה: ' + (err?.message || JSON.stringify(err)))
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">הפרטים נשלחו בהצלחה!</h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            קיבלנו את פנייתך. נחזור אליך בהקדם האפשרי לתיאום שיחת ייעוץ ראשונית.
          </p>
          <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 font-medium">
            📞 לכל שאלה דחופה — צור קשר ישירות עם המשרד
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">

      {/* Header */}
      <div className="bg-slate-900 text-white py-8 px-4 text-center">
        <h1 className="text-2xl font-bold">משרד עורכי דין</h1>
        <p className="text-slate-400 text-sm mt-1">טופס פנייה ראשונית — ממולא על ידי הלקוח</p>
      </div>

      <div className="max-w-2xl mx-auto p-4 py-8">

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                step > s ? 'bg-emerald-500 text-white' : step === s ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'
              }`}>
                {step > s ? '✓' : s}
              </div>
              {s < 3 && <div className={`flex-1 h-1 mx-2 rounded ${step > s ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">

          {/* שלב 1: פרטים אישיים */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">פרטים אישיים</h2>
              <p className="text-sm text-slate-500 mb-6">נשמח להכיר — ממלא את הפרטים הבסיסיים</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">שם מלא <span className="text-red-500">*</span></label>
                  <input value={form.name} onChange={e => setField('name', e.target.value)}
                    placeholder="ישראל ישראלי"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">טלפון <span className="text-red-500">*</span></label>
                  <input value={form.phone} onChange={e => setField('phone', e.target.value)}
                    placeholder="050-0000000" type="tel"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">אימייל</label>
                  <input value={form.email} onChange={e => setField('email', e.target.value)}
                    placeholder="email@example.com" type="email"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">תעודת זהות</label>
                  <input value={form.id_number} onChange={e => setField('id_number', e.target.value)}
                    placeholder="000000000"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">כתובת מגורים</label>
                  <input value={form.address} onChange={e => setField('address', e.target.value)}
                    placeholder="רחוב, מספר, עיר"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!form.name || !form.phone}
                className="w-full mt-6 bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                המשך לשלב הבא ←
              </button>
            </div>
          )}

          {/* שלב 2: תיאור המקרה */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">תיאור הפנייה</h2>
              <p className="text-sm text-slate-500 mb-6">ספר לנו בקצרה על המקרה שלך</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">תחום משפטי</label>
                  <select value={form.field} onChange={e => setField('field', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">בחר תחום...</option>
                    {fieldOptions.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">תיאור המקרה</label>
                  <textarea value={form.summary} onChange={e => setField('summary', e.target.value)}
                    placeholder="תאר בכמה מילים את הנושא שבו תרצה ייעוץ או ייצוג משפטי..."
                    rows={5}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">מועדים חשובים (אם יש)</label>
                  <input value={form.critical_dates} onChange={e => setField('critical_dates', e.target.value)}
                    placeholder="לדוג׳ שימוע ב-20/11/2026, תאריך הגשה..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)}
                  className="px-6 bg-slate-100 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-200 transition">
                  → חזרה
                </button>
                <button onClick={() => setStep(3)}
                  className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition">
                  המשך ←
                </button>
              </div>
            </div>
          )}

          {/* שלב 3: העלאת מסמכים */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">מסמכים רלוונטיים</h2>
              <p className="text-sm text-slate-500 mb-6">אם יש מסמכים שיכולים לעזור — העלה אותם כאן (לא חובה)</p>

              <label className="block w-full border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition">
                <input type="file" multiple onChange={handleFiles} className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                <p className="text-3xl mb-2">📎</p>
                <p className="font-semibold text-slate-700">לחץ להעלאת קבצים</p>
                <p className="text-xs text-slate-400 mt-1">PDF, Word, תמונות — עד 10MB לקובץ</p>
              </label>

              {files.length > 0 && (
                <div className="mt-4 space-y-3">
                  {files.map((f, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xl">📄</span>
                        <span className="text-sm font-medium text-slate-600 flex-1 truncate">{f.name}</span>
                        <button
                          onClick={() => removeFile(i)}
                          className="text-red-400 hover:text-red-600 text-lg leading-none"
                        >×</button>
                      </div>
                      <input
                        value={fileLabels[i] || ''}
                        onChange={e => setFileLabels(prev => ({ ...prev, [i]: e.target.value }))}
                        placeholder="מה הקובץ? לדוג׳ תעודת זהות, חוזה עבודה, דוח רפואי..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(2)}
                  className="px-6 bg-slate-100 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-200 transition">
                  → חזרה
                </button>
                <button onClick={handleSubmit} disabled={loading}
                  className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition disabled:opacity-60">
                  {loading ? 'שולח...' : '✅ שלח את הפנייה'}
                </button>
              </div>

              <p className="text-center text-xs text-slate-400 mt-4">
                המידע שמסרת מוגן ומשמש אך ורק לצורך הייעוץ המשפטי
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
