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
  ChevronDown,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/types'

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  role: z.enum(['student', 'teacher']),
})

type FormData = z.infer<typeof schema>

export default function SignupPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: '', email: '', password: '', role: 'student' },
  })

  async function onSubmit(values: FormData) {
    try {
      const supabase = createClient()

      const { data, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { full_name: values.full_name, role: values.role },
        },
      })

      if (authError) {
        toast.error(authError.message)
        return
      }

      const user = data?.user

      if (!user) {
        toast.info('Check your email to confirm your account.')
        return
      }

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: values.full_name,
        email: values.email,
        role: values.role as UserRole,
      }, { onConflict: 'id' })

      if (profileError) {
        // Profile upsert failed — log for debugging but don't block the user.
        // The DB trigger or dashboard lazy-upsert will handle it.
        console.error('[Signup] Profile upsert failed:', profileError.message)
      }

      toast.success('Account created! Welcome to Classtory.')
      router.push(values.role === 'teacher' ? '/teacher' : '/student')
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      toast.error(message)
    }
  }

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    void handleSubmit(onSubmit)()
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
            Start your learning journey today.
          </h1>
          <p style={{ fontSize: 15, color: '#A5B4FC', lineHeight: 1.6, margin: '0 0 40px 0' }}>
            Join thousands of students and teachers building the future of education together.
          </p>

          {[
            { icon: GraduationCap, text: 'Join classrooms and submit assignments' },
            { icon: BookOpen,      text: 'Enroll in courses from expert instructors' },
            { icon: Users,        text: 'Connect with classmates and teachers' },
            { icon: BarChart3,    text: 'Track your grades and academic progress' },
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

          {/* Card */}
          <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '36px 40px', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 6px 0', letterSpacing: '-0.01em' }}>
                Create your account
              </h2>
              <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>Free to join — no credit card required</p>
            </div>

            <form onSubmit={handleFormSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Full name */}
              <div style={fieldWrap}>
                <label style={labelStyle}>Full name</label>
                <input
                  {...register('full_name')}
                  type="text"
                  placeholder="Jane Smith"
                  autoComplete="name"
                  style={inputStyle(!!errors.full_name)}
                  onFocus={onFocus(!!errors.full_name)}
                />
                {errors.full_name && <span style={errorStyle}>{errors.full_name.message}</span>}
              </div>

              {/* Email */}
              <div style={fieldWrap}>
                <label style={labelStyle}>Email address</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  style={inputStyle(!!errors.email)}
                  onFocus={onFocus(!!errors.email)}
                />
                {errors.email && <span style={errorStyle}>{errors.email.message}</span>}
              </div>

              {/* Password */}
              <div style={fieldWrap}>
                <label style={labelStyle}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    style={{ ...inputStyle(!!errors.password), paddingRight: 40, width: '100%' }}
                    onFocus={onFocus(!!errors.password)}
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

              {/* Role */}
              <div style={fieldWrap}>
                <label style={labelStyle}>I am a…</label>
                <div style={{ position: 'relative' }}>
                  <select
                    {...register('role')}
                    style={{
                      ...inputStyle(!!errors.role),
                      width: '100%',
                      appearance: 'none',
                      paddingRight: 36,
                      cursor: 'pointer',
                      backgroundColor: 'var(--color-surface)',
                    }}
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                  </select>
                  <ChevronDown size={16} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
                </div>
                {errors.role && <span style={errorStyle}>{errors.role.message}</span>}
              </div>

              {/* Terms */}
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
                By creating an account you agree to our{' '}
                <Link href="/terms" style={{ color: '#4F46E5', textDecoration: 'none' }}>Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" style={{ color: '#4F46E5', textDecoration: 'none' }}>Privacy Policy</Link>.
              </p>

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
                }}
                onMouseEnter={e => { if (!isSubmitting) (e.currentTarget as HTMLElement).style.backgroundColor = '#3730A3' }}
                onMouseLeave={e => { if (!isSubmitting) (e.currentTarget as HTMLElement).style.backgroundColor = '#4F46E5' }}
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {isSubmitting ? 'Creating account…' : 'Create account'}
              </button>

              {/* Sign in link */}
              <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>
                Already have an account?{' '}
                <Link href="/auth/login" style={{ color: '#4F46E5', fontWeight: 500, textDecoration: 'none' }}>
                  Sign in
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

function onFocus(hasError: boolean) {
  return (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!hasError) {
      e.currentTarget.style.borderColor = '#4F46E5'
      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)'
    }
  }
}

const errorStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#EF4444',
  marginTop: 2,
}
