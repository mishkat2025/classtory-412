import Link from 'next/link'
import { BookOpen } from 'lucide-react'

export const metadata = { title: 'Pricing — Classtory' }

const plans = [
  {
    name: 'Student',
    price: 'Free',
    desc: 'Everything you need to learn and collaborate.',
    color: '#4F46E5',
    bg: 'var(--color-primary-light)',
    features: ['Join unlimited classrooms', 'Submit assignments', 'Browse marketplace courses', 'View grades & attendance'],
  },
  {
    name: 'Teacher',
    price: 'Free',
    desc: 'Powerful tools for educators, at no cost.',
    color: '#10B981',
    bg: 'var(--color-success-light)',
    features: ['Create unlimited classrooms', 'Publish marketplace courses', 'Grade & give feedback', 'Attendance tracking', 'Export grade reports'],
  },
]

export default function PricingPage() {
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
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 40, fontWeight: 800, color: '#FFFFFF', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
          Simple Pricing
        </h1>
        <p style={{ fontSize: 16, color: '#A5B4FC', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
          Classtory is free for students and teachers. No credit card required.
        </p>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '56px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {plans.map(plan => (
            <div key={plan.name} style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ backgroundColor: plan.bg, padding: '28px 28px 24px', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: plan.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{plan.name}</div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 36, fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 8 }}>{plan.price}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{plan.desc}</div>
              </div>
              <div style={{ padding: '24px 28px' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px' }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                      <span style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: plan.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, color: plan.color, fontWeight: 700 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/signup" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 40, backgroundColor: plan.color, color: '#FFFFFF', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                  Get started free
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
