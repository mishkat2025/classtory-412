'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface EnrollButtonProps {
  courseId: string
  courseName: string
  isAuthenticated: boolean
  isEnrolled: boolean
}

export function EnrollButton({ courseId, courseName, isAuthenticated, isEnrolled: initialEnrolled }: EnrollButtonProps) {
  const router = useRouter()
  const [enrolled, setEnrolled] = useState(initialEnrolled)
  const [loading, setLoading] = useState(false)

  async function handleEnroll() {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }
    if (enrolled) return

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { error } = await supabase.from('course_enrollments').insert({
      course_id: courseId,
      student_id: user.id,
    })

    if (error) {
      setLoading(false)
      if (error.code === '23505') {
        setEnrolled(true)
        toast.info('You are already enrolled in this course.')
      } else {
        toast.error('Enrollment failed. Please try again.')
      }
      return
    }

    // Also enroll in the linked classroom if one exists
    const { data: courseData } = await supabase
      .from('courses')
      .select('linked_classroom_id')
      .eq('id', courseId)
      .single()

    if (courseData?.linked_classroom_id) {
      const { error: enrollErr } = await supabase.from('enrollments').insert({
        classroom_id: courseData.linked_classroom_id,
        student_id: user.id,
      })
      // Ignore duplicate (already enrolled) errors
      if (enrollErr && enrollErr.code !== '23505') {
        console.error('Classroom enrollment error:', enrollErr)
      }
    }

    setLoading(false)
    setEnrolled(true)
    toast.success(`Enrolled in ${courseName}!`)
  }

  if (enrolled) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, backgroundColor: 'var(--color-success-light)', borderRadius: 10, border: '1px solid #10B981' }}>
        <CheckCircle2 size={18} color="#059669" />
        <span style={{ fontSize: 15, fontWeight: 600, color: '#059669' }}>Enrolled</span>
      </div>
    )
  }

  return (
    <button
      onClick={handleEnroll}
      disabled={loading}
      style={{
        width: '100%',
        height: 44,
        backgroundColor: loading ? '#6366F1' : '#4F46E5',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: 10,
        fontSize: 15,
        fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        transition: 'background-color 150ms ease',
      }}
      onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.backgroundColor = '#3730A3' }}
      onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.backgroundColor = '#4F46E5' }}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {loading ? 'Enrolling…' : isAuthenticated ? 'Enroll Now' : 'Sign in to Enroll'}
    </button>
  )
}
