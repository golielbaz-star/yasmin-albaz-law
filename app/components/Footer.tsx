import AccessibilityStatement from './AccessibilityStatement'

export default function Footer() {
  return (
    <footer className="py-6 text-center" style={{ backgroundColor: '#1a1a1a' }}>
      <div className="max-w-6xl mx-auto px-6 space-y-3">
        <div className="flex items-center justify-center gap-4 flex-wrap text-sm">
          <AccessibilityStatement />
          <span className="text-gray-600">|</span>
          <span className="text-gray-400">אין באמור לעיל משום ייעוץ משפטי</span>
        </div>
        <p className="text-gray-500 text-xs">
          &copy; 2026 יסמין אלבז — עו&quot;ד&nbsp;&nbsp;|&nbsp;&nbsp;כל הזכויות שמורות
        </p>
      </div>
    </footer>
  )
}
