const stats = [
  { value: 'ייעוץ ראשוני חינם', sub: 'ללא התחייבות' },
  { value: '100%', sub: 'מחויבות אישית לכל תיק' },
  { value: 'טיפול ישיר', sub: 'עורכת הדין עצמה, מהפגישה ועד התוצאה' },
  { value: 'זמינות אמיתית', sub: 'גישה ישירה, לא דרך מזכירה' },
]

export default function Stats() {
  return (
    <section style={{ backgroundColor: '#1a1a1a' }} className="py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-center divide-y md:divide-y-0 md:divide-x divide-yellow-600/30">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center px-8 py-4 md:py-0 w-full md:w-auto"
            >
              <span
                className="text-3xl font-bold"
                style={{ color: '#C9A84C', fontFamily: 'Heebo, sans-serif' }}
              >
                {stat.value}
              </span>
              <span className="text-white text-sm mt-1 opacity-90">{stat.sub}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
