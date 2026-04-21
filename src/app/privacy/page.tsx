import Link from 'next/link'
import { BookOpen, Shield } from 'lucide-react'

export const metadata = { title: 'Privacy Policy — Classtory' }

export default function PrivacyPage() {
  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}>
      <nav style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid #E2E8F0', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
          <Shield size={22} color="#A5B4FC" />
        </div>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 40, fontWeight: 800, color: '#FFFFFF', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: 14, color: '#6366F1', margin: 0 }}>Last updated: April 21, 2026</p>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '56px 24px' }}>
        <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, padding: '40px 40px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          {[
            { title: 'Information We Collect', body: 'We collect information you provide directly, such as your name, email address, and role when you create an account. We also collect usage data to improve the platform.' },
            { title: 'How We Use Your Information', body: 'Your information is used to operate and improve Classtory, communicate with you about your account, and provide educational services. We do not sell your personal data.' },
            { title: 'Data Storage', body: 'Data is stored securely using Supabase (PostgreSQL) with row-level security policies. All data is encrypted in transit and at rest.' },
            { title: 'Your Rights', body: 'You can request access to, correction of, or deletion of your personal data at any time by contacting us at hello@classtory.app.' },
            { title: 'Contact', body: 'For privacy-related questions, email us at hello@classtory.app. A full legal privacy policy document will be published here soon.' },
          ].map(({ title, body }, i, arr) => (
            <div key={title} style={{ marginBottom: i < arr.length - 1 ? 32 : 0 }}>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 10px' }}>{title}</h2>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.8, margin: 0 }}>{body}</p>
              {i < arr.length - 1 && <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', marginTop: 32 }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
