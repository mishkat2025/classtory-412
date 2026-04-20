import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Gradebook } from '@/components/classroom/Gradebook'
import type { Profile } from '@/lib/types'

export const metadata: Metadata = { title: 'Gradebook — Classtory' }

export default async function GradesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: classroomId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')
  const typedProfile = profile as Profile

  const { data: classroom, error } = await supabase
    .from('classrooms')
    .select('id, name, teacher_id')
    .eq('id', classroomId)
    .single()
  if (error || !classroom) notFound()

  const isTeacher = classroom.teacher_id === user.id || typedProfile.role === 'admin'

  if (!isTeacher && typedProfile.role !== 'student') redirect('/student')
  if (!isTeacher) {
    const { data: enrollment } = await supabase.from('enrollments').select('id').eq('classroom_id', classroomId).eq('student_id', user.id).maybeSingle()
    if (!enrollment) redirect('/student')
  }

  /* Assignments */
  const { data: assignments } = await supabase
    .from('assignments')
    .select('id, title, max_points')
    .eq('classroom_id', classroomId)
    .order('created_at')
  const assignmentList = (assignments ?? []) as { id: string; title: string; max_points: number }[]

  /* Students */
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('student_id, student:profiles(id, full_name, email)')
    .eq('classroom_id', classroomId)
    .order('enrolled_at')

  const students = (enrollments ?? [])
    .map(e => e.student as unknown as { id: string; full_name: string; email: string } | null)
    .filter((s): s is { id: string; full_name: string; email: string } => s !== null)

  /* Submissions */
  const { data: submissions } = await supabase
    .from('submissions')
    .select('id, assignment_id, student_id, grade, feedback, status')
    .in('assignment_id', assignmentList.map(a => a.id))

  const submissionList = (submissions ?? []) as {
    id: string
    assignment_id: string
    student_id: string
    grade: number | null
    feedback: string | null
    status: string
  }[]

  /* Build student rows */
  type GradeInfo = { grade: number | null; feedback: string; submissionId: string | null; status: string }
  const studentRows = students.map(s => {
    const gradesByAssignment: Record<string, GradeInfo> = {}
    for (const a of assignmentList) {
      const sub = submissionList.find(sub => sub.assignment_id === a.id && sub.student_id === s.id)
      gradesByAssignment[a.id] = {
        grade: sub?.grade ?? null,
        feedback: sub?.feedback ?? '',
        submissionId: sub?.id ?? null,
        status: sub?.status ?? 'not submitted',
      }
    }
    return { student_id: s.id, student_name: s.full_name, student_email: s.email, grades: gradesByAssignment }
  })

  /* Student view — filter to own row */
  const filteredRows = isTeacher
    ? studentRows
    : studentRows.filter(r => r.student_id === user.id)

  return (
    <div style={{ padding: '28px 28px 40px', maxWidth: 1200, width: '100%' }}>
      <Link
        href={`/classroom/${classroomId}`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748B', textDecoration: 'none', fontWeight: 500, marginBottom: 24 }}
      >
        <ArrowLeft size={14} />
        Back to {classroom.name}
      </Link>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
          {isTeacher ? 'Gradebook' : 'My Grades'}
        </h1>
        <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>{classroom.name}</p>
      </div>

      <Gradebook
        classroomName={classroom.name}
        assignments={assignmentList}
        students={filteredRows}
        isTeacher={isTeacher}
      />
    </div>
  )
}
