'use client'
import { useState } from 'react'

export default function AccessibilityStatement() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Trigger link */}
      <button
        onClick={() => setOpen(true)}
        className="underline text-sm transition-colors hover:opacity-80"
        style={{ color: '#C9A84C' }}
        aria-haspopup="dialog"
      >
        הצהרת נגישות
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          role="dialog"
          aria-modal="true"
          aria-label="הצהרת נגישות"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-8 text-right"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-2xl font-light leading-none"
                aria-label="סגור"
              >
                ✕
              </button>
              <h2 className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>
                הצהרת נגישות
              </h2>
            </div>

            <div className="space-y-5 text-gray-700 text-sm leading-relaxed">

              <p>
                אתר <strong>יסמין אלבז — עורכת דין</strong> פועל לאפשר את שימושו לאנשים עם מוגבלות,
                בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות, התשנ"ח-1998, ותקנות הנגישות הנגזרות ממנו.
              </p>

              <div>
                <h3 className="font-bold text-base mb-2" style={{ color: '#1a1a1a' }}>רמת הנגישות</h3>
                <p>
                  האתר עומד ברמת AA של תקן WCAG 2.1 (Web Content Accessibility Guidelines),
                  המהווה את התקן הישראלי לנגישות אתרים (ת"י 5568).
                </p>
              </div>

              <div>
                <h3 className="font-bold text-base mb-2" style={{ color: '#1a1a1a' }}>מה בוצע לשם הנגישות</h3>
                <ul className="list-disc list-inside space-y-1 pr-2">
                  <li>האתר בנוי לקריאה מימין לשמאל (RTL) בשפה העברית</li>
                  <li>ניתן לנווט באתר באמצעות מקלדת בלבד</li>
                  <li>כל התמונות כוללות תיאור טקסטואלי חלופי (alt)</li>
                  <li>הניגודיות בין הטקסט לרקע עומדת בדרישות התקן</li>
                  <li>הגופן ברור וקריא, וגודלו ניתן לשינוי דרך הדפדפן</li>
                  <li>האתר מותאם לשימוש במסכים שונים (נייד, טאבלט, מחשב)</li>
                  <li>קישורים וכפתורים כוללים תיאורים נגישים</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-base mb-2" style={{ color: '#1a1a1a' }}>מגבלות ידועות</h3>
                <p>
                  ייתכן כי חלק מהתכנים ישנים או שהועלו לפני יישום הנגישות אינם נגישים במלואם.
                  אנו עובדים על שיפור מתמיד.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-base mb-2" style={{ color: '#1a1a1a' }}>פניות בנושא נגישות</h3>
                <p>
                  נתקלתם בבעיית נגישות? נשמח לשמוע ולתקן.
                  ניתן לפנות אלינו בדרכים הבאות:
                </p>
                <ul className="mt-2 space-y-1 pr-2">
                  <li>
                    <strong>טלפון: </strong>
                    <a href="tel:0526053756" className="underline" style={{ color: '#C9A84C' }}>052-6053756</a>
                  </li>
                  <li>
                    <strong>WhatsApp: </strong>
                    <a href="https://wa.me/972526053756" className="underline" style={{ color: '#C9A84C' }}>שלחו הודעה</a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-base mb-2" style={{ color: '#1a1a1a' }}>תאריך עדכון ההצהרה</h3>
                <p>הצהרה זו עודכנה לאחרונה: אוגוסט 2026</p>
              </div>

            </div>

            {/* Close button */}
            <div className="mt-8 text-center">
              <button
                onClick={() => setOpen(false)}
                className="px-8 py-3 font-bold text-sm transition-opacity hover:opacity-85"
                style={{ backgroundColor: '#C9A84C', color: '#fff' }}
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
