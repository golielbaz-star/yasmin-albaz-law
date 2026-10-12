export default function About() {
  return (
    <section id="about" className="py-20 md:py-28" style={{ backgroundColor: '#ECECEC' }}>
      <div className="max-w-6xl mx-auto px-6">
        {/* Section title */}
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-navy-900" style={{ color: '#1a1a1a' }}>
            על יסמין אלבז
          </h2>
          {/* Gold underline */}
          <div className="flex justify-center mt-4">
            <span className="block h-1 w-16 rounded-full" style={{ backgroundColor: '#C9A84C' }} />
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Text column — right side (RTL: first in DOM) */}
          <div className="space-y-6 text-right">
            <p
              className="text-base md:text-lg leading-relaxed"
              style={{ color: '#2D3748' }}
            >
              עורכת דין יסמין אלבז מתמחה בדיני ביטוח לאומי ונזיקין, עם ניסיון מעמיק שנרכש
              במהלך התמחות ייעודית בביטוח לאומי.
            </p>
            <p
              className="text-base md:text-lg leading-relaxed"
              style={{ color: '#2D3748' }}
            >
              היא מביאה הבנה יסודית של מערכת הביטוח הלאומי ושל זכויות הנפגעים — ומתחייבת
              לליווי אישי, מקצועי ואמין לאורך כל הדרך.
            </p>
            <p
              className="text-base md:text-lg leading-relaxed"
              style={{ color: '#2D3748' }}
            >
              כל תיק מטופל בקפידה, עם מתן תשומת לב מלאה לפרטים ולצרכי הלקוח.
            </p>

            {/* Gold accent detail */}
            <div className="flex items-center gap-3 pt-2">
              <span className="block h-px flex-1 max-w-xs" style={{ backgroundColor: '#C9A84C', opacity: 0.4 }} />
              <span className="text-sm font-medium" style={{ color: '#C9A84C' }}>
                ייצוג אישי. תוצאות מקצועיות.
              </span>
            </div>
          </div>

          {/* Yasmin — left side floating */}
          <div className="flex justify-center md:justify-start items-end">
            <img
              src="/yasmin-cutout.png"
              alt="עו״ד יסמין אלבז"
              className="w-64 md:w-80 object-contain"
              style={{ filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.18))' }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
