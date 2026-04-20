import Link from 'next/link'
import { BookOpen, Mail } from 'lucide-react'

export const metadata = { title: 'Contact — Classtory' }

export default function ContactPage() {
  return (
    <div style={{ backgroundColor: '#F8F9FC', minHeight: '100vh' }}>
      <nav style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 30, height: 30, backgroundColor: '#4F46E5', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={14} color="white" />
          </div>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 16, color: '#0F172A' }}>Classtory</span>
        </Link>
        <Link href="/" style={{ fontSize: 13, color: '#64748B', textDecoration: 'none' }}>← Back to home</Link>
      </nav>

      <div style={{ backgroundColor: '#1E1B4B', padding: '72px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 40, fontWeight: 800, color: '#FFFFFF', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
          Contact Us
        </h1>
        <p style={{ fontSize: 16, color: '#A5B4FC', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
          Have a question or feedback? We'd love to hear from you.
        </p>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '56px 24px' }}>
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '36px 32px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, backgroundColor: '#EEF2FF', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail size={18} color="#4F46E5" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>Email us</div>
              <div style={{ fontSize: 13, color: '#64748B' }}>We typically respond within 24 hours</div>
            </div>
          </div>

          <a href="mailto:hello@classtory.app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 42, width: '100%', backgroundColor: '#4F46E5', color: '#FFFFFF', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            hello@classtory.app
          </a>

          <div style={{ borderTop: '1px solid #F1F5F9', marginTop: 28, paddingTop: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>A contact form is coming soon. For now, email is the fastest way to reach us.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
