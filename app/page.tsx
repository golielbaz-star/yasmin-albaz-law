import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Stats from './components/Stats'
import WhyYasmin from './components/WhyYasmin'
import About from './components/About'
import Process from './components/Process'
import Testimonials from './components/Testimonials'
import FAQ from './components/FAQ'
import FinalCTA from './components/FinalCTA'
import Contact from './components/Contact'
import Footer from './components/Footer'
import CookieBanner from './components/CookieBanner'
import AccessibilityWidget from './components/AccessibilityWidget'
import WhatsAppButton from './components/WhatsAppButton'
import ScrollReveal from './components/ScrollReveal'

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <ScrollReveal animation="fade-in"><Stats /></ScrollReveal>
      <ScrollReveal animation="fade-up" delay={100}><WhyYasmin /></ScrollReveal>
      <ScrollReveal animation="fade-up" delay={0}><About /></ScrollReveal>
      <ScrollReveal animation="fade-up"><Process /></ScrollReveal>
      <ScrollReveal animation="fade-up" delay={100}><Testimonials /></ScrollReveal>
      <ScrollReveal animation="fade-up"><FAQ /></ScrollReveal>
      <ScrollReveal animation="fade-in"><FinalCTA /></ScrollReveal>
      <ScrollReveal animation="fade-up"><Contact /></ScrollReveal>
      <Footer />
      <CookieBanner />
      <AccessibilityWidget />
      <WhatsAppButton />
    </main>
  )
}
