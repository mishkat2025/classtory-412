import type { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, GraduationCap, Users, BarChart3 } from 'lucide-react'
import { SignupForm } from '@/components/auth/SignupForm'

export const metadata: Metadata = {
  title: 'Create account — Classtory',
}

export default function SignupPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: 'var(--color-bg)',
      }}
    >
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex"
        style={{
          width: 480,
          minWidth: 480,
          backgroundColor: '#1E1B4B',
          flexDirection: 'column',
          padding: '48px 52px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decoration */}
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 320,
            height: 320,
            borderRadius: '50%',
            backgroundColor: 'rgba(79,70,229,0.18)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -60,
            left: -60,
            width: 240,
            height: 240,
            borderRadius: '50%',
            backgroundColor: 'rgba(99,102,241,0.12)',
            pointerEvents: 'none',
          }}
        />

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', position: 'relative' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: '#4F46E5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BookOpen size={20} color="#fff" />
          </div>
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 800,
              fontSize: 20,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
            }}
          >
            Classtory
          </span>
        </Link>

        {/* Headline */}
        <div style={{ marginTop: 'auto', marginBottom: 'auto', position: 'relative' }}>
          <h1
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 800,
              fontSize: 36,
              color: '#FFFFFF',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              margin: '0 0 16px 0',
            }}
          >
            Start your learning journey today.
          </h1>
          <p style={{ fontSize: 15, color: '#A5B4FC', lineHeight: 1.6, margin: '0 0 40px 0' }}>
            Join thousands of students and teachers building the future of education together.
          </p>

          {/* Feature list */}
          {[
            { icon: GraduationCap, text: 'Join classrooms and submit assignments' },
            { icon: BookOpen,       text: 'Enroll in courses from expert instructors' },
            { icon: Users,         text: 'Connect with classmates and teachers' },
            { icon: BarChart3,     text: 'Track your grades and academic progress' },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: 'rgba(79,70,229,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={16} color="#A5B4FC" />
              </div>
              <span style={{ fontSize: 14, color: '#C7D2FE', lineHeight: 1.4 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Card */}
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 14,
              padding: '36px 40px',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ marginBottom: 28 }}>
              <h2
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  margin: '0 0 6px 0',
                  letterSpacing: '-0.01em',
                }}
              >
                Create your account
              </h2>
              <p style={{ fontSize: 14, color: '#475569', margin: 0 }}>
                Free to join — no credit card required
              </p>
            </div>

            <SignupForm />
          </div>
        </div>
      </div>
    </div>
  )
}
