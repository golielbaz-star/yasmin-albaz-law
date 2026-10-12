import type { Metadata } from 'next'
import { Heebo } from 'next/font/google'
import './globals.css'

const heebo = Heebo({
  subsets: ['hebrew'],
  variable: '--font-heebo',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'יסמין אלבז — עו"ד | ביטוח לאומי, נזיקין, משפט כללי',
  description: 'עורכת דין יסמין אלבז — ייצוג משפטי מקצועי בתחומי ביטוח לאומי, נזיקין ומשפט כללי. ייעוץ ראשוני ללא עלות.',
  keywords: 'עורכת דין, ביטוח לאומי, נזיקין, משפט כללי, יסמין אלבז',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className={`font-hebrew antialiased`}>
        {children}
      </body>
    </html>
  )
}
