import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AttendanceSheet } from '@/components/classroom/AttendanceSheet'
import type { Profile, AttendanceStatus } from '@/lib/types'

export const metadata: Metadata = { title: 'Attendance — Classtory' }

export default async function AttendancePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
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

  if (!isTeacher) {
    const { data: enrollment } = await supabase
      .from('enrollments').select('id').eq('classroom_id', classroomId).eq('student_id', user.id).maybeSingle()
    if (!enrollment) redirect('/student')
  }

  const initialDate = new Date().toISOString().split('T')[0]

  if (isTeacher) {
    /* Students */
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('student_id, student:profiles(id, full_name, email, avatar_url)')
      .eq('classroom_id', classroomId)
      .order('enrolled_at')

    const students = (enrollments ?? [])
      .map(e => e.student as unknown as { id: string; full_name: string; email: string; avatar_url: string | null } | null)
      .filter((s): s is { id: string; full_name: string; email: string; avatar_url: string | null } => s !== null)

    /* ALL attendance records for this classroom */
    const { data: allRecords } = await supabase
      .from('attendance')
      .select('student_id, date, status')
      .eq('classroom_id', classroomId)
      .order('date')

    const attendanceRecords = (allRecords ?? []) as { student_id: string; date: string; status: AttendanceStatus }[]

    return (
      <div style={{ padding: '28px 28px 40px', maxWidth: 1200, width: '100%' }}>
        <Link
          href={`/classroom/${classroomId}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-secondary)', textDecoration: 'none', fontWeight: 500, marginBottom: 24 }}
        >
          <ArrowLeft size={14} />
          Back to {classroom.name}
        </Link>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
            Attendance
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>{classroom.name}</p>
        </div>

        <AttendanceSheet
          students={students}
          classroom_id={classroomId}
          isTeacher={true}
          initialRecords={attendanceRecords}
          initialDate={initialDate}
        />
      </div>
    )
  }

  /* ── Student view ── */
  const { data: myRecords } = await supabase
    .from('attendance')
    .select('date, status')
    .eq('classroom_id', classroomId)
    .eq('student_id', user.id)
    .order('date', { ascending: false })

  const myAttendance = (myRecords ?? []).map(r => ({
    student_id: user.id,
    date: r.date as string,
    status: r.status as AttendanceStatus,
  }))

  return (
    <div style={{ padding: '28px 28px 40px', maxWidth: 960, width: '100%' }}>
      <Link
        href={`/classroom/${classroomId}`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-secondary)', textDecoration: 'none', fontWeight: 500, marginBottom: 24 }}
      >
        <ArrowLeft size={14} />
        Back to {classroom.name}
      </Link>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
          My Attendance
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>{classroom.name}</p>
      </div>

      <AttendanceSheet
        students={[]}
        classroom_id={classroomId}
        isTeacher={false}
        initialRecords={myAttendance}
        initialDate={initialDate}
      />
    </div>
  )
}
