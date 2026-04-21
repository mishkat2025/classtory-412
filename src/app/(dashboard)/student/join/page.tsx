import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { JoinClassroomForm } from './JoinClassroomForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Profile } from '@/lib/types'

export const metadata: Metadata = { title: 'Join Classroom — Classtory' }

export default async function JoinClassroomPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'student') redirect('/student')

  return (
    <div style={{ padding: '28px 28px 40px', maxWidth: 540 }}>
      <Link
        href="/student"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-secondary)', textDecoration: 'none', fontWeight: 500, marginBottom: 24 }}
      >
        <ArrowLeft size={14} />
        Back to dashboard
      </Link>

      <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
        Join a Classroom
      </h1>
      <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: '0 0 28px 0' }}>
        Enter the 6-character class code from your teacher.
      </p>

      <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <JoinClassroomForm studentId={user.id} />
      </div>
    </div>
  )
}
