export default function Navbar() {
  return (
    <nav
      className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between px-6 py-2"
      style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid rgba(201,168,76,0.2)' }}
    >
      {/* Logo — right (first in RTL) */}
      <img
        src="/logo.png"
        alt="יסמין אלבז עורכת דין"
        className="h-28 w-auto"
      />

      {/* Nav links — center */}
      <div className="hidden md:flex items-center gap-6 text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
        <a href="#about" className="hover:text-white transition-colors">אודות</a>
        <a href="#areas" className="hover:text-white transition-colors">תחומי עיסוק</a>
        <a href="#process" className="hover:text-white transition-colors">איך עובדים</a>
        <a href="#contact" className="hover:text-white transition-colors">צרו קשר</a>
      </div>

      {/* Phone — left (last in RTL) */}
      <a
        href="tel:0526053756"
        className="font-bold text-base tracking-wide"
        style={{ color: '#C9A84C' }}
      >
        052-6053756
      </a>
    </nav>
  )
}
