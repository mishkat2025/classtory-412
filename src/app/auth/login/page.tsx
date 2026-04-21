'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  BookOpen,
  GraduationCap,
  Users,
  BarChart3,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormData) {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    if (authError) {
      toast.error(authError.message)
      return
    }

    if (!user) {
      toast.error('Login failed. Please try again.')
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      toast.error('Could not load your profile. Please try again.')
      return
    }

    const destination =
      profile.role === 'teacher' ? '/teacher'
      : profile.role === 'admin'   ? '/admin'
      : '/student'

    router.push(destination)
    router.refresh()
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: 'var(--color-bg)' }}>

      {/* ── Left panel — branding ────────────────────────────── */}
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
        {/* Background blobs */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', backgroundColor: 'rgba(79,70,229,0.18)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', backgroundColor: 'rgba(99,102,241,0.12)', pointerEvents: 'none' }} />

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', position: 'relative' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={20} color="#fff" />
          </div>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 20, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Classtory
          </span>
        </Link>

        {/* Headline + features */}
        <div style={{ marginTop: 'auto', marginBottom: 'auto', position: 'relative' }}>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 36, color: '#FFFFFF', lineHeight: 1.15, letterSpacing: '-0.02em', margin: '0 0 16px 0' }}>
            Learn, teach, and grow — together.
          </h1>
          <p style={{ fontSize: 15, color: '#A5B4FC', lineHeight: 1.6, margin: '0 0 40px 0' }}>
            Your all-in-one education platform for courses, classrooms, and real academic progress.
          </p>

          {[
            { icon: GraduationCap, text: 'Private classrooms with assignments & grades' },
            { icon: BookOpen,      text: 'Browse thousands of courses in the marketplace' },
            { icon: Users,        text: 'Real-time announcements and classroom feeds' },
            { icon: BarChart3,    text: 'Attendance tracking and grade tabulation' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(79,70,229,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={16} color="#A5B4FC" />
              </div>
              <span style={{ fontSize: 14, color: '#C7D2FE', lineHeight: 1.4 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — form ───────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Mobile logo */}
          <Link
            href="/"
            className="flex lg:hidden"
            style={{ display: 'none', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 32 }}
          >
            <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={16} color="#fff" />
            </div>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--color-text-primary)' }}>Classtory</span>
          </Link>

          {/* Card */}
          <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '36px 40px', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 6px 0', letterSpacing: '-0.01em' }}>
                Welcome back
              </h2>
              <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>Sign in to your Classtory account</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Email */}
              <div style={fieldWrap}>
                <label style={labelStyle}>Email address</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  style={inputStyle(!!errors.email)}
                  onFocus={e => { if (!errors.email) { e.currentTarget.style.borderColor = '#4F46E5'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)' } }}
                  onBlur={e => { if (!errors.email) { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none' } }}
                />
                {errors.email && <span style={errorStyle}>{errors.email.message}</span>}
              </div>

              {/* Password */}
              <div style={fieldWrap}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={labelStyle}>Password</label>
                  <Link href="/auth/forgot-password" style={{ fontSize: 13, color: '#4F46E5', textDecoration: 'none', fontWeight: 500 }}>
                    Forgot password?
                  </Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    style={{ ...inputStyle(!!errors.password), paddingRight: 40, width: '100%' }}
                    onFocus={e => { if (!errors.password) { e.currentTarget.style.borderColor = '#4F46E5'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)' } }}
                    onBlur={e => { if (!errors.password) { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none' } }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    tabIndex={-1}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: 2 }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <span style={errorStyle}>{errors.password.message}</span>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  height: 42,
                  backgroundColor: isSubmitting ? '#6366F1' : '#4F46E5',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'background-color 150ms ease',
                  marginTop: 4,
                }}
                onMouseEnter={e => { if (!isSubmitting) (e.currentTarget as HTMLElement).style.backgroundColor = '#3730A3' }}
                onMouseLeave={e => { if (!isSubmitting) (e.currentTarget as HTMLElement).style.backgroundColor = '#4F46E5' }}
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </button>

              {/* Sign up link */}
              <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>
                Don&apos;t have an account?{' '}
                <Link href="/auth/signup" style={{ color: '#4F46E5', fontWeight: 500, textDecoration: 'none' }}>
                  Create one
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Shared style tokens ───────────────────────────────────── */

const fieldWrap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--color-text-primary)',
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    height: 38,
    width: '100%',
    border: `1px solid ${hasError ? '#EF4444' : '#E2E8F0'}`,
    borderRadius: 8,
    padding: '0 12px',
    fontSize: 14,
    fontFamily: "'Inter', sans-serif",
    color: 'var(--color-text-primary)',
    backgroundColor: 'var(--color-surface)',
    outline: 'none',
    transition: 'border-color 150ms ease, box-shadow 150ms ease',
    boxSizing: 'border-box',
    boxShadow: hasError ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none',
  }
}

const errorStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#EF4444',
  marginTop: 2,
}
