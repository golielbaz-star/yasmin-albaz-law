'use client'

import { useState } from 'react'
import AccessibilityStatement from './AccessibilityStatement'

export default function AccessibilityWidget() {
  const [panelOpen, setPanelOpen] = useState(false)
  const [highContrast, setHighContrast] = useState(false)
  const [highlightLinks, setHighlightLinks] = useState(false)

  function increaseFontSize() {
    document.documentElement.style.fontSize = '120%'
  }

  function resetFontSize() {
    document.documentElement.style.fontSize = '100%'
  }

  function toggleHighContrast() {
    const next = !highContrast
    setHighContrast(next)
    if (next) {
      document.body.classList.add('high-contrast')
    } else {
      document.body.classList.remove('high-contrast')
    }
  }

  function toggleHighlightLinks() {
    const next = !highlightLinks
    setHighlightLinks(next)
    if (next) {
      document.body.classList.add('highlight-links')
    } else {
      document.body.classList.remove('highlight-links')
    }
  }

  return (
    <div
      className="fixed bottom-6 left-6 z-50"
      style={{ direction: 'rtl' }}
    >
      {/* Panel */}
      {panelOpen && (
        <div
          className="absolute bottom-16 left-0 bg-white shadow-xl rounded-xl p-5 text-right"
          style={{ width: '16rem', direction: 'rtl' }}
        >
          {/* Close X inside panel */}
          <button
            onClick={() => setPanelOpen(false)}
            className="absolute top-3 left-3 text-gray-400 hover:text-black text-xl font-bold leading-none"
            aria-label="סגור"
          >
            ×
          </button>

          <h3 className="font-bold text-base mb-4" style={{ color: '#1a3a5c' }}>
            אפשרויות נגישות
          </h3>

          {/* Option 1: Font size */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-700">הגדלת טקסט</span>
            <div className="flex gap-2">
              <button
                onClick={increaseFontSize}
                className="px-2 py-1 rounded text-sm font-bold border border-gray-300 hover:bg-gray-100 transition-colors"
                aria-label="הגדל טקסט"
              >
                א+
              </button>
              <button
                onClick={resetFontSize}
                className="px-2 py-1 rounded text-sm font-bold border border-gray-300 hover:bg-gray-100 transition-colors"
                aria-label="הקטן טקסט"
              >
                א-
              </button>
            </div>
          </div>

          {/* Option 2: High contrast */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-700">ניגודיות גבוהה</span>
            <button
              onClick={toggleHighContrast}
              className="px-3 py-1 rounded text-xs font-semibold border transition-colors"
              style={
                highContrast
                  ? { backgroundColor: '#C9A84C', borderColor: '#C9A84C', color: '#000' }
                  : { backgroundColor: 'transparent', borderColor: '#aaa', color: '#555' }
              }
            >
              {highContrast ? 'בטל' : 'הפעל'}
            </button>
          </div>

          {/* Option 3: Highlight links */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-700">קישורים מוארים</span>
            <button
              onClick={toggleHighlightLinks}
              className="px-3 py-1 rounded text-xs font-semibold border transition-colors"
              style={
                highlightLinks
                  ? { backgroundColor: '#C9A84C', borderColor: '#C9A84C', color: '#000' }
                  : { backgroundColor: 'transparent', borderColor: '#aaa', color: '#555' }
              }
            >
              {highlightLinks ? 'בטל' : 'הפעל'}
            </button>
          </div>

          {/* Option 4: Accessibility statement */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-700">הצהרת נגישות</span>
            <AccessibilityStatement />
          </div>

          {/* Footer text */}
          <p className="text-xs text-gray-400 text-right leading-relaxed">
            בעיית נגישות? צרו קשר: 052-6053756
          </p>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setPanelOpen((prev) => !prev)}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-opacity hover:opacity-90"
        style={{ backgroundColor: '#C9A84C', color: '#1a1a1a' }}
        aria-label="אפשרויות נגישות"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
          <circle cx="12" cy="4" r="2" />
          <path d="M12 7c-1.1 0-2 .9-2 2v5h4V9c0-1.1-.9-2-2-2zm-4 9l-2 5h2l1.5-3.5L12 19l2.5-2.5L16 22h2l-2-5H8z" />
        </svg>
      </button>
    </div>
  )
}
