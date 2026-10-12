const areas = [
  {
    icon: '⚖️',
    title: 'ביטוח לאומי',
    bullets: [
      'תאונות עבודה ופגיעות מקצועיות',
      'דמי לידה ואמהות',
      'נכות כללית ונכות מעבודה',
      'דמי אבטלה וקצבאות',
      'ערעורים על החלטות המוסד',
    ],
  },
  {
    icon: '🏥',
    title: 'נזיקין',
    bullets: [
      'תאונות דרכים',
      'תאונות עבודה',
      'רשלנות רפואית',
      'נפילות ותאונות ברשות הרבים',
      'תביעות פיצויים',
    ],
  },
  {
    icon: '📋',
    title: 'משפט כללי',
    bullets: [
      'ייעוץ וליווי משפטי',
      'חוזים והסכמים',
      'מכתבי דרישה',
      'ייצוג מול רשויות',
    ],
  },
]

export default function PracticeAreas() {
  return (
    <section className="py-20 md:py-28" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-6xl mx-auto px-6">
        {/* Section title */}
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold" style={{ color: '#1a1a1a' }}>
            תחומי עיסוק
          </h2>
          <div className="flex justify-center mt-4">
            <span className="block h-1 w-16 rounded-full" style={{ backgroundColor: '#C9A84C' }} />
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {areas.map((area) => (
            <div
              key={area.title}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 p-8 text-right flex flex-col"
              style={{
                borderTop: '4px solid #C9A84C',
              }}
            >
              {/* Icon */}
              <div className="text-4xl mb-4">{area.icon}</div>

              {/* Title */}
              <h3 className="text-xl font-bold mb-5" style={{ color: '#1a1a1a' }}>
                {area.title}
              </h3>

              {/* Bullets */}
              <ul className="space-y-3 flex-1">
                {area.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2 text-right">
                    <span
                      className="mt-1.5 block w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: '#C9A84C' }}
                    />
                    <span className="text-gray-600 text-sm leading-relaxed">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
