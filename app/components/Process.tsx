const steps = [
  {
    number: '1',
    title: 'פגישת היכרות',
    description: 'שיחה ראשונה ללא עלות להבנת המצב',
  },
  {
    number: '2',
    title: 'בחינת המקרה',
    description: 'ניתוח מעמיק של הזכויות וסיכויי ההצלחה',
  },
  {
    number: '3',
    title: 'ייצוג מלא',
    description: 'ניהול התיק מול הביטוח הלאומי / בית המשפט',
  },
  {
    number: '4',
    title: 'תוצאות',
    description: 'עבודה עד לקבלת מה שמגיע לך',
  },
]

export default function Process() {
  return (
    <section id="process" className="py-20 md:py-28" style={{ backgroundColor: '#ECECEC' }}>
      <div className="max-w-6xl mx-auto px-6">
        {/* Section title */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold" style={{ color: '#1a1a1a' }}>
            איך עובדים יחד?
          </h2>
          <div className="flex justify-center mt-4">
            <span className="block h-1 w-16 rounded-full" style={{ backgroundColor: '#C9A84C' }} />
          </div>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-6 text-center">
          {steps.map((step, index) => (
            <div key={step.number} className="flex flex-col items-center relative">
              {/* Connector line (hidden on last step and on mobile) */}
              {index < steps.length - 1 && (
                <div
                  className="hidden md:block absolute top-7 left-0 w-full h-px"
                  style={{
                    backgroundColor: 'rgba(201,168,76,0.2)',
                    left: '55%',
                    width: '90%',
                  }}
                />
              )}

              {/* Gold circle with number */}
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold mb-5 shadow-lg relative z-10"
                style={{
                  backgroundColor: '#C9A84C',
                  color: '#1a1a1a',
                }}
              >
                {step.number}
              </div>

              {/* Step title */}
              <h3 className="font-bold text-lg mb-2" style={{ color: '#1a1a1a' }}>{step.title}</h3>

              {/* Step description */}
              <p className="text-gray-600 text-sm leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
