import Link from 'next/link'
import { BookOpen, Cookie } from 'lucide-react'

export const metadata = { title: 'Cookie Policy — Classtory' }

export default function CookiesPage() {
  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}>
      <nav style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 30, height: 30, backgroundColor: '#4F46E5', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={14} color="white" />
          </div>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--color-text-primary)' }}>Classtory</span>
        </Link>
        <Link href="/" style={{ fontSize: 13, color: 'var(--color-text-secondary)', textDecoration: 'none' }}>← Back to home</Link>
      </nav>

      <div style={{ backgroundColor: '#1E1B4B', padding: '72px 24px', textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, backgroundColor: 'rgba(79,70,229,0.3)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Cookie size={22} color="#A5B4FC" />
        </div>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 40, fontWeight: 800, color: '#FFFFFF', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
          Cookie Policy
        </h1>
        <p style={{ fontSize: 14, color: '#6366F1', margin: 0 }}>Last updated: April 21, 2026</p>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '56px 24px' }}>
        <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, padding: '40px 40px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          {[
            { title: 'What Are Cookies', body: 'Cookies are small text files stored on your device when you visit a website. They help us keep you logged in and remember your preferences.' },
            { title: 'Cookies We Use', body: 'We use session cookies required for authentication (via Supabase). These are strictly necessary for the platform to function and cannot be disabled.' },
            { title: 'No Tracking Cookies', body: 'Classtory does not use advertising cookies, third-party tracking cookies, or analytics cookies that identify you personally.' },
            { title: 'Managing Cookies', body: 'You can control cookies through your browser settings. Disabling cookies may prevent you from logging in or using core features of the platform.' },
          ].map(({ title, body }, i, arr) => (
            <div key={title} style={{ marginBottom: i < arr.length - 1 ? 32 : 0 }}>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 10px' }}>{title}</h2>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.8, margin: 0 }}>{body}</p>
              {i < arr.length - 1 && <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', marginTop: 32 }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
