import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen,
  ClipboardList,
  CheckCircle2,
  BarChart3,
  Plus,
  GraduationCap,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/dashboard/StatCard'
import { ClassroomCard } from '@/components/dashboard/ClassroomCard'
import { AssignmentItem } from '@/components/dashboard/AssignmentItem'
import { RecommendationCard } from '@/components/dashboard/RecommendationCard'
import { ScheduleView } from '@/components/dashboard/ScheduleView'
import type { Profile, ScheduleItem } from '@/lib/types'

/* ─── Local types for joined Supabase queries ─────────────────── */

interface TeacherRef {
  full_name: string
  avatar_url: string | null
}

interface ClassroomRef {
  id: string
  name: string
  subject: string
  class_code: string
  cover_color: string
  teacher_id: string
  teacher: TeacherRef | null
}

interface EnrollmentRow {
  id: string
  classroom_id: string
  student_id: string
  enrolled_at: string
  classroom: ClassroomRef | null
}

interface AssignmentRow {
  id: string
  classroom_id: string
  title: string
  description: string
  due_date: string
  max_points: number
  created_at: string
  classroom: { name: string } | null
}

interface SubmissionRow {
  assignment_id: string
  status: string
  grade: number | null
}

interface GradedRow {
  grade: number
  assignment: {
    id: string
    title: string
    max_points: number
    classroom: { name: string } | null
  } | null
}

interface CourseRow {
  id: string
  title: string
  description: string
  thumbnail_url: string | null
  category: string
  rating: number
  student_count: number
  price: number
  tags: string[]
  created_at: string
  instructor: { full_name: string } | null
}

/* ─── Page ────────────────────────────────────────────────────── */

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  /* Profile */
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profileData) redirect('/auth/login')

  const profile = profileData as Profile
  if (profile.role !== 'student') redirect(`/${profile.role}`)

  /* Enrollments */
  const { data: enrollmentData } = await supabase
    .from('enrollments')
    .select('*, classroom:classrooms(*, teacher:profiles(full_name, avatar_url))')
    .eq('student_id', user.id)
    .order('enrolled_at', { ascending: false })

  const enrollments = (enrollmentData ?? []) as EnrollmentRow[]
  const classroomIds = enrollments.map(e => e.classroom_id)

  /* Upcoming schedule items */
  let scheduleItems: ScheduleItem[] = []
  if (classroomIds.length > 0) {
    const { data: scheduleData } = await supabase
      .from('schedule_items')
      .select('*, classroom:classrooms(name)')
      .in('classroom_id', classroomIds)
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true })
      .limit(20)
    scheduleItems = (scheduleData ?? []) as ScheduleItem[]
  }

  /* Upcoming assignments (due in the future, ordered by urgency) */
  let upcomingAssignments: AssignmentRow[] = []
  if (classroomIds.length > 0) {
    const { data } = await supabase
      .from('assignments')
      .select('*, classroom:classrooms(name)')
      .in('classroom_id', classroomIds)
      .gte('due_date', new Date().toISOString())
      .order('due_date', { ascending: true })
      .limit(8)
    upcomingAssignments = (data ?? []) as AssignmentRow[]
  }

  /* Overdue assignments (past due, not yet submitted) */
  let overdueAssignments: AssignmentRow[] = []
  if (classroomIds.length > 0) {
    const { data } = await supabase
      .from('assignments')
      .select('*, classroom:classrooms(name)')
      .in('classroom_id', classroomIds)
      .lt('due_date', new Date().toISOString())
      .order('due_date', { ascending: false })
      .limit(4)
    overdueAssignments = (data ?? []) as AssignmentRow[]
  }

  /* All submissions for this student */
  const { data: submissionData } = await supabase
    .from('submissions')
    .select('assignment_id, status, grade')
    .eq('student_id', user.id)

  const submissions = (submissionData ?? []) as SubmissionRow[]
  const submissionMap = new Map(submissions.map(s => [s.assignment_id, s]))

  /* Recent graded work (with assignment title for display) */
  const { data: gradedData } = await supabase
    .from('submissions')
    .select('grade, assignment:assignments(id, title, max_points, classroom:classrooms(name))')
    .eq('student_id', user.id)
    .eq('status', 'graded')
    .order('submitted_at', { ascending: false })
    .limit(5)

  const gradedWork = (gradedData ?? []) as unknown as GradedRow[]

  /* Compute stats */
  const pendingCount =
    upcomingAssignments.filter(a => !submissionMap.has(a.id)).length +
    overdueAssignments.filter(a => !submissionMap.has(a.id)).length

  const avgGrade =
    gradedWork.length > 0
      ? Math.round(
          gradedWork.reduce((sum, g) => {
            const pct = g.assignment
              ? Math.round((g.grade / g.assignment.max_points) * 100)
              : g.grade
            return sum + pct
          }, 0) / gradedWork.length
        )
      : null

  /* Course recommendations — match classroom subjects, fall back to top-rated */
  const subjects = [
    ...new Set(
      enrollments
        .map(e => e.classroom?.subject)
        .filter((s): s is string => Boolean(s))
    ),
  ]

  let recommendations: CourseRow[] = []
  if (subjects.length > 0) {
    const { data } = await supabase
      .from('courses')
      .select('*, instructor:profiles(full_name)')
      .in('category', subjects)
      .order('rating', { ascending: false })
      .limit(4)
    recommendations = (data ?? []) as CourseRow[]
  }
  if (recommendations.length < 4) {
    const exclude = recommendations.map(c => c.id)
    const { data } = await supabase
      .from('courses')
      .select('*, instructor:profiles(full_name)')
      .not('id', 'in', `(${['00000000-0000-0000-0000-000000000000', ...exclude].join(',')})`)
      .order('rating', { ascending: false })
      .limit(4 - recommendations.length)
    recommendations = [...recommendations, ...((data ?? []) as CourseRow[])]
  }

  /* Greeting */
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = profile.full_name.split(' ')[0]

  /* Combined assignment feed: upcoming + overdue not submitted, sorted by urgency */
  const feedAssignments = [
    ...overdueAssignments.filter(a => !submissionMap.has(a.id)),
    ...upcomingAssignments,
  ].slice(0, 8)

  return (
    <div style={{ padding: '28px 28px 40px', maxWidth: 1200, width: '100%' }}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 28,
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 26,
              fontWeight: 800,
              color: '#0F172A',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            {greeting}, {firstName} 👋
          </h1>
          <p style={{ fontSize: 14, color: '#64748B', margin: '5px 0 0 0' }}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <Link
          href="/student/join"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            height: 38,
            padding: '0 16px',
            backgroundColor: '#4F46E5',
            color: '#FFFFFF',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            textDecoration: 'none',
            flexShrink: 0,
            transition: 'background-color 150ms ease',
          }}
        >
          <Plus size={16} />
          Join a class
        </Link>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}
      >
        <StatCard
          icon={BookOpen}
          label="Enrolled classes"
          value={enrollments.length}
          iconBg="#EEF2FF"
          iconColor="#4F46E5"
        />
        <StatCard
          icon={ClipboardList}
          label="Pending assignments"
          value={pendingCount}
          iconBg="#FEF3C7"
          iconColor="#D97706"
        />
        <StatCard
          icon={CheckCircle2}
          label="Submitted"
          value={submissions.length}
          iconBg="#D1FAE5"
          iconColor="#059669"
        />
        <StatCard
          icon={BarChart3}
          label="Avg. grade"
          value={avgGrade !== null ? `${avgGrade}%` : '—'}
          iconBg="#DBEAFE"
          iconColor="#2563EB"
        />
      </div>

      {/* ── Upcoming Schedule ───────────────────────────────────── */}
      <ScheduleView items={scheduleItems} />

      {/* ── My Classrooms ──────────────────────────────────────── */}
      <section style={{ marginBottom: 32 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={sectionHeading}>My Classrooms</h2>
            {enrollments.length > 0 && (
              <span style={countBadge}>{enrollments.length}</span>
            )}
          </div>
        </div>

        {enrollments.length === 0 ? (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '2px dashed #E2E8F0',
              borderRadius: 14,
              padding: '48px 24px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                backgroundColor: '#EEF2FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <GraduationCap size={28} color="#4F46E5" />
            </div>
            <h3
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 16,
                fontWeight: 700,
                color: '#0F172A',
                margin: '0 0 8px 0',
              }}
            >
              No classrooms yet
            </h3>
            <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 20px 0' }}>
              Join a classroom with the code your teacher shared.
            </p>
            <Link
              href="/student/join"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                height: 38,
                padding: '0 20px',
                backgroundColor: '#4F46E5',
                color: '#FFFFFF',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              <Plus size={15} />
              Join a class
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            {enrollments.map(enrollment => {
              const cls = enrollment.classroom
              if (!cls) return null
              const pending = feedAssignments.filter(
                a => a.classroom_id === cls.id && !submissionMap.has(a.id)
              ).length
              return (
                <ClassroomCard
                  key={enrollment.id}
                  id={cls.id}
                  name={cls.name}
                  subject={cls.subject}
                  cover_color={cls.cover_color}
                  teacher_name={cls.teacher?.full_name}
                  pending_count={pending}
                />
              )
            })}
          </div>
        )}
      </section>

      {/* ── Assignments + Grades ────────────────────────────────── */}
      <div
        className="student-split"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 300px',
          gap: 20,
          marginBottom: 32,
          alignItems: 'start',
        }}
      >
        {/* Upcoming assignments */}
        <section>
          <h2 style={{ ...sectionHeading, marginBottom: 16 }}>Upcoming & Overdue</h2>
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            {feedAssignments.length === 0 ? (
              <div
                style={{ padding: '36px 24px', textAlign: 'center' }}
              >
                <CheckCircle2
                  size={36}
                  color="#D1FAE5"
                  style={{ margin: '0 auto 12px', display: 'block' }}
                />
                <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
                  You&apos;re all caught up — no pending assignments!
                </p>
              </div>
            ) : (
              feedAssignments.map((assignment, i) => {
                const sub = submissionMap.get(assignment.id)
                const status =
                  sub?.status === 'graded'
                    ? 'graded'
                    : sub
                    ? 'submitted'
                    : 'pending'
                return (
                  <AssignmentItem
                    key={assignment.id}
                    id={assignment.id}
                    classroom_id={assignment.classroom_id}
                    title={assignment.title}
                    classroom_name={assignment.classroom?.name ?? ''}
                    due_date={assignment.due_date}
                    max_points={assignment.max_points}
                    status={status}
                    grade={sub?.grade ?? null}
                    isLast={i === feedAssignments.length - 1}
                  />
                )
              })
            )}
          </div>
        </section>

        {/* Recent grades */}
        <section>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <h2 style={sectionHeading}>Recent Grades</h2>
          </div>
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            {gradedWork.length === 0 ? (
              <div style={{ padding: '28px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: '#94A3B8', margin: 0 }}>
                  No graded work yet.
                </p>
              </div>
            ) : (
              gradedWork.map((item, i) => {
                if (!item.assignment) return null
                const pct = Math.round(
                  (item.grade / item.assignment.max_points) * 100
                )
                const gradeColor =
                  pct >= 80 ? '#059669' : pct >= 60 ? '#D97706' : '#DC2626'
                const gradeBg =
                  pct >= 80 ? '#D1FAE5' : pct >= 60 ? '#FEF3C7' : '#FEE2E2'
                return (
                  <Link
                    key={i}
                    href={`/classroom/${item.assignment.classroom?.name ?? ''}`}
                    style={{ textDecoration: 'none', display: 'block' }}
                  >
                    <div
                      className="card-hover"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        padding: '12px 16px',
                        borderBottom:
                          i < gradedWork.length - 1
                            ? '1px solid #F1F5F9'
                            : 'none',
                        transition: 'background-color 120ms ease',
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: '#0F172A',
                            margin: '0 0 2px 0',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.assignment.title}
                        </p>
                        <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>
                          {item.assignment.classroom?.name ?? ''}
                        </p>
                      </div>
                      <div
                        style={{
                          minWidth: 48,
                          height: 32,
                          borderRadius: 8,
                          backgroundColor: gradeBg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            fontSize: 13,
                            fontWeight: 700,
                            color: gradeColor,
                          }}
                        >
                          {pct}%
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </section>
      </div>

      {/* ── Recommendations ────────────────────────────────────── */}
      {recommendations.length > 0 && (
        <section>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <div>
              <h2 style={sectionHeading}>Recommended for You</h2>
              {subjects.length > 0 && (
                <p style={{ fontSize: 13, color: '#94A3B8', margin: '3px 0 0 0' }}>
                  Based on your enrolled subjects
                </p>
              )}
            </div>
            <Link
              href="/courses"
              style={{
                fontSize: 13,
                color: '#4F46E5',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              Browse all →
            </Link>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 16,
            }}
          >
            {recommendations.map(course => (
              <RecommendationCard
                key={course.id}
                id={course.id}
                title={course.title}
                category={course.category}
                thumbnail_url={course.thumbnail_url}
                rating={course.rating}
                student_count={course.student_count}
                price={course.price}
                instructor_name={course.instructor?.full_name ?? 'Instructor'}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

/* ─── Shared style tokens ─────────────────────────────────────── */

const sectionHeading: React.CSSProperties = {
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: 17,
  fontWeight: 700,
  color: '#0F172A',
  margin: 0,
  letterSpacing: '-0.01em',
}

const countBadge: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 12,
  fontWeight: 600,
  color: '#3730A3',
  backgroundColor: '#EEF2FF',
  borderRadius: 9999,
  padding: '1px 9px',
  minWidth: 24,
}
