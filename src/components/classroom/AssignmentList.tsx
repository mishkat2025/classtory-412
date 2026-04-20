'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Plus,
  X,
  ChevronRight,
  ClipboardList,
  Clock,
  CheckCircle2,
  Star,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { AssignmentWithMeta } from './types'
import type { Profile } from '@/lib/types'

interface AssignmentListProps {
  initialAssignments: AssignmentWithMeta[]
  classroom_id: string
  isTeacher: boolean
  profile: Profile
  totalStudents: number
}

const createSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(1, 'Description is required'),
  due_date: z.string().min(1, 'Due date is required'),
  max_points: z.number().int().min(1, 'Min 1 point').max(1000, 'Max 1000 points'),
})
type CreateForm = z.infer<typeof createSchema>

function formatDue(iso: string): { label: string; overdue: boolean; urgent: boolean } {
  const due = new Date(iso)
  const now = new Date()
  const diffMs = due.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / 86400000)

  if (diffDays < 0)
    return {
      label: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      overdue: true,
      urgent: false,
    }
  if (diffDays === 0) return { label: 'Due today', overdue: false, urgent: true }
  if (diffDays === 1) return { label: 'Tomorrow', overdue: false, urgent: true }
  if (diffDays <= 7) return { label: `${diffDays}d left`, overdue: false, urgent: false }
  return {
    label: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    overdue: false,
    urgent: false,
  }
}

const submissionStatusConfig = {
  graded:    { label: 'Graded',    bg: '#D1FAE5', color: '#065F46', Icon: Star },
  submitted: { label: 'Submitted', bg: '#DBEAFE', color: '#1E40AF', Icon: CheckCircle2 },
  late:      { label: 'Late',      bg: '#FEE2E2', color: '#991B1B', Icon: AlertCircle },
  pending:   { label: 'Pending',   bg: '#FEF3C7', color: '#92400E', Icon: Clock },
} as const

export function AssignmentList({
  initialAssignments,
  classroom_id,
  isTeacher,
  profile,
  totalStudents,
}: AssignmentListProps) {
  const [assignments, setAssignments] = useState<AssignmentWithMeta[]>(initialAssignments)
  const [showForm, setShowForm] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateForm>({ resolver: zodResolver(createSchema) })

  async function onSubmit(values: CreateForm) {
    const dueISO = new Date(values.due_date).toISOString()

    const { data, error } = await supabase
      .from('assignments')
      .insert({
        classroom_id,
        title: values.title,
        description: values.description,
        due_date: dueISO,
        max_points: values.max_points,
      })
      .select('*')
      .single()

    if (error) {
      toast.error('Failed to create assignment.')
      return
    }

    toast.success('Assignment created.')
    const newAssignment: AssignmentWithMeta = {
      ...(data as Omit<AssignmentWithMeta, 'submission_count' | 'student_submission'>),
      submission_count: 0,
      student_submission: null,
    }
    setAssignments(prev => [...prev, newAssignment].sort(
      (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    ))
    reset()
    setShowForm(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      {isTeacher && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setShowForm(v => !v)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              height: 36,
              padding: '0 14px',
              backgroundColor: showForm ? '#F1F5F9' : '#4F46E5',
              color: showForm ? '#0F172A' : '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 150ms ease',
            }}
          >
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? 'Cancel' : 'New Assignment'}
          </button>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <h3
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 15,
              fontWeight: 700,
              color: '#0F172A',
              margin: 0,
            }}
          >
            New Assignment
          </h3>

          {/* Title */}
          <Field label="Title" error={errors.title?.message}>
            <input
              {...register('title')}
              placeholder="e.g. Chapter 4 Reading Response"
              style={inputStyle(!!errors.title)}
              onFocus={focusStyle}
              onBlur={blurStyle(!!errors.title)}
            />
          </Field>

          {/* Description */}
          <Field label="Instructions" error={errors.description?.message}>
            <textarea
              {...register('description')}
              placeholder="Describe the assignment…"
              rows={3}
              style={{
                ...inputStyle(!!errors.description),
                height: 'auto',
                resize: 'vertical',
                padding: '8px 12px',
                lineHeight: 1.6,
              }}
              onFocus={focusStyle}
              onBlur={blurStyle(!!errors.description)}
            />
          </Field>

          {/* Due date + points row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Due date & time" error={errors.due_date?.message}>
              <input
                {...register('due_date')}
                type="datetime-local"
                style={inputStyle(!!errors.due_date)}
                onFocus={focusStyle}
                onBlur={blurStyle(!!errors.due_date)}
              />
            </Field>
            <Field label="Points" error={errors.max_points?.message}>
              <input
                {...register('max_points', { valueAsNumber: true })}
                type="number"
                placeholder="100"
                min={1}
                max={1000}
                style={inputStyle(!!errors.max_points)}
                onFocus={focusStyle}
                onBlur={blurStyle(!!errors.max_points)}
              />
            </Field>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              onClick={() => { reset(); setShowForm(false) }}
              style={secondaryBtn}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                ...primaryBtn,
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {isSubmitting ? 'Creating…' : 'Create Assignment'}
            </button>
          </div>
        </form>
      )}

      {/* Assignment list */}
      {assignments.length === 0 ? (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: '48px 24px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: '#EEF2FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
            }}
          >
            <ClipboardList size={24} color="#4F46E5" />
          </div>
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 15,
              fontWeight: 700,
              color: '#0F172A',
              margin: '0 0 6px 0',
            }}
          >
            No assignments yet
          </p>
          <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
            {isTeacher
              ? 'Create your first assignment to get started.'
              : 'Your teacher hasn\'t posted any assignments yet.'}
          </p>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 160px 90px 120px 40px',
              padding: '0 20px',
              height: 40,
              backgroundColor: '#F8FAFC',
              borderBottom: '1px solid #F1F5F9',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {['Assignment', 'Due Date', 'Points', isTeacher ? 'Submissions' : 'Status', ''].map(
              (h, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#64748B',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    textAlign: i >= 1 ? 'center' : 'left',
                  }}
                >
                  {h}
                </span>
              )
            )}
          </div>

          {/* Rows */}
          {assignments.map((assignment, i) => {
            const due = formatDue(assignment.due_date)
            const sub = assignment.student_submission
            const statusKey = (sub?.status ?? 'pending') as keyof typeof submissionStatusConfig
            const statusCfg = submissionStatusConfig[statusKey] ?? submissionStatusConfig.pending
            const StatusIcon = statusCfg.Icon

            return (
              <Link
                key={assignment.id}
                href={`/classroom/${classroom_id}/assignment/${assignment.id}`}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 160px 90px 120px 40px',
                    padding: '0 20px',
                    height: 52,
                    borderBottom:
                      i < assignments.length - 1 ? '1px solid #F1F5F9' : 'none',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'background-color 120ms ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e =>
                    ((e.currentTarget as HTMLElement).style.backgroundColor = '#F8FAFC')
                  }
                  onMouseLeave={e =>
                    ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')
                  }
                >
                  {/* Title */}
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#0F172A',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {assignment.title}
                  </span>

                  {/* Due date */}
                  <span
                    style={{
                      fontSize: 13,
                      color: due.overdue ? '#EF4444' : due.urgent ? '#D97706' : '#64748B',
                      fontWeight: due.urgent || due.overdue ? 600 : 400,
                      textAlign: 'center',
                    }}
                  >
                    {due.label}
                  </span>

                  {/* Points */}
                  <span
                    style={{
                      fontSize: 13,
                      color: '#475569',
                      textAlign: 'center',
                    }}
                  >
                    {assignment.max_points} pts
                  </span>

                  {/* Status / Submissions */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {isTeacher ? (
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color:
                            assignment.submission_count > 0 ? '#059669' : '#94A3B8',
                        }}
                      >
                        {assignment.submission_count}
                        <span style={{ fontWeight: 400, color: '#94A3B8' }}>
                          /{totalStudents}
                        </span>
                      </span>
                    ) : (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          color: statusCfg.color,
                          backgroundColor: statusCfg.bg,
                          borderRadius: 9999,
                          padding: '3px 10px',
                        }}
                      >
                        <StatusIcon size={11} />
                        {statusCfg.label}
                      </span>
                    )}
                  </div>

                  {/* Chevron */}
                  <ChevronRight size={16} color="#CBD5E1" style={{ justifySelf: 'center' }} />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── Shared form helpers ─────────────────────────────────────── */

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{label}</label>
      {children}
      {error && <span style={{ fontSize: 12, color: '#EF4444' }}>{error}</span>}
    </div>
  )
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    height: 38,
    width: '100%',
    border: `1px solid ${hasError ? '#EF4444' : '#E2E8F0'}`,
    borderRadius: 8,
    padding: '0 12px',
    fontSize: 14,
    fontFamily: "'Inter', sans-serif",
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    outline: 'none',
    transition: 'border-color 150ms ease, box-shadow 150ms ease',
    boxSizing: 'border-box',
    boxShadow: hasError ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none',
  }
}

function focusStyle(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = '#4F46E5'
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)'
}

function blurStyle(hasError: boolean) {
  return (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!hasError) {
      e.currentTarget.style.borderColor = '#E2E8F0'
      e.currentTarget.style.boxShadow = 'none'
    }
  }
}

const primaryBtn: React.CSSProperties = {
  height: 36,
  padding: '0 16px',
  backgroundColor: '#4F46E5',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
}

const secondaryBtn: React.CSSProperties = {
  height: 36,
  padding: '0 16px',
  backgroundColor: '#FFFFFF',
  color: '#0F172A',
  border: '1px solid #E2E8F0',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
}
