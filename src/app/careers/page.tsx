import Link from 'next/link'
import { BookOpen, Briefcase } from 'lucide-react'

export const metadata = { title: 'Careers — Classtory' }

export default function CareersPage() {
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
          Careers
        </h1>
        <p style={{ fontSize: 16, color: '#A5B4FC', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
          Join us in building the future of education.
        </p>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '56px 24px' }}>
        <div style={{ backgroundColor: '#FFFFFF', border: '2px dashed #E2E8F0', borderRadius: 16, padding: '64px 32px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, backgroundColor: '#D1FAE5', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Briefcase size={24} color="#10B981" />
          </div>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 700, color: '#0F172A', margin: '0 0 10px' }}>
            No open positions yet
          </h2>
          <p style={{ fontSize: 14, color: '#64748B', maxWidth: 360, margin: '0 auto 24px', lineHeight: 1.7 }}>
            We're a small team building something big. Job listings will appear here when we're ready to grow.
          </p>
          <Link href="/contact" style={{ display: 'inline-flex', alignItems: 'center', height: 38, padding: '0 20px', backgroundColor: '#4F46E5', color: '#FFFFFF', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            Get in touch anyway
          </Link>
        </div>
      </div>
    </div>
  )
}
