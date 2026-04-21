'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

export function LoginForm() {
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
      : profile.role === 'admin' ? '/admin'
      : '/student'

    router.push(destination)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Email */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={labelStyle}>Email address</label>
        <input
          {...register('email')}
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          style={{
            ...inputStyle,
            borderColor: errors.email ? '#EF4444' : '#E2E8F0',
            boxShadow: errors.email ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none',
          }}
          onFocus={e => {
            if (!errors.email) {
              e.currentTarget.style.borderColor = '#4F46E5'
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)'
            }
          }}
          onBlur={e => {
            if (!errors.email) {
              e.currentTarget.style.borderColor = 'var(--color-border)'
              e.currentTarget.style.boxShadow = 'none'
            }
          }}
        />
        {errors.email && <span style={errorStyle}>{errors.email.message}</span>}
      </div>

      {/* Password */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={labelStyle}>Password</label>
          <Link
            href="/auth/forgot-password"
            style={{ fontSize: 13, color: '#4F46E5', textDecoration: 'none', fontWeight: 500 }}
          >
            Forgot password?
          </Link>
        </div>
        <div style={{ position: 'relative' }}>
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="current-password"
            style={{
              ...inputStyle,
              paddingRight: 40,
              borderColor: errors.password ? '#EF4444' : '#E2E8F0',
              boxShadow: errors.password ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none',
              width: '100%',
            }}
            onFocus={e => {
              if (!errors.password) {
                e.currentTarget.style.borderColor = '#4F46E5'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)'
              }
            }}
            onBlur={e => {
              if (!errors.password) {
                e.currentTarget.style.borderColor = 'var(--color-border)'
                e.currentTarget.style.boxShadow = 'none'
              }
            }}
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
        onMouseEnter={e => {
          if (!isSubmitting) (e.currentTarget as HTMLElement).style.backgroundColor = '#3730A3'
        }}
        onMouseLeave={e => {
          if (!isSubmitting) (e.currentTarget as HTMLElement).style.backgroundColor = '#4F46E5'
        }}
      >
        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>

      {/* Sign up link */}
      <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>
        Don&apos;t have an account?{' '}
        <Link
          href="/auth/signup"
          style={{ color: '#4F46E5', fontWeight: 500, textDecoration: 'none' }}
        >
          Create one
        </Link>
      </p>
    </form>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--color-text-primary)',
}

const inputStyle: React.CSSProperties = {
  height: 38,
  width: '100%',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  padding: '0 12px',
  fontSize: 14,
  fontFamily: "'Inter', sans-serif",
  color: 'var(--color-text-primary)',
  backgroundColor: 'var(--color-surface)',
  outline: 'none',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
  boxSizing: 'border-box',
}

const errorStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#EF4444',
  marginTop: 2,
}
