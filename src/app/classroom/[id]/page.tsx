import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ClassroomTabs } from '@/components/classroom/ClassroomTabs'
import type {
  ClassroomFull,
  AnnouncementFull,
  AssignmentWithMeta,
  MaterialFull,
  StudentEnrollment,
} from '@/components/classroom/types'
import type { Profile } from '@/lib/types'

/* ─── Metadata ────────────────────────────────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('classrooms')
    .select('name, subject')
    .eq('id', id)
    .single()

  if (!data) return { title: 'Classroom — Classtory' }
  return { title: `${data.name} · ${data.subject} — Classtory` }
}

/* ─── Page ────────────────────────────────────────────────────── */

export default async function ClassroomPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  /* Auth */
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  /* Profile */
  const { data: profileData, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileErr || !profileData) redirect('/auth/login')
  const profile = profileData as Profile

  /* Classroom */
  const { data: classroomData, error: classroomErr } = await supabase
    .from('classrooms')
    .select('*, teacher:profiles(full_name, avatar_url)')
    .eq('id', id)
    .single()

  if (classroomErr || !classroomData) notFound()
  const classroom = classroomData as ClassroomFull

  /* Access control */
  const isTeacher = classroom.teacher_id === user.id
  const isAdmin = profile.role === 'admin'

  if (!isTeacher && !isAdmin) {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('classroom_id', id)
      .eq('student_id', user.id)
      .maybeSingle()

    if (!enrollment) {
      // Not enrolled — redirect to their dashboard
      redirect(profile.role === 'teacher' ? '/teacher' : '/student')
    }
  }

  /* Enrollments (students in this classroom) */
  const { data: enrollmentData } = await supabase
    .from('enrollments')
    .select('*, student:profiles(id, full_name, email, avatar_url)')
    .eq('classroom_id', id)
    .order('enrolled_at', { ascending: true })

  const enrollments = (enrollmentData ?? []) as StudentEnrollment[]
  const totalStudents = enrollments.filter(e => e.student !== null).length

  /* Assignments */
  const { data: assignmentData } = await supabase
    .from('assignments')
    .select('*')
    .eq('classroom_id', id)
    .order('due_date', { ascending: true })

  const rawAssignments = assignmentData ?? []

  /* Build AssignmentWithMeta — different data for teacher vs student */
  let assignments: AssignmentWithMeta[] = []

  if (rawAssignments.length > 0) {
    const assignmentIds = rawAssignments.map(a => a.id as string)

    if (isTeacher || isAdmin) {
      /* Teacher: count submissions per assignment */
      const { data: subCounts } = await supabase
        .from('submissions')
        .select('assignment_id')
        .in('assignment_id', assignmentIds)

      const countMap: Record<string, number> = {}
      ;(subCounts ?? []).forEach(s => {
        const aid = s.assignment_id as string
        countMap[aid] = (countMap[aid] ?? 0) + 1
      })

      assignments = rawAssignments.map(a => ({
        ...(a as Omit<AssignmentWithMeta, 'submission_count' | 'student_submission'>),
        submission_count: countMap[a.id as string] ?? 0,
        student_submission: null,
      }))
    } else {
      /* Student: fetch own submission status per assignment */
      const { data: mySubmissions } = await supabase
        .from('submissions')
        .select('assignment_id, status, grade')
        .eq('student_id', user.id)
        .in('assignment_id', assignmentIds)

      const subMap: Record<string, { status: string; grade: number | null }> = {}
      ;(mySubmissions ?? []).forEach(s => {
        subMap[s.assignment_id as string] = {
          status: s.status as string,
          grade: s.grade as number | null,
        }
      })

      assignments = rawAssignments.map(a => ({
        ...(a as Omit<AssignmentWithMeta, 'submission_count' | 'student_submission'>),
        submission_count: 0,
        student_submission: subMap[a.id as string] ?? null,
      }))
    }
  }

  /* Materials */
  const { data: materialData } = await supabase
    .from('materials')
    .select('*, uploader:profiles(full_name)')
    .eq('classroom_id', id)
    .order('created_at', { ascending: false })

  const materials = (materialData ?? []) as MaterialFull[]

  /* Announcements (initial load — realtime takes over in the client) */
  const { data: announcementData } = await supabase
    .from('announcements')
    .select('*, author:profiles(full_name, avatar_url, role)')
    .eq('classroom_id', id)
    .order('created_at', { ascending: false })
    .limit(30)

  const announcements = (announcementData ?? []) as AnnouncementFull[]

  /* Render */
  return (
    <ClassroomTabs
      classroom={classroom}
      profile={profile}
      isTeacher={isTeacher || isAdmin}
      initialAnnouncements={announcements}
      assignments={assignments}
      materials={materials}
      enrollments={enrollments}
    />
  )
}
