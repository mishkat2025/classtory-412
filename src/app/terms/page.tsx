import Link from 'next/link'
import { BookOpen, ScrollText } from 'lucide-react'

export const metadata = { title: 'Terms of Service — Classtory' }

export default function TermsPage() {
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
        <div style={{ width: 48, height: 48, backgroundColor: 'rgba(79,70,229,0.3)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <ScrollText size={22} color="#A5B4FC" />
        </div>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 40, fontWeight: 800, color: '#FFFFFF', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
          Terms of Service
        </h1>
        <p style={{ fontSize: 14, color: '#6366F1', margin: 0 }}>Last updated: April 21, 2026</p>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '56px 24px' }}>
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '40px 40px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          {[
            { title: 'Acceptance of Terms', body: 'By using Classtory, you agree to these terms. If you do not agree, please do not use the platform.' },
            { title: 'Use of the Platform', body: 'Classtory is provided for educational purposes. You agree not to misuse the platform, upload harmful content, or attempt to compromise security.' },
            { title: 'User Accounts', body: 'You are responsible for maintaining the security of your account and for all activity that occurs under your account.' },
            { title: 'Content', body: 'Teachers retain ownership of course content they create. By uploading content, you grant Classtory a license to display it within the platform.' },
            { title: 'Termination', body: 'We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time.' },
            { title: 'Changes', body: 'These terms may be updated periodically. Continued use of Classtory after changes constitutes acceptance of the new terms.' },
          ].map(({ title, body }, i, arr) => (
            <div key={title} style={{ marginBottom: i < arr.length - 1 ? 32 : 0 }}>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 10px' }}>{title}</h2>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.8, margin: 0 }}>{body}</p>
              {i < arr.length - 1 && <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', marginTop: 32 }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
