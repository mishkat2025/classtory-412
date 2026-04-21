'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Eye, EyeOff, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/types'

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.enum(['student', 'teacher']),
})

type FormData = z.infer<typeof schema>

export function SignupForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'student' },
  })

  async function onSubmit(values: FormData) {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.signUp({
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

    if (!user) {
      toast.info('Check your email to confirm your account.')
      return
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: user.id,
      full_name: values.full_name,
      email: values.email,
      role: values.role as UserRole,
    })

    if (profileError) {
      toast.error('Account created but profile setup failed. Please contact support.')
      return
    }

    toast.success('Account created! Welcome to Classtory.')
    const destination = values.role === 'teacher' ? '/teacher' : '/student'
    router.push(destination)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Full name */}
      <div style={fieldWrap}>
        <label style={labelStyle}>Full name</label>
        <input
          {...register('full_name')}
          type="text"
          placeholder="Jane Smith"
          autoComplete="name"
          style={fieldStyle(!!errors.full_name)}
          onFocus={focusHandler(!!errors.full_name)}
          onBlur={blurHandler(!!errors.full_name)}
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
          style={fieldStyle(!!errors.email)}
          onFocus={focusHandler(!!errors.email)}
          onBlur={blurHandler(!!errors.email)}
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
            style={{ ...fieldStyle(!!errors.password), paddingRight: 40, width: '100%' }}
            onFocus={focusHandler(!!errors.password)}
            onBlur={blurHandler(!!errors.password)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            tabIndex={-1}
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              display: 'flex',
              padding: 2,
            }}
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
              ...fieldStyle(!!errors.role),
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
          <ChevronDown
            size={16}
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
              pointerEvents: 'none',
            }}
          />
        </div>
        {errors.role && <span style={errorStyle}>{errors.role.message}</span>}
      </div>

      {/* Terms note */}
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
        onMouseEnter={e => {
          if (!isSubmitting) (e.currentTarget as HTMLElement).style.backgroundColor = '#3730A3'
        }}
        onMouseLeave={e => {
          if (!isSubmitting) (e.currentTarget as HTMLElement).style.backgroundColor = '#4F46E5'
        }}
      >
        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </button>

      {/* Sign in link */}
      <p style={{ textAlign: 'center', fontSize: 14, color: '#475569', margin: 0 }}>
        Already have an account?{' '}
        <Link
          href="/auth/login"
          style={{ color: '#4F46E5', fontWeight: 500, textDecoration: 'none' }}
        >
          Sign in
        </Link>
      </p>
    </form>
  )
}

/* ─── Shared style helpers ───────────────────────────────────── */

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

function fieldStyle(hasError: boolean): React.CSSProperties {
  return {
    height: 38,
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

function focusHandler(hasError: boolean) {
  return (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!hasError) {
      e.currentTarget.style.borderColor = '#4F46E5'
      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)'
    }
  }
}

function blurHandler(hasError: boolean) {
  return (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!hasError) {
      e.currentTarget.style.borderColor = '#E2E8F0'
      e.currentTarget.style.boxShadow = 'none'
    }
  }
}

const errorStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#EF4444',
  marginTop: 2,
}
