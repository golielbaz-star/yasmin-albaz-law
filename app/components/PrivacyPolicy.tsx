'use client'

interface PrivacyPolicyProps {
  open: boolean
  onClose: () => void
}

export default function PrivacyPolicy({ open, onClose }: PrivacyPolicyProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="relative bg-white max-w-2xl w-full mx-4 rounded-xl p-8 overflow-y-auto text-right"
        style={{ maxHeight: '85vh', direction: 'rtl' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close X button — top-left (visually, which is inline-start in RTL) */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-500 hover:text-black text-2xl font-bold leading-none"
          aria-label="סגור"
        >
          ×
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#1a1a1a' }}>
          מדיניות פרטיות
        </h2>
        {/* Gold underline bar */}
        <div className="mb-6 h-1 w-16 rounded" style={{ backgroundColor: '#C9A84C' }} />

        {/* Section 1 */}
        <section className="mb-5">
          <h3 className="font-bold text-lg mb-1" style={{ color: '#1a1a1a' }}>כללי</h3>
          <p className="text-gray-700 leading-relaxed">
            אתר זה מופעל על ידי יסמין אלבז, עורכת דין (להלן: &quot;המשרד&quot;). מדיניות פרטיות זו מסבירה כיצד אנו אוספים, משתמשים ומגנים על המידע האישי שלכם, בהתאם לחוק הגנת הפרטיות, התשמ&quot;א-1981 ותיקון 13 לחוק (אוגוסט 2025).
          </p>
        </section>

        {/* Section 2 */}
        <section className="mb-5">
          <h3 className="font-bold text-lg mb-1" style={{ color: '#1a1a1a' }}>מידע שאנו אוספים</h3>
          <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1" style={{ paddingRight: '1rem' }}>
            <li>פרטים שמסרתם מרצונכם בטופס יצירת קשר (שם, טלפון, תוכן הפנייה)</li>
            <li>נתוני גלישה בסיסיים לצורך שיפור האתר (כתובת IP, סוג דפדפן)</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="mb-5">
          <h3 className="font-bold text-lg mb-1" style={{ color: '#1a1a1a' }}>כיצד אנו משתמשים במידע</h3>
          <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1" style={{ paddingRight: '1rem' }}>
            <li>יצירת קשר בחזרה בהתאם לפנייתכם</li>
            <li>שיפור חוויית השימוש באתר</li>
            <li>לא נעביר את פרטיכם לצד שלישי ללא הסכמתכם, למעט כנדרש על פי דין</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="mb-5">
          <h3 className="font-bold text-lg mb-1" style={{ color: '#1a1a1a' }}>שמירת המידע</h3>
          <p className="text-gray-700 leading-relaxed">
            המידע נשמר באופן מאובטח ולא יותר מהנדרש לצורך הטיפול בפנייתכם.
          </p>
        </section>

        {/* Section 5 */}
        <section className="mb-5">
          <h3 className="font-bold text-lg mb-1" style={{ color: '#1a1a1a' }}>זכויותיכם</h3>
          <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1" style={{ paddingRight: '1rem' }}>
            <li>זכות לעיין במידע האצור עליכם</li>
            <li>זכות לתקן מידע שגוי</li>
            <li>זכות למחיקת המידע (&quot;הזכות להישכח&quot;)</li>
            <li>לממוש זכויותיכם פנו אלינו: 052-6053756</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="mb-5">
          <h3 className="font-bold text-lg mb-1" style={{ color: '#1a1a1a' }}>עוגיות (Cookies)</h3>
          <p className="text-gray-700 leading-relaxed">
            האתר משתמש בעוגיות בסיסיות לצורך תפקוד תקין ושיפור חוויית המשתמש. ניתן לבטל עוגיות בהגדרות הדפדפן.
          </p>
        </section>

        {/* Section 7 */}
        <section className="mb-5">
          <h3 className="font-bold text-lg mb-1" style={{ color: '#1a1a1a' }}>יצירת קשר</h3>
          <p className="text-gray-700 leading-relaxed">
            לכל שאלה בנושא פרטיות: טלפון 052-6053756 | עו&quot;ד יסמין אלבז
          </p>
        </section>

        {/* Section 8 */}
        <section className="mb-8">
          <h3 className="font-bold text-lg mb-1" style={{ color: '#1a1a1a' }}>עדכון אחרון</h3>
          <p className="text-gray-700 leading-relaxed">אוגוסט 2026</p>
        </section>

        {/* Close button at bottom center */}
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="px-8 py-2 rounded-lg font-semibold text-black transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#C9A84C' }}
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  )
}
