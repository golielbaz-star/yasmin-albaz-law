'use client'

import { useState, useEffect } from 'react'
import PrivacyPolicy from './PrivacyPolicy'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('cookieConsent')) {
      setVisible(true)
    }
  }, [])

  function handleAccept() {
    localStorage.setItem('cookieConsent', 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 z-50 w-full flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4"
        style={{ backgroundColor: '#1a1a1a', direction: 'rtl' }}
      >
        <p className="text-white text-sm text-right leading-relaxed flex-1">
          אתר זה משתמש בעוגיות (Cookies) לצורך שיפור חוויית המשתמש. המשך שימוש באתר מהווה הסכמה לשימוש בעוגיות.
        </p>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Gold accept button */}
          <button
            onClick={handleAccept}
            className="px-5 py-2 rounded-lg font-semibold text-black text-sm transition-opacity hover:opacity-80 whitespace-nowrap"
            style={{ backgroundColor: '#C9A84C' }}
          >
            אני מסכים/ה
          </button>

          {/* Outlined white button */}
          <button
            onClick={() => setPrivacyOpen(true)}
            className="px-5 py-2 rounded-lg font-semibold text-white text-sm border border-white transition-colors hover:bg-white hover:text-black whitespace-nowrap"
            style={{ backgroundColor: 'transparent' }}
          >
            מדיניות פרטיות
          </button>
        </div>
      </div>

      <PrivacyPolicy open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </>
  )
}
