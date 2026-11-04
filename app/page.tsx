import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">LawCRM</h1>
        <p className="text-gray-500 text-lg">מערכת ניהול לקוחות לעורכי דין</p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800"
          >
            התחברות
          </Link>
        </div>
      </div>
    </main>
  )
}
