const cards = [
  {
    icon: '👤',
    title: 'טיפול אישי בכל תיק',
    text: 'לא מזכירה, לא עוזר — עורכת הדין עצמה, מהפגישה הראשונה ועד לתוצאה.',
  },
  {
    icon: '📞',
    title: 'גישה ישירה',
    text: 'יש שאלה? מתקשרים ישירות. לא עוברים מנציג לנציג, לא נופלים בין הכיסאות.',
  },
  {
    icon: '⚡',
    title: 'פחות בירוקרטיה, יותר תוצאות',
    text: 'כל פרט בתיק מוכר לי. אין מסירות, אין אי-הבנות — תשומת לב מלאה, מהתחלה ועד הסוף.',
  },
]

export default function WhyYasmin() {
  return (
    <section id="areas" className="bg-white py-20 px-4" dir="rtl">
      <div className="max-w-5xl mx-auto">
        {/* Title */}
        <div className="text-center mb-12">
          <h2
            className="text-3xl md:text-4xl font-bold mb-3"
            style={{ color: '#1a1a1a', fontFamily: 'Heebo, sans-serif' }}
          >
            למה לבחור ביסמין?
          </h2>
          <div
            className="mx-auto mb-5 rounded-full"
            style={{ width: '60px', height: '4px', backgroundColor: '#C9A84C' }}
          />
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            במשרדים הגדולים — עוד תיק. אצלי — אדם.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {cards.map((card, i) => (
            <div
              key={i}
              className="rounded-lg p-8 text-right shadow-sm hover:shadow-md transition-shadow duration-200"
              style={{
                backgroundColor: '#F5F5F5',
                borderTop: '4px solid #C9A84C',
              }}
            >
              <div className="text-4xl mb-4">{card.icon}</div>
              <h3
                className="text-xl font-bold mb-3"
                style={{ color: '#1a1a1a', fontFamily: 'Heebo, sans-serif' }}
              >
                {card.title}
              </h3>
              <p className="text-gray-600 leading-relaxed text-sm">{card.text}</p>
            </div>
          ))}
        </div>

        {/* Highlight box */}
        <div
          className="rounded-lg p-6 text-center"
          style={{ backgroundColor: '#1a1a1a' }}
        >
          <p
            className="text-white text-lg leading-relaxed italic"
            style={{ fontFamily: 'Heebo, sans-serif' }}
          >
            &quot;כשבוחרים משרד גדול — מקבלים שעה מזמנו של עורך דין עמוס. כשבוחרים אותי — מקבלים אותי.&quot;
          </p>
        </div>
      </div>
    </section>
  )
}
