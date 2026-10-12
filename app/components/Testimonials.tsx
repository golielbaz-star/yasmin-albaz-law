const testimonials = [
  {
    quote:
      'פניתי ליסמין אחרי שהביטוח הלאומי דחה את תביעתי. היא הסבירה לי את כל הזכויות שלי בסבלנות, ניהלה את הכל בעצמה, ובסוף קיבלתי את הפיצוי המלא. מרגיש שבאמת אכפת לה.',
    name: 'ר.כ — נפגע בתאונת עבודה',
  },
  {
    quote:
      'הגעתי עם תיק שכולם אמרו לי שאין סיכוי. יסמין לא ויתרה. ניהלה את הערעור עד הסוף וניצחנו. שירות אישי ברמה אחרת.',
    name: 'מ.א — ערעור על נכות',
  },
  {
    quote:
      'בניגוד לעורכי דין אחרים שדיברתי איתם — יסמין ענתה לי בעצמה, הסבירה הכל בעברית פשוטה ולא השאירה אותי מחכה. מומלצת בחום!',
    name: 'ס.ל — תאונת דרכים',
  },
]

export default function Testimonials() {
  return (
    <section style={{ backgroundColor: '#ECECEC' }} className="py-20 px-4" dir="rtl">
      <div className="max-w-5xl mx-auto">
        {/* Title */}
        <div className="text-center mb-12">
          <h2
            className="text-3xl md:text-4xl font-bold mb-3"
            style={{ color: '#1a1a1a', fontFamily: 'Heebo, sans-serif' }}
          >
            מה אומרים הלקוחות
          </h2>
          <div
            className="mx-auto rounded-full"
            style={{ width: '60px', height: '4px', backgroundColor: '#C9A84C' }}
          />
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-8 shadow-md text-right flex flex-col gap-4"
            >
              {/* Quote mark */}
              <span
                className="text-6xl leading-none font-serif"
                style={{ color: '#C9A84C', opacity: 0.3 }}
              >
                &quot;
              </span>

              {/* Text */}
              <p className="text-gray-700 text-base leading-relaxed italic flex-1">
                {t.quote}
              </p>

              {/* Stars */}
              <div style={{ color: '#C9A84C' }} className="text-lg">
                ★★★★★
              </div>

              {/* Name */}
              <p
                className="font-semibold text-sm"
                style={{ color: '#1a1a1a' }}
              >
                {t.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
