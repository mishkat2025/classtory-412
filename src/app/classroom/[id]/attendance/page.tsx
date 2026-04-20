import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AttendanceSheet } from '@/components/classroom/AttendanceSheet'
import { AttendanceDateNav } from './AttendanceDateNav'
import type { Profile } from '@/lib/types'

export const metadata: Metadata = { title: 'Attendance — Classtory' }

interface SearchParams {
  date?: string
}

export default async function AttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<SearchParams>
}) {
  const { id: classroomId } = await params
  const { date: dateParam } = await searchParams
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

  /* Selected date — default to today */
  const selectedDate = dateParam ?? new Date().toISOString().split('T')[0]

  /* Students */
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('student_id, student:profiles(id, full_name, email, avatar_url)')
    .eq('classroom_id', classroomId)
    .order('enrolled_at')

  const students = (enrollments ?? [])
    .map(e => e.student as unknown as { id: string; full_name: string; email: string; avatar_url: string | null } | null)
    .filter((s): s is { id: string; full_name: string; email: string; avatar_url: string | null } => s !== null)

  /* Attendance for selected date */
  const { data: records } = await supabase
    .from('attendance')
    .select('student_id, status')
    .eq('classroom_id', classroomId)
    .eq('date', selectedDate)

  const attendanceRecords = (records ?? []) as { student_id: string; status: 'present' | 'absent' | 'late' }[]

  /* For student, show their own attendance history */
  let myAttendance: { date: string; status: string }[] = []
  if (!isTeacher) {
    const { data: myRecords } = await supabase
      .from('attendance')
      .select('date, status')
      .eq('classroom_id', classroomId)
      .eq('student_id', user.id)
      .order('date', { ascending: false })
      .limit(30)
    myAttendance = (myRecords ?? []) as { date: string; status: string }[]
  }

  return (
    <div style={{ padding: '28px 28px 40px', maxWidth: 960, width: '100%' }}>
      <Link
        href={`/classroom/${classroomId}`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748B', textDecoration: 'none', fontWeight: 500, marginBottom: 24 }}
      >
        <ArrowLeft size={14} />
        Back to {classroom.name}
      </Link>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
          Attendance
        </h1>
        <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>{classroom.name}</p>
      </div>

      {isTeacher ? (
        <>
          {/* Date navigation */}
          <div style={{ marginBottom: 20 }}>
            <AttendanceDateNav classroomId={classroomId} selectedDate={selectedDate} />
          </div>

          <AttendanceSheet
            students={students}
            classroom_id={classroomId}
            isTeacher={true}
            date={selectedDate}
            initialRecords={attendanceRecords}
          />
        </>
      ) : (
        /* Student view — own attendance history */
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '0 20px', height: 40, backgroundColor: '#F8FAFC', borderBottom: '1px solid #F1F5F9', display: 'grid', gridTemplateColumns: '1fr 120px', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>Status</span>
          </div>
          {myAttendance.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: '#94A3B8', margin: 0 }}>No attendance records yet.</p>
            </div>
          ) : (
            myAttendance.map((r, i) => {
              const statusColor = r.status === 'present' ? '#059669' : r.status === 'absent' ? '#DC2626' : '#D97706'
              const statusBg = r.status === 'present' ? '#D1FAE5' : r.status === 'absent' ? '#FEE2E2' : '#FEF3C7'

              return (
                <div
                  key={r.date}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 120px', padding: '0 20px', height: 48, borderBottom: i < myAttendance.length - 1 ? '1px solid #F1F5F9' : 'none', alignItems: 'center' }}
                >
                  <span style={{ fontSize: 14, color: '#0F172A' }}>
                    {new Date(r.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: statusColor, backgroundColor: statusBg, borderRadius: 9999, padding: '2px 10px', textTransform: 'capitalize' }}>
                      {r.status}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
