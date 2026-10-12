'use client'
import { useState } from 'react'

export default function Hero() {
  const [sent, setSent] = useState(false)

  const practiceAreas = [
    ['ביטוח לאומי', 'תאונות עבודה'],
    ['נכות כללית', 'פגיעות מקצועיות'],
    ['נזיקין ותאונות דרכים', 'דמי לידה ואמהות'],
    ['ערעורים על החלטות', 'משפט כללי'],
  ]

  return (
    <section
      className="relative flex flex-col overflow-hidden"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #E8E0D4 0%, #D4C8B8 40%, #C0B4A4 100%)',
        paddingTop: '112px',
      }}
    >
      {/* Main area — mobile: column, desktop: row */}
      <div className="flex-1 flex flex-col md:flex-row items-center md:items-end w-full max-w-7xl mx-auto px-6 md:px-8 gap-6 md:gap-8">

        {/* Yasmin image — mobile: top, centered, smaller */}
        <div className="flex md:hidden items-center justify-center pt-4">
          <img
            src="/yasmin-about.png"
            alt="עו״ד יסמין אלבז"
            className="yasmin-float object-contain select-none"
            style={{
              height: '260px',
              filter: 'drop-shadow(4px 0 24px rgba(0,0,0,0.15))',
            }}
          />
        </div>

        {/* Text — RIGHT side (full width mobile, flex-1 desktop) */}
        <div className="flex-1 text-right pb-6 md:pb-12 pt-4 md:pt-10 w-full">
          <h1
            className="font-bold leading-tight mb-3"
            style={{ color: '#1a1a1a', fontSize: 'clamp(2rem, 5vw, 4rem)' }}
          >
            יסמין אלבז — עורכת הדין
          </h1>
          <p
            className="font-semibold mb-4"
            style={{ color: '#8B7355', fontSize: 'clamp(1.1rem, 2.5vw, 1.6rem)' }}
          >
            הזכויות שלך — בידיים הנכונות
          </p>
          <p className="text-base mb-6" style={{ color: '#555' }}>
            ייצוג אישי ומקצועי מול הביטוח הלאומי ובתביעות נזיקין
          </p>

          <div className="flex justify-end mb-5">
            <span className="block h-0.5 w-20" style={{ backgroundColor: '#C9A84C' }} />
          </div>

          {/* Practice areas grid — 2 cols on desktop, 1 col on mobile */}
          <div className="hidden md:grid grid-cols-2 gap-x-10 gap-y-2.5 mb-8 text-right">
            {practiceAreas.map(([col1, col2]) => (
              <>
                <span key={col1} className="text-sm underline underline-offset-2" style={{ color: '#222' }}>{col1}</span>
                <span key={col2} className="text-sm underline underline-offset-2" style={{ color: '#222' }}>{col2}</span>
              </>
            ))}
          </div>

          {/* Mobile: simplified single-column practice areas list */}
          <div className="md:hidden flex flex-wrap gap-2 mb-6 justify-end">
            {practiceAreas.flat().map((area) => (
              <span
                key={area}
                className="text-xs px-2 py-1 rounded"
                style={{ backgroundColor: 'rgba(201,168,76,0.15)', color: '#222', border: '1px solid rgba(201,168,76,0.4)' }}
              >
                {area}
              </span>
            ))}
          </div>

          <div className="flex justify-end">
            <a
              href="#contact"
              className="inline-block px-8 py-3.5 font-bold text-sm transition-opacity hover:opacity-85"
              style={{ backgroundColor: '#C9A84C', color: '#fff' }}
            >
              לבדיקת זכויותך ←
            </a>
          </div>
        </div>

        {/* Yasmin — LEFT side, floating — desktop only */}
        <div className="hidden md:flex items-end justify-center flex-shrink-0">
          <img
            src="/yasmin-about.png"
            alt="עו״ד יסמין אלבז"
            className="yasmin-float object-contain select-none"
            style={{
              height: 'min(75vh, 560px)',
              filter: 'drop-shadow(4px 0 24px rgba(0,0,0,0.15))',
            }}
          />
        </div>
      </div>

      {/* Bottom contact strip */}
      <div className="w-full" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
          <div className="text-right flex-shrink-0">
            <p className="text-white font-bold text-sm">פנו אלינו לקבלת</p>
            <p className="font-bold text-base" style={{ color: '#C9A84C' }}>יעוץ ראשוני &raquo;&raquo;</p>
          </div>
          <div className="flex flex-col md:flex-row gap-2 md:gap-3 flex-1 md:mx-4">
            <input type="text" placeholder="*שם מלא" className="flex-1 px-4 py-2.5 text-sm text-right bg-white outline-none" />
            <input type="tel" placeholder="*טלפון" className="flex-1 px-4 py-2.5 text-sm text-right bg-white outline-none" />
            <input type="text" placeholder="במה אפשר לעזור" className="flex-1 px-4 py-2.5 text-sm text-right bg-white outline-none" />
          </div>
          <button
            onClick={() => setSent(true)}
            className="w-full md:w-auto px-8 py-3 font-bold text-sm flex-shrink-0 transition-opacity hover:opacity-85"
            style={{ backgroundColor: '#C9A84C', color: '#fff' }}
          >
            {sent ? '✓ נשלח' : 'שלח >'}
          </button>
        </div>
      </div>
    </section>
  )
}
