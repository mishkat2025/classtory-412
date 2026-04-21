import Link from 'next/link'
import { BookOpen, Users, Globe, Sparkles } from 'lucide-react'

export const metadata = { title: 'About — Classtory' }

export default function AboutPage() {
  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 30, height: 30, backgroundColor: '#4F46E5', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={14} color="white" />
          </div>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--color-text-primary)' }}>Classtory</span>
        </Link>
        <Link href="/" style={{ fontSize: 13, color: 'var(--color-text-secondary)', textDecoration: 'none' }}>← Back to home</Link>
      </nav>

      {/* Hero */}
      <div style={{ backgroundColor: '#1E1B4B', padding: '72px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 40, fontWeight: 800, color: '#FFFFFF', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
          About Classtory
        </h1>
        <p style={{ fontSize: 16, color: '#A5B4FC', maxWidth: 540, margin: '0 auto', lineHeight: 1.7 }}>
          We're building the future of education — connecting learners and teachers through powerful, intuitive tools.
        </p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '56px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 48 }}>
          {[
            { icon: Users,    color: 'var(--color-primary-light)', iconColor: '#4F46E5', title: 'Community First',  desc: 'Built for students and teachers, not shareholders.' },
            { icon: Globe,    color: '#D1FAE5', iconColor: '#10B981', title: 'Global Reach',      desc: 'Accessible to learners everywhere, in every timezone.' },
            { icon: Sparkles, color: '#FEF3C7', iconColor: '#F59E0B', title: 'Always Improving',  desc: 'Continuously updated based on real classroom feedback.' },
          ].map(({ icon: Icon, color, iconColor, title, desc }) => (
            <div key={title} style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '24px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Icon size={18} color={iconColor} />
              </div>
              <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 6px' }}>{title}</h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>

        <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, padding: '36px 32px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 16px' }}>Our Mission</h2>
          <p style={{ fontSize: 15, color: 'var(--color-text-secondary)', lineHeight: 1.8, margin: '0 0 16px' }}>
            Classtory was founded with a simple belief: great education should be accessible to everyone. We combine a public course marketplace with private classroom tools so that teachers can reach students both inside and outside the traditional classroom.
          </p>
          <p style={{ fontSize: 15, color: 'var(--color-text-secondary)', lineHeight: 1.8, margin: 0 }}>
            More content coming soon as we continue to grow our story.
          </p>
        </div>
      </div>
    </div>
  )
}
