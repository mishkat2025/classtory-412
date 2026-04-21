import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Clock, Award, FileText, CheckCircle2 } from 'lucide-react'
import { SubmissionForm } from './SubmissionForm'
import { GradeSubmissions } from './GradeSubmissions'
import type { Profile } from '@/lib/types'

export async function generateMetadata({ params }: { params: Promise<{ id: string; aid: string }> }): Promise<Metadata> {
  const { aid } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('assignments').select('title').eq('id', aid).single()
  return { title: data ? `${data.title} — Classtory` : 'Assignment — Classtory' }
}

function formatDueDate(iso: string) {
  const due = new Date(iso)
  const now = new Date()
  const diffMs = due.getTime() - now.getTime()
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.ceil(diffMs / 86400000)
  const isOverdue = diffMs < 0

  const dateStr = due.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = due.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  let urgencyLabel = ''
  if (isOverdue) urgencyLabel = 'Overdue'
  else if (diffDays === 0) urgencyLabel = diffHours <= 0 ? 'Due very soon' : `Due in ${diffHours}h`
  else if (diffDays === 1) urgencyLabel = 'Due tomorrow'
  else urgencyLabel = `${diffDays} days left`

  return { dateStr, timeStr, isOverdue, urgencyLabel }
}

export default async function AssignmentPage({
  params,
}: {
  params: Promise<{ id: string; aid: string }>
}) {
  const { id: classroomId, aid: assignmentId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')
  const typedProfile = profile as Profile

  const { data: assignment, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', assignmentId)
    .eq('classroom_id', classroomId)
    .single()
  if (error || !assignment) notFound()

  const { data: classroom } = await supabase
    .from('classrooms')
    .select('id, name, teacher_id')
    .eq('id', classroomId)
    .single()
  if (!classroom) notFound()

  const isTeacher = classroom.teacher_id === user.id || typedProfile.role === 'admin'

  if (!isTeacher) {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('classroom_id', classroomId)
      .eq('student_id', user.id)
      .maybeSingle()
    if (!enrollment) redirect('/student')
  }

  const { data: mySubmission } = await supabase
    .from('submissions')
    .select('*')
    .eq('assignment_id', assignmentId)
    .eq('student_id', user.id)
    .maybeSingle()

  let allSubmissions = null
  if (isTeacher) {
    const { data } = await supabase
      .from('submissions')
      .select('*, student:profiles(id, full_name, email, avatar_url)')
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false })
    allSubmissions = data
  }

  const due = formatDueDate(assignment.due_date)

  return (
    <div style={{ padding: '28px 28px 40px', maxWidth: 860, width: '100%' }}>
      {/* Back */}
      <Link
        href={`/classroom/${classroomId}`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-secondary)', textDecoration: 'none', fontWeight: 500, marginBottom: 24 }}
      >
        <ArrowLeft size={14} />
        Back to {classroom.name}
      </Link>

      {/* Header */}
      <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '24px 28px', marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>
          {assignment.title}
        </h1>

        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={14} color={due.isOverdue ? '#EF4444' : '#64748B'} />
            <span style={{ fontSize: 13, color: due.isOverdue ? '#EF4444' : '#64748B', fontWeight: due.isOverdue ? 600 : 400 }}>
              {due.dateStr} at {due.timeStr}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Award size={14} color="#64748B" />
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{assignment.max_points} points</span>
          </div>
          <span style={{
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 9999,
            padding: '2px 10px',
            backgroundColor: due.isOverdue ? '#FEE2E2' : '#FEF3C7',
            color: due.isOverdue ? '#991B1B' : '#92400E',
          }}>
            {due.urgencyLabel}
          </span>
        </div>

        {/* Description */}
        <div style={{ backgroundColor: 'var(--color-bg)', borderRadius: 10, padding: '16px 20px', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <FileText size={14} color="#4F46E5" />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Instructions</span>
          </div>
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap' }}>
            {assignment.description}
          </p>
        </div>
      </div>

      {/* Teacher: grade submissions */}
      {isTeacher && allSubmissions && (
        <GradeSubmissions
          submissions={allSubmissions}
          maxPoints={assignment.max_points}
          assignmentId={assignmentId}
        />
      )}

      {/* Student: submission form */}
      {!isTeacher && (
        <div>
          {mySubmission?.status === 'graded' ? (
            /* Graded — show result */
            <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <CheckCircle2 size={20} color="#10B981" />
                <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 17, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>Your Grade</h2>
              </div>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: mySubmission.feedback ? 16 : 0 }}>
                <div style={{ backgroundColor: 'var(--color-success-light)', borderRadius: 10, padding: '12px 20px', textAlign: 'center' }}>
                  <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 28, fontWeight: 800, color: '#059669', margin: '0 0 2px 0' }}>
                    {mySubmission.grade}/{assignment.max_points}
                  </p>
                  <p style={{ fontSize: 12, color: '#059669', margin: 0, fontWeight: 500 }}>
                    {Math.round((mySubmission.grade / assignment.max_points) * 100)}%
                  </p>
                </div>
              </div>
              {mySubmission.feedback && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Feedback</p>
                  <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{mySubmission.feedback}</p>
                </div>
              )}
            </div>
          ) : mySubmission ? (
            /* Submitted — show confirmation */
            <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: 'var(--color-success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={20} color="#059669" />
                </div>
                <div>
                  <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 2px 0' }}>Submitted</h2>
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>
                    {new Date(mySubmission.submitted_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              </div>
              {mySubmission.text_content && (
                <div style={{ backgroundColor: 'var(--color-bg)', borderRadius: 8, padding: '12px 16px', border: '1px solid var(--color-border)' }}>
                  <p style={{ fontSize: 14, color: '#475569', margin: 0, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{mySubmission.text_content}</p>
                </div>
              )}
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '12px 0 0 0' }}>Waiting for your teacher to grade this submission.</p>
            </div>
          ) : (
            /* Not submitted */
            <SubmissionForm
              assignmentId={assignmentId}
              classroomId={classroomId}
              studentId={user.id}
              isOverdue={due.isOverdue}
              maxPoints={assignment.max_points}
            />
          )}
        </div>
      )}
    </div>
  )
}
