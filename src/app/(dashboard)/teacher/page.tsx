import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen, Users, ClipboardList, Plus, GraduationCap, CheckCircle2, Clock, Store,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/dashboard/StatCard'
import { CreateClassroomButton } from './CreateClassroomButton'
import { CreateCourseButton } from './CreateCourseButton'
import { ScheduleManager } from '@/components/dashboard/ScheduleManager'
import type { Profile } from '@/lib/types'

interface CourseRow {
  id: string
  title: string
  category: string
  price: number
  student_count: number
  created_at: string
}

interface ClassroomRow {
  id: string
  name: string
  subject: string
  class_code: string
  cover_color: string
  created_at: string
  student_count: number
}

interface SubmissionRow {
  id: string
  status: string
  submitted_at: string
  student: { full_name: string } | null
  assignment: { id: string; title: string; max_points: number; classroom: { id: string; name: string } | null } | null
}

export default async function TeacherDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profileData) redirect('/auth/login')
  const profile = profileData as Profile
  if (profile.role !== 'teacher') redirect(`/${profile.role}`)

  /* My classrooms */
  const { data: rawClassrooms } = await supabase
    .from('classrooms')
    .select('*')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })

  /* My courses */
  const { data: rawCourses } = await supabase
    .from('courses')
    .select('id, title, category, price, student_count, created_at')
    .eq('instructor_id', user.id)
    .order('created_at', { ascending: false })
  const myCourses: CourseRow[] = (rawCourses ?? []) as CourseRow[]

  const classrooms = rawClassrooms ?? []

  /* Enrich with student count */
  const classroomsWithCount: ClassroomRow[] = await Promise.all(
    classrooms.map(async c => {
      const { count } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('classroom_id', c.id)
      return { ...c, student_count: count ?? 0 } as ClassroomRow
    })
  )

  const classroomIds = classrooms.map(c => c.id)

  /* Pending submissions (submitted, not yet graded) */
  let pendingSubmissions: SubmissionRow[] = []
  if (classroomIds.length > 0) {
    const { data } = await supabase
      .from('submissions')
      .select('id, status, submitted_at, student:profiles(full_name), assignment:assignments(id, title, max_points, classroom:classrooms(id, name))')
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: true })
      .limit(10)
    pendingSubmissions = (data ?? []) as unknown as SubmissionRow[]

    // Filter to only this teacher's classrooms
    pendingSubmissions = pendingSubmissions.filter(s =>
      s.assignment?.classroom && classroomIds.includes(s.assignment.classroom.id)
    )
  }

  /* Total students across all classrooms */
  const totalStudents = classroomsWithCount.reduce((sum, c) => sum + c.student_count, 0)

  /* Total assignments */
  let totalAssignments = 0
  if (classroomIds.length > 0) {
    const { count } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true })
      .in('classroom_id', classroomIds)
    totalAssignments = count ?? 0
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div style={{ padding: '28px 28px 40px', maxWidth: 1200, width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 26, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            {greeting}, {profile.full_name.split(' ')[0]} 👋
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: '5px 0 0 0' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <CreateCourseButton teacherId={user.id} />
          <CreateClassroomButton teacherId={user.id} />
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard icon={GraduationCap} label="My Classrooms" value={classrooms.length} iconBg="#EEF2FF" iconColor="#4F46E5" />
        <StatCard icon={Store} label="My Courses" value={myCourses.length} iconBg="#F0FDF4" iconColor="#059669" />
        <StatCard icon={Users} label="Total Students" value={totalStudents} iconBg="#D1FAE5" iconColor="#059669" />
        <StatCard icon={ClipboardList} label="Assignments" value={totalAssignments} iconBg="#FEF3C7" iconColor="#D97706" />
        <StatCard icon={Clock} label="Pending Grading" value={pendingSubmissions.length} iconBg="#FEE2E2" iconColor="#DC2626" />
      </div>

      {/* My Courses */}
      {myCourses.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={sectionHeading}>My Courses</h2>
            <Link href="/courses" style={{ fontSize: 13, color: '#4F46E5', fontWeight: 500, textDecoration: 'none' }}>Browse marketplace →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
            {myCourses.map(course => (
              <Link key={course.id} href={`/courses/${course.id}`} style={{ textDecoration: 'none' }}>
                <div className="card-hover" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 9, backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <BookOpen size={18} color="#4F46E5" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{course.title}</p>
                      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>{course.category}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#059669', backgroundColor: '#D1FAE5', borderRadius: 9999, padding: '2px 10px' }}>
                      {course.student_count ?? 0} enrolled
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: course.price === 0 ? '#10B981' : '#0F172A' }}>
                      {course.price === 0 ? 'Free' : `$${course.price}`}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>
        {/* Classrooms */}
        <section>
          <h2 style={sectionHeading}>My Classrooms</h2>

          {classroomsWithCount.length === 0 ? (
            <div style={{ backgroundColor: 'var(--color-surface)', border: '2px dashed var(--color-border)', borderRadius: 14, padding: '56px 24px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <GraduationCap size={28} color="#4F46E5" />
              </div>
              <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 8px 0' }}>
                No classrooms yet
              </h3>
              <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: '0 0 20px 0' }}>
                Create your first classroom and share the code with students.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {classroomsWithCount.map(cls => (
                <Link
                  key={cls.id}
                  href={`/classroom/${cls.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    className="card-hover"
                    style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: cls.cover_color || '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <BookOpen size={20} color={cls.cover_color ? '#FFFFFF' : '#4F46E5'} />
                      </div>
                      <div>
                        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 3px 0' }}>{cls.name}</p>
                        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>{cls.subject}</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>{cls.student_count}</p>
                        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>students</p>
                      </div>
                      <div style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '4px 10px', textAlign: 'center' }}>
                        <p style={{ fontSize: 10, color: 'var(--color-text-muted)', margin: '0 0 1px 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Code</p>
                        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, color: '#4F46E5', margin: 0, letterSpacing: '0.08em' }}>{cls.class_code}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Grading Queue */}
        <section>
          <h2 style={{ ...sectionHeading, marginBottom: 16 }}>Grading Queue</h2>
          <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            {pendingSubmissions.length === 0 ? (
              <div style={{ padding: '36px 24px', textAlign: 'center' }}>
                <CheckCircle2 size={32} color="#D1FAE5" style={{ margin: '0 auto 12px', display: 'block' }} />
                <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>All submissions graded!</p>
              </div>
            ) : (
              pendingSubmissions.map((sub, i) => (
                <Link
                  key={sub.id}
                  href={`/classroom/${sub.assignment?.classroom?.id}/assignment/${sub.assignment?.id}`}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <div
                    style={{ padding: '12px 16px', borderBottom: i < pendingSubmissions.length - 1 ? '1px solid #F1F5F9' : 'none', transition: 'background-color 120ms ease' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F8FAFC' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
                  >
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {sub.student?.full_name ?? 'Student'}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {sub.assignment?.title} · {sub.assignment?.classroom?.name}
                    </p>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#D97706', backgroundColor: '#FEF3C7', borderRadius: 9999, padding: '1px 8px' }}>
                      Needs grading
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>

      {/* ── Schedule ─────────────────────────────────────────────── */}
      <div style={{ marginTop: 32 }}>
        <ScheduleManager
          teacherId={user.id}
          classrooms={classroomsWithCount.map(c => ({ id: c.id, name: c.name }))}
        />
      </div>
    </div>
  )
}

const sectionHeading: React.CSSProperties = {
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: 17,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
  margin: '0 0 16px 0',
  letterSpacing: '-0.01em',
}
