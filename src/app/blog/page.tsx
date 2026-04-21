import Link from 'next/link'
import { BookOpen, PenLine } from 'lucide-react'

export const metadata = { title: 'Blog — Classtory' }

export default function BlogPage() {
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
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 40, fontWeight: 800, color: '#FFFFFF', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
          Classtory Blog
        </h1>
        <p style={{ fontSize: 16, color: '#A5B4FC', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
          Tips, stories, and insights for educators and learners.
        </p>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '56px 24px' }}>
        <div style={{ backgroundColor: 'var(--color-surface)', border: '2px dashed var(--color-border)', borderRadius: 16, padding: '64px 32px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, backgroundColor: '#EEF2FF', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <PenLine size={24} color="#4F46E5" />
          </div>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 10px' }}>
            Posts coming soon
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', maxWidth: 360, margin: '0 auto', lineHeight: 1.7 }}>
            We're working on articles about education, product updates, and teaching strategies. Check back soon.
          </p>
        </div>
      </div>
    </div>
  )
}
