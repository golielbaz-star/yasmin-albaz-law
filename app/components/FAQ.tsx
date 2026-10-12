'use client'

import { useState } from 'react'

const faqs = [
  {
    q: 'האם מגיע לי פיצוי?',
    a: 'אם נפגעת בתאונת עבודה, תאונת דרכים, או שהביטוח הלאומי דחה את תביעתך — ייתכן מאוד שמגיעים לך פיצויים שלא קיבלת. הייעוץ הראשוני חינמי ולא מחייב — בואו נבדוק יחד.',
  },
  {
    q: 'כמה עולה ייצוג משפטי?',
    a: 'שכר הטרחה נקבע בהתאם לסוג התיק ומורכבותו, ומוסכם מראש בשקיפות מלאה. הייעוץ הראשוני הוא ללא עלות.',
  },
  {
    q: 'הביטוח הלאומי כבר דחה את התביעה שלי — האם עוד יש מה לעשות?',
    a: 'בהחלט. דחיית הביטוח הלאומי היא לא סוף הדרך. יש אפשרות לערעור, ובמקרים רבים הערעור מצליח. חשוב לפעול במהירות כי יש מועדי אחרון להגשה.',
  },
  {
    q: 'כמה זמן לוקח התהליך?',
    a: 'תלוי בסוג התיק. חלק מהתביעות מסתיימות תוך מספר חודשים, אחרות דורשות יותר זמן. יסמין תסביר לכם את הציר הזמנים הצפוי כבר בפגישה הראשונה.',
  },
  {
    q: 'האם אני צריך להגיע פיזית למשרד?',
    a: 'לא בהכרח. ניתן לקיים פגישות בוידאו או בטלפון. הנגישות חשובה לנו.',
  },
  {
    q: 'מה ההבדל בין ביטוח לאומי לנזיקין?',
    a: 'ביטוח לאומי הוא תביעה מול המדינה לקצבאות ופיצויים מוסדיים. נזיקין היא תביעה אזרחית נגד הצד האחראי לנזק. לעיתים קרובות ניתן לתבוע בשני המסלולים יחד — וזה מה שאנחנו עושים.',
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i)

  return (
    <section className="bg-white py-20 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto">
        {/* Title */}
        <div className="text-center mb-12">
          <h2
            className="text-3xl md:text-4xl font-bold mb-3"
            style={{ color: '#1a1a1a', fontFamily: 'Heebo, sans-serif' }}
          >
            שאלות נפוצות
          </h2>
          <div
            className="mx-auto rounded-full"
            style={{ width: '60px', height: '4px', backgroundColor: '#C9A84C' }}
          />
        </div>

        {/* Accordion */}
        <div>
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-gray-200">
              <button
                onClick={() => toggle(i)}
                className="w-full py-5 flex justify-between items-center text-right focus:outline-none"
                aria-expanded={openIndex === i}
              >
                <span
                  className="font-semibold text-base pr-2"
                  style={{ color: '#1a1a1a', fontFamily: 'Heebo, sans-serif' }}
                >
                  {faq.q}
                </span>
                <span
                  className="flex-shrink-0 transition-transform duration-200 ml-2 text-xl"
                  style={{
                    color: '#C9A84C',
                    transform: openIndex === i ? 'rotate(180deg)' : 'rotate(0deg)',
                    display: 'inline-block',
                  }}
                >
                  ›
                </span>
              </button>

              <div
                className="overflow-hidden transition-all duration-300"
                style={{ maxHeight: openIndex === i ? '300px' : '0px' }}
              >
                <p className="text-gray-600 text-sm leading-relaxed pt-1 pb-5">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
