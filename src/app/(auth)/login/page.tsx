import type { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, GraduationCap, Users, BarChart3 } from 'lucide-react'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Sign in — Classtory',
}

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: '#F8F9FC',
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
            Learn, teach, and grow — together.
          </h1>
          <p style={{ fontSize: 15, color: '#A5B4FC', lineHeight: 1.6, margin: '0 0 40px 0' }}>
            Your all-in-one education platform for courses, classrooms, and real academic progress.
          </p>

          {/* Feature list */}
          {[
            { icon: GraduationCap, text: 'Private classrooms with assignments & grades' },
            { icon: BookOpen,       text: 'Browse thousands of courses in the marketplace' },
            { icon: Users,         text: 'Real-time announcements and classroom feeds' },
            { icon: BarChart3,     text: 'Attendance tracking and grade tabulation' },
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
          {/* Mobile logo */}
          <Link
            href="/"
            className="flex lg:hidden"
            style={{
              display: 'none',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none',
              marginBottom: 32,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                backgroundColor: '#4F46E5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookOpen size={16} color="#fff" />
            </div>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 16, color: '#0F172A' }}>
              Classtory
            </span>
          </Link>

          {/* Card */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 14,
              padding: '36px 40px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ marginBottom: 28 }}>
              <h2
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#0F172A',
                  margin: '0 0 6px 0',
                  letterSpacing: '-0.01em',
                }}
              >
                Welcome back
              </h2>
              <p style={{ fontSize: 14, color: '#475569', margin: 0 }}>
                Sign in to your Classtory account
              </p>
            </div>

            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}
