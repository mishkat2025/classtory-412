import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ClipboardList, Clock, CheckCircle2, Star, AlertCircle, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AssignmentCard } from '@/components/dashboard/AssignmentCard'
import type { Profile } from '@/lib/types'

interface AssignmentRow {
  id: string
  classroom_id: string
  title: string
  description: string
  due_date: string
  max_points: number
  created_at: string
  classroom: { id: string; name: string; subject: string; cover_color: string } | null
}

interface SubmissionRow {
  assignment_id: string
  status: string
  grade: number | null
  submitted_at: string
  feedback: string | null
}

type StatusFilter = 'all' | 'pending' | 'submitted' | 'graded' | 'overdue'

function formatDue(iso: string): { label: string; color: string; bg: string; urgent: boolean } {
  const due = new Date(iso)
  const now = new Date()
  const diffMs = due.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { label: 'Overdue', color: 'var(--color-danger-on-tint)', bg: 'var(--color-danger-light)', urgent: true }
  if (diffDays === 0) return { label: 'Due today', color: 'var(--color-warning-on-tint)', bg: 'var(--color-warning-light)', urgent: true }
  if (diffDays === 1) return { label: 'Due tomorrow', color: 'var(--color-warning-on-tint)', bg: 'var(--color-warning-light)', urgent: true }
  if (diffDays <= 7) return { label: `${diffDays}d left`, color: 'var(--color-warning-on-tint)', bg: 'var(--color-warning-light)', urgent: false }
  return {
    label: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    color: 'var(--color-text-secondary)',
    bg: 'var(--color-surface-2)',
    urgent: false,
  }
}

const STATUS_META = {
  pending:   { label: 'Pending',   bg: 'var(--color-warning-light)', color: 'var(--color-warning-on-tint)', border: '#F59E0B' },
  submitted: { label: 'Submitted', bg: '#DBEAFE', color: 'var(--color-info-on-tint)', border: '#3B82F6' },
  graded:    { label: 'Graded',    bg: 'var(--color-success-light)', color: 'var(--color-success-on-tint)', border: '#10B981' },
  overdue:   { label: 'Overdue',   bg: 'var(--color-danger-light)', color: 'var(--color-danger-on-tint)', border: '#EF4444' },
}

export default async function StudentAssignmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  let { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profileData) {
    const meta = user.user_metadata as { full_name?: string; role?: string } | undefined
    await supabase.from('profiles').upsert({ id: user.id, full_name: meta?.full_name ?? user.email ?? 'New User', email: user.email ?? '', role: (meta?.role ?? 'student') as import('@/lib/types').UserRole })
    const { data: retried } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profileData = retried
  }
  if (!profileData) redirect('/auth/login')
  const profile = profileData as Profile
  if (profile.role !== 'student') redirect(`/${profile.role}`)

  /* Classrooms this student is enrolled in */
  const { data: enrollmentData } = await supabase
    .from('enrollments')
    .select('classroom_id')
    .eq('student_id', user.id)

  const classroomIds = (enrollmentData ?? []).map(e => e.classroom_id as string)

  /* All assignments across enrolled classrooms */
  let allAssignments: AssignmentRow[] = []
  if (classroomIds.length > 0) {
    const { data } = await supabase
      .from('assignments')
      .select('*, classroom:classrooms(id, name, subject, cover_color)')
      .in('classroom_id', classroomIds)
      .order('due_date', { ascending: true })
    allAssignments = (data ?? []) as AssignmentRow[]
  }

  /* All submissions for this student */
  const { data: submissionData } = await supabase
    .from('submissions')
    .select('assignment_id, status, grade, submitted_at, feedback')
    .eq('student_id', user.id)

  const submissions = (submissionData ?? []) as SubmissionRow[]
  const subMap = new Map(submissions.map(s => [s.assignment_id, s]))

  const now = new Date()

  /* Classify each assignment */
  function getStatus(a: AssignmentRow): StatusFilter {
    const sub = subMap.get(a.id)
    if (sub?.status === 'graded') return 'graded'
    if (sub) return 'submitted'
    if (new Date(a.due_date) < now) return 'overdue'
    return 'pending'
  }

  /* Buckets */
  const pending   = allAssignments.filter(a => getStatus(a) === 'pending')
  const overdue   = allAssignments.filter(a => getStatus(a) === 'overdue')
  const submitted = allAssignments.filter(a => getStatus(a) === 'submitted')
  const graded    = allAssignments.filter(a => getStatus(a) === 'graded')

  /* Stats */
  const totalCount   = allAssignments.length
  const pendingCount = pending.length + overdue.length
  const doneCount    = submitted.length + graded.length

  return (
    <div style={{ padding: '28px 28px 48px', maxWidth: 1000, width: '100%' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClipboardList size={18} color="#4F46E5" />
          </div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            My Assignments
          </h1>
        </div>
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: '0 0 0 46px' }}>
          All assignments across your enrolled classrooms
        </p>
      </div>

      {/* ── Summary bar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 32 }}>
        {[
          { label: 'Total',     value: totalCount,   bg: 'var(--color-primary-light)', color: 'var(--color-primary-on-tint)' },
          { label: 'Pending',   value: pending.length,  bg: 'var(--color-warning-light)', color: 'var(--color-warning-on-tint)' },
          { label: 'Overdue',   value: overdue.length,  bg: 'var(--color-danger-light)', color: 'var(--color-danger-on-tint)' },
          { label: 'Submitted', value: submitted.length, bg: '#DBEAFE', color: 'var(--color-info-on-tint)' },
          { label: 'Graded',    value: graded.length,   bg: 'var(--color-success-light)', color: 'var(--color-success-on-tint)' },
        ].map(({ label, value, bg, color }) => (
          <div key={label} style={{ backgroundColor: bg, borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</div>
            <div style={{ fontSize: 12, color, opacity: 0.8, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {classroomIds.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={32} color="#A5B4FC" />}
          title="No classrooms yet"
          description="Join a classroom to see your assignments here."
          action={<Link href="/student/join" style={primaryBtn}>Join a class</Link>}
        />
      ) : totalCount === 0 ? (
        <EmptyState
          icon={<CheckCircle2 size={32} color="#A5B4FC" />}
          title="No assignments yet"
          description="Your teachers haven't posted any assignments yet."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* ── Overdue ── */}
          {overdue.length > 0 && (
            <AssignmentGroup
              title="Overdue"
              statusKey="overdue"
              icon={<AlertCircle size={15} color="#EF4444" />}
              assignments={overdue}
              subMap={subMap}
              badgeBg="#FEE2E2"
              badgeColor="#991B1B"
            />
          )}

          {/* ── Pending ── */}
          {pending.length > 0 && (
            <AssignmentGroup
              title="Pending"
              statusKey="pending"
              icon={<Clock size={15} color="#F59E0B" />}
              assignments={pending}
              subMap={subMap}
              badgeBg="#FEF3C7"
              badgeColor="#92400E"
            />
          )}

          {/* ── Submitted (awaiting grade) ── */}
          {submitted.length > 0 && (
            <AssignmentGroup
              title="Submitted — Awaiting Grade"
              statusKey="submitted"
              icon={<CheckCircle2 size={15} color="#3B82F6" />}
              assignments={submitted}
              subMap={subMap}
              badgeBg="#DBEAFE"
              badgeColor="#1E40AF"
            />
          )}

          {/* ── Graded ── */}
          {graded.length > 0 && (
            <AssignmentGroup
              title="Graded"
              statusKey="graded"
              icon={<Star size={15} color="#10B981" />}
              assignments={graded}
              subMap={subMap}
              badgeBg="#D1FAE5"
              badgeColor="#065F46"
            />
          )}

          {/* All caught up message when nothing is pending/overdue */}
          {pendingCount === 0 && doneCount > 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <CheckCircle2 size={28} color="#10B981" style={{ display: 'block', margin: '0 auto 8px' }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-success-on-tint)', margin: 0 }}>You&apos;re all caught up!</p>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '4px 0 0' }}>No pending or overdue assignments.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Sub-components ──────────────────────────────────────────── */

function AssignmentGroup({
  title,
  statusKey,
  icon,
  assignments,
  subMap,
  badgeBg,
  badgeColor,
}: {
  title: string
  statusKey: StatusFilter
  icon: React.ReactNode
  assignments: AssignmentRow[]
  subMap: Map<string, SubmissionRow>
  badgeBg: string
  badgeColor: string
}) {
  return (
    <section>
      {/* Group header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        {icon}
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
          {title}
        </h2>
        <span style={{ fontSize: 12, fontWeight: 600, color: badgeColor, backgroundColor: badgeBg, borderRadius: 9999, padding: '1px 8px' }}>
          {assignments.length}
        </span>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {assignments.map(a => {
          const sub = subMap.get(a.id)
          const due = formatDue(a.due_date)
          const effectiveKey = statusKey === 'all' ? 'pending' : statusKey
          const meta = STATUS_META[effectiveKey as keyof typeof STATUS_META] ?? STATUS_META.pending
          const pct = sub?.grade != null ? Math.round((sub.grade / a.max_points) * 100) : null
          const gradeColor = pct == null ? null : pct >= 80 ? '#065F46' : pct >= 60 ? '#92400E' : '#991B1B'
          const gradeBg    = pct == null ? null : pct >= 80 ? '#D1FAE5' : pct >= 60 ? '#FEF3C7' : '#FEE2E2'

          return (
            <AssignmentCard
              key={a.id}
              id={a.id}
              classroom_id={a.classroom_id}
              title={a.title}
              classroomName={a.classroom?.name ?? 'Classroom'}
              classroomColor={a.classroom?.cover_color ?? '#4F46E5'}
              maxPoints={a.max_points}
              dueLabel={due.label}
              dueColor={due.color}
              dueBg={due.bg}
              statusLabel={meta.label}
              statusColor={meta.color}
              statusBg={meta.bg}
              statusBorder={meta.border}
              grade={sub?.grade ?? null}
              pct={pct}
              gradeColor={gradeColor}
              gradeBg={gradeBg}
            />
          )
        })}
      </div>
    </section>
  )
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div style={{ backgroundColor: 'var(--color-surface)', border: '2px dashed var(--color-border)', borderRadius: 14, padding: '56px 24px', textAlign: 'center' }}>
      <div style={{ width: 60, height: 60, borderRadius: 16, backgroundColor: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        {icon}
      </div>
      <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 8px 0' }}>{title}</h3>
      <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: '0 0 20px 0' }}>{description}</p>
      {action}
    </div>
  )
}

const primaryBtn: React.CSSProperties = {
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
}
