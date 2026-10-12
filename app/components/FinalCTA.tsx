const badges = [
  'ייעוץ ראשוני חינם',
  'טיפול אישי בכל תיק',
  'גישה ישירה לעורכת הדין',
]

export default function FinalCTA() {
  return (
    <section
      style={{ backgroundColor: '#B0B0B0' }}
      className="py-20 px-4 text-center"
      dir="rtl"
    >
      <div className="max-w-2xl mx-auto">
        {/* Heading */}
        <h2
          className="text-3xl md:text-4xl font-bold mb-4"
          style={{ color: '#1a1a1a', fontFamily: 'Heebo, sans-serif' }}
        >
          מגיע לך לדעת מה הזכויות שלך
        </h2>

        {/* Gold subheading */}
        <p
          className="text-xl font-semibold mb-6"
          style={{ color: '#C9A84C', fontFamily: 'Heebo, sans-serif' }}
        >
          ייעוץ ראשוני חינמי — ללא התחייבות, ללא תשלום
        </p>

        {/* Body */}
        <p className="text-gray-600 mb-10 text-base leading-relaxed">
          אל תוותרו על מה שמגיע לכם. פנו אלינו עכשיו ויסמין תבדוק את המקרה שלכם אישית.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
          <a
            href="#contact"
            className="px-8 py-4 rounded-lg font-bold text-lg transition-opacity hover:opacity-90"
            style={{
              backgroundColor: '#C9A84C',
              color: '#1a1a1a',
              fontFamily: 'Heebo, sans-serif',
            }}
          >
            השאירו פרטים ונחזור אליכם
          </a>
          <a
            href="tel:0526053756"
            className="px-8 py-4 rounded-lg font-bold text-lg border-2 transition-all hover:bg-gray-200"
            style={{ borderColor: '#1a1a1a', color: '#1a1a1a', fontFamily: 'Heebo, sans-serif' }}
          >
            052-6053756
          </a>
        </div>

        {/* Trust badges */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {badges.map((badge, i) => (
            <div key={i} className="flex items-center gap-2 text-gray-700 text-sm">
              <span
                className="font-bold text-base"
                style={{ color: '#C9A84C' }}
              >
                ✓
              </span>
              <span>{badge}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
