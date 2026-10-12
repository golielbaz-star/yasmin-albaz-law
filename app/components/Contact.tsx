'use client'

import { useState } from 'react'

export default function Contact() {
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    message: '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // For now: show success state (no backend)
    setSubmitted(true)
  }

  return (
    <section id="contact" className="py-20 md:py-28" style={{ backgroundColor: '#ECECEC' }}>
      <div className="max-w-6xl mx-auto px-6">
        {/* Section title */}
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold" style={{ color: '#1a1a1a' }}>
            צרו קשר
          </h2>
          <div className="flex justify-center mt-4">
            <span className="block h-1 w-16 rounded-full" style={{ backgroundColor: '#C9A84C' }} />
          </div>
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Left column: contact info */}
          <div className="space-y-7 text-right order-2 md:order-1">
            <h3 className="text-xl font-bold" style={{ color: '#1a1a1a' }}>
              פרטי יצירת קשר
            </h3>

            {/* Phone */}
            <a
              href="tel:0526053756"
              className="flex items-center gap-3 justify-end group"
            >
              <span
                className="text-base font-semibold group-hover:underline"
                style={{ color: '#1a1a1a' }}
              >
                052-6053756
              </span>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#1a1a1a' }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="#C9A84C"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                  />
                </svg>
              </div>
            </a>

            {/* WhatsApp */}
            <a
              href="https://wa.me/972526053756"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 justify-end group"
            >
              <span
                className="text-base font-semibold group-hover:underline"
                style={{ color: '#1a1a1a' }}
              >
                שלחו הודעה בוואטסאפ
              </span>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#25D366' }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="white"
                  className="w-5 h-5"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
            </a>

            {/* Extra info */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 justify-end">
                <p className="text-gray-600 text-sm">זמינה לפגישות פרונטליות ובוידאו</p>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="#C9A84C"
                  className="w-5 h-5 flex-shrink-0"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                  />
                </svg>
              </div>
              <div className="flex items-center gap-3 justify-end">
                <p className="text-gray-600 text-sm font-medium" style={{ color: '#C9A84C' }}>
                  ייעוץ ראשוני ללא עלות
                </p>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="#C9A84C"
                  className="w-5 h-5 flex-shrink-0"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Right column: contact form */}
          <div
            className="bg-white rounded-xl shadow-md p-8 text-right order-1 md:order-2"
            style={{ borderTop: '4px solid #C9A84C' }}
          >
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                  style={{ backgroundColor: '#C9A84C' }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="#1a1a1a"
                    className="w-8 h-8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-2" style={{ color: '#1a1a1a' }}>
                  תודה!
                </h3>
                <p className="text-gray-500 text-base">נחזור אליך בהקדם.</p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="space-y-5"
                name="contact"
                method="POST"
                data-netlify="true"
              >
                <input type="hidden" name="form-name" value="contact" />
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-semibold mb-1"
                    style={{ color: '#1a1a1a' }}
                  >
                    שם מלא <span style={{ color: '#C9A84C' }}>*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={handleChange}
                    placeholder="ישראל ישראלי"
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-right text-sm focus:outline-none focus:ring-2 focus:border-transparent transition"
                    style={
                      {
                        '--tw-ring-color': '#C9A84C',
                      } as React.CSSProperties
                    }
                    onFocus={(e) => (e.target.style.borderColor = '#C9A84C')}
                    onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-semibold mb-1"
                    style={{ color: '#1a1a1a' }}
                  >
                    טלפון <span style={{ color: '#C9A84C' }}>*</span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="05X-XXX-XXXX"
                    dir="ltr"
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-right text-sm focus:outline-none transition"
                    onFocus={(e) => (e.target.style.borderColor = '#C9A84C')}
                    onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-semibold mb-1"
                    style={{ color: '#1a1a1a' }}
                  >
                    תיאור קצר של הפנייה
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={form.message}
                    onChange={handleChange}
                    placeholder="ספרו לנו בקצרה על הנושא שבו אתם זקוקים לעזרה..."
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-right text-sm focus:outline-none transition resize-none"
                    onFocus={(e) => (e.target.style.borderColor = '#C9A84C')}
                    onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 rounded-lg font-bold text-base transition-all duration-300 hover:opacity-90 hover:shadow-lg"
                  style={{
                    backgroundColor: '#C9A84C',
                    color: '#1a1a1a',
                  }}
                >
                  שלחו פנייה
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
