'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, User, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
})

const passwordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, { message: "Passwords don't match", path: ['confirm'] })

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

export function SettingsForm({ profile }: { profile: Profile }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile')

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: profile.full_name },
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', confirm: '' },
  })

  async function onProfileSubmit(values: ProfileForm) {
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({ full_name: values.full_name }).eq('id', profile.id)
    if (error) { toast.error('Failed to update profile.'); return }
    toast.success('Profile updated!')
    router.refresh()
  }

  async function onPasswordSubmit(values: PasswordForm) {
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: values.password })
    if (error) { toast.error('Failed to update password: ' + error.message); return }
    toast.success('Password updated!')
    passwordForm.reset()
  }

  const tab = (id: 'profile' | 'password', label: string) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
        fontSize: 13, fontWeight: 500,
        backgroundColor: activeTab === id ? 'var(--color-primary-light)' : 'transparent',
        color: activeTab === id ? '#4F46E5' : '#64748B',
        transition: 'all 120ms ease',
      }}
    >{label}</button>
  )

  return (
    <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      {/* Tabs */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 4 }}>
        {tab('profile', '👤 Profile')}
        {tab('password', '🔒 Password')}
      </div>

      <div style={{ padding: 24 }}>
        {/* Read-only info */}
        <div style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '12px 16px', marginBottom: 24, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Email</div>
            <div style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>{profile.email}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Role</div>
            <div style={{ fontSize: 14, color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>{profile.role}</div>
          </div>
        </div>

        {activeTab === 'profile' && (
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Full Name</label>
              <input
                {...profileForm.register('full_name')}
                style={inputStyle(!!profileForm.formState.errors.full_name)}
              />
              {profileForm.formState.errors.full_name && (
                <span style={errStyle}>{profileForm.formState.errors.full_name.message}</span>
              )}
            </div>
            <div>
              <button
                type="submit"
                disabled={profileForm.formState.isSubmitting}
                style={btnStyle(profileForm.formState.isSubmitting)}
              >
                {profileForm.formState.isSubmitting && <Loader2 size={14} className="animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        )}

        {activeTab === 'password' && (
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>New Password</label>
              <input
                {...passwordForm.register('password')}
                type="password"
                placeholder="At least 6 characters"
                style={inputStyle(!!passwordForm.formState.errors.password)}
              />
              {passwordForm.formState.errors.password && (
                <span style={errStyle}>{passwordForm.formState.errors.password.message}</span>
              )}
            </div>
            <div>
              <label style={labelStyle}>Confirm Password</label>
              <input
                {...passwordForm.register('confirm')}
                type="password"
                placeholder="Repeat your password"
                style={inputStyle(!!passwordForm.formState.errors.confirm)}
              />
              {passwordForm.formState.errors.confirm && (
                <span style={errStyle}>{passwordForm.formState.errors.confirm.message}</span>
              )}
            </div>
            <div>
              <button
                type="submit"
                disabled={passwordForm.formState.isSubmitting}
                style={btnStyle(passwordForm.formState.isSubmitting)}
              >
                {passwordForm.formState.isSubmitting && <Loader2 size={14} className="animate-spin" />}
                Update Password
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 6 }
const errStyle: React.CSSProperties = { fontSize: 12, color: '#EF4444', marginTop: 4, display: 'block' }
function inputStyle(hasError: boolean): React.CSSProperties {
  return { width: '100%', height: 40, border: `1px solid ${hasError ? '#EF4444' : '#E2E8F0'}`, borderRadius: 8, padding: '0 12px', fontSize: 14, outline: 'none', fontFamily: 'inherit', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', boxSizing: 'border-box' }
}
function btnStyle(disabled: boolean): React.CSSProperties {
  return { height: 38, padding: '0 20px', backgroundColor: disabled ? '#E2E8F0' : '#4F46E5', color: disabled ? '#94A3B8' : '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }
}
