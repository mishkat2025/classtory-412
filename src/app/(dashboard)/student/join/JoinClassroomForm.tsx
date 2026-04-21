'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface JoinClassroomFormProps {
  studentId: string
}

export function JoinClassroomForm({ studentId }: JoinClassroomFormProps) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length !== 6) {
      setError('Class code must be 6 characters.')
      return
    }
    setError('')
    setLoading(true)

    const supabase = createClient()

    const { data: classroom, error: findError } = await supabase
      .from('classrooms')
      .select('id, name')
      .eq('class_code', trimmed)
      .maybeSingle()

    if (findError || !classroom) {
      setLoading(false)
      setError('No classroom found with that code. Please check and try again.')
      return
    }

    const { data: existing } = await supabase
      .from('enrollments')
      .select('id')
      .eq('classroom_id', classroom.id)
      .eq('student_id', studentId)
      .maybeSingle()

    if (existing) {
      setLoading(false)
      toast.info(`You're already enrolled in ${classroom.name}.`)
      router.push(`/classroom/${classroom.id}`)
      return
    }

    const { error: enrollError } = await supabase.from('enrollments').insert({
      classroom_id: classroom.id,
      student_id: studentId,
    })

    setLoading(false)

    if (enrollError) {
      setError('Failed to join classroom. Please try again.')
      return
    }

    toast.success(`Joined ${classroom.name}!`)
    router.push(`/classroom/${classroom.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>Class Code</label>
        <input
          type="text"
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
          placeholder="e.g. ABC123"
          maxLength={6}
          autoFocus
          style={{
            height: 48,
            border: `1px solid ${error ? '#EF4444' : '#E2E8F0'}`,
            borderRadius: 8,
            padding: '0 16px',
            fontSize: 20,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            backgroundColor: 'var(--color-surface)',
            outline: 'none',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            transition: 'border-color 150ms ease, box-shadow 150ms ease',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = '#4F46E5'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)' }}
          onBlur={e => { if (!error) { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none' } }}
        />
        {error && <span style={{ fontSize: 12, color: '#EF4444' }}>{error}</span>}
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
          Ask your teacher for the class code.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading || code.trim().length === 0}
        style={{
          height: 42,
          backgroundColor: loading || code.trim().length === 0 ? '#E2E8F0' : '#4F46E5',
          color: loading || code.trim().length === 0 ? '#94A3B8' : '#FFFFFF',
          border: 'none',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          cursor: loading || code.trim().length === 0 ? 'not-allowed' : 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'background-color 150ms ease',
        }}
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {loading ? 'Joining…' : 'Join Classroom'}
      </button>
    </form>
  )
}
