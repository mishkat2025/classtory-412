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
  BookmarkPlus,
  BookmarkCheck,
  Pencil,
  Trash2,
  Copy,
  Check,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CopyToClassroomModal } from './CopyToClassroomModal'
import type { AssignmentWithMeta } from './types'
import type { Profile } from '@/lib/types'

interface AssignmentListProps {
  initialAssignments: AssignmentWithMeta[]
  classroom_id: string
  isTeacher: boolean
  profile: Profile
  totalStudents: number
  gradeColumnAssignmentIds: Set<string>
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
  gradeColumnAssignmentIds,
}: AssignmentListProps) {
  const [assignments, setAssignments] = useState<AssignmentWithMeta[]>(initialAssignments)
  const [showForm, setShowForm] = useState(false)
  const [inGradebook, setInGradebook] = useState<Set<string>>(new Set(gradeColumnAssignmentIds))
  const [addingToGradebook, setAddingToGradebook] = useState<string | null>(null)
  const supabase = createClient()

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ title: '', description: '', due_date: '', max_points: 0 })
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Copy modal state
  const [copyingItem, setCopyingItem] = useState<AssignmentWithMeta | null>(null)

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

  async function addToGradebook(assignment: AssignmentWithMeta) {
    if (inGradebook.has(assignment.id)) return
    setAddingToGradebook(assignment.id)

    // Use the existing sort_order = current count of grade_columns for this classroom
    const { data: existing } = await supabase
      .from('grade_columns')
      .select('id')
      .eq('classroom_id', classroom_id)
    const sortOrder = (existing ?? []).length

    const { data: newCol, error } = await supabase
      .from('grade_columns')
      .insert({
        classroom_id,
        title: assignment.title,
        max_raw: assignment.max_points,
        max_converted: null,
        sort_order: sortOrder,
        source_assignment_id: assignment.id,
      })
      .select('id')
      .single()

    if (error || !newCol) {
      setAddingToGradebook(null)
      toast.error('Failed to add to gradebook: ' + (error?.message ?? 'unknown error'))
      return
    }

    // Import existing graded submissions into grade_values
    const { data: gradedSubmissions } = await supabase
      .from('submissions')
      .select('student_id, grade')
      .eq('assignment_id', assignment.id)
      .not('grade', 'is', null)

    if (gradedSubmissions && gradedSubmissions.length > 0) {
      const gradeValueRows = gradedSubmissions.map(s => ({
        column_id: newCol.id,
        student_id: s.student_id as string,
        raw_score: s.grade as number,
      }))
      await supabase.from('grade_values').insert(gradeValueRows)
    }

    setAddingToGradebook(null)
    setInGradebook(prev => new Set([...prev, assignment.id]))
    const imported = gradedSubmissions?.length ?? 0
    toast.success(
      `"${assignment.title}" added to Grade Sheet.${imported > 0 ? ` Imported ${imported} grade${imported !== 1 ? 's' : ''}.` : ''}`
    )
  }

  /* ── Edit assignment ────────────────────────────────────────── */
  function startEdit(a: AssignmentWithMeta) {
    const localDue = new Date(a.due_date)
    const pad = (n: number) => String(n).padStart(2, '0')
    const local = `${localDue.getFullYear()}-${pad(localDue.getMonth()+1)}-${pad(localDue.getDate())}T${pad(localDue.getHours())}:${pad(localDue.getMinutes())}`
    setEditForm({ title: a.title, description: a.description, due_date: local, max_points: a.max_points })
    setEditingId(a.id)
  }

  async function saveEdit(id: string) {
    if (!editForm.title.trim() || !editForm.description.trim() || !editForm.due_date) return
    setIsSavingEdit(true)
    const dueISO = new Date(editForm.due_date).toISOString()
    const { error } = await supabase
      .from('assignments')
      .update({ title: editForm.title.trim(), description: editForm.description.trim(), due_date: dueISO, max_points: editForm.max_points })
      .eq('id', id)
    setIsSavingEdit(false)
    if (error) { toast.error('Failed to update assignment.'); return }
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, ...editForm, due_date: dueISO } : a))
    setEditingId(null)
    toast.success('Assignment updated.')
  }

  /* ── Delete assignment ────────────────────────────────────────── */
  async function handleDeleteAssignment(a: AssignmentWithMeta) {
    if (!window.confirm(`Delete "${a.title}"? This will also remove all submissions. This cannot be undone.`)) return
    setDeletingId(a.id)
    const { error } = await supabase.from('assignments').delete().eq('id', a.id)
    setDeletingId(null)
    if (error) { toast.error('Failed to delete assignment.'); return }
    setAssignments(prev => prev.filter(x => x.id !== a.id))
    toast.success('Assignment deleted.')
  }

  /* ── Copy assignment ───────────────────────────────────────────── */
  async function handleCopyAssignment(targetClassroomId: string) {
    if (!copyingItem) return
    const { error } = await supabase.from('assignments').insert({
      classroom_id: targetClassroomId,
      title: copyingItem.title,
      description: copyingItem.description,
      due_date: copyingItem.due_date,
      max_points: copyingItem.max_points,
    })
    if (error) toast.error('Copy failed: ' + error.message)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {copyingItem && (
        <CopyToClassroomModal
          contentType="assignment"
          contentPreview={copyingItem.title}
          currentClassroomId={classroom_id}
          teacherId={profile.id}
          onClose={() => setCopyingItem(null)}
          onCopy={handleCopyAssignment}
        />
      )}
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
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
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
              color: 'var(--color-text-primary)',
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
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
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
              color: 'var(--color-text-primary)',
              margin: '0 0 6px 0',
            }}
          >
            No assignments yet
          </p>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>
            {isTeacher
              ? 'Create your first assignment to get started.'
              : 'Your teacher hasn\'t posted any assignments yet.'}
          </p>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isTeacher ? '1fr 160px 90px 120px 130px 120px' : '1fr 160px 90px 120px 40px',
              padding: '0 20px',
              height: 40,
              backgroundColor: 'var(--color-surface-2)',
              borderBottom: '1px solid var(--color-border)',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {(isTeacher
              ? ['Assignment', 'Due Date', 'Points', 'Submissions', 'Gradebook', 'Actions']
              : ['Assignment', 'Due Date', 'Points', 'Status', '']
            ).map(
              (h, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
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
            const isEditing = editingId === assignment.id
            const isDeleting = deletingId === assignment.id

            return (
              <div key={assignment.id} style={{ opacity: isDeleting ? 0.5 : 1, transition: 'opacity 150ms' }}>
                {/* Edit panel */}
                {isTeacher && isEditing && (
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', backgroundColor: '#FAFBFF' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Title</label>
                        <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} style={{ width: '100%', height: 34, border: '1px solid #C7D2FE', borderRadius: 7, padding: '0 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 8 }}>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Due</label>
                          <input type="datetime-local" value={editForm.due_date} onChange={e => setEditForm(f => ({ ...f, due_date: e.target.value }))} style={{ width: '100%', height: 34, border: '1px solid #C7D2FE', borderRadius: 7, padding: '0 8px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Pts</label>
                          <input type="number" min={1} max={1000} value={editForm.max_points} onChange={e => setEditForm(f => ({ ...f, max_points: Number(e.target.value) }))} style={{ width: '100%', height: 34, border: '1px solid #C7D2FE', borderRadius: 7, padding: '0 8px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Instructions</label>
                      <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ width: '100%', border: '1px solid #C7D2FE', borderRadius: 7, padding: '6px 10px', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button onClick={() => saveEdit(assignment.id)} disabled={isSavingEdit} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 32, padding: '0 12px', backgroundColor: '#4F46E5', color: '#FFFFFF', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        {isSavingEdit ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Save
                      </button>
                      <button onClick={() => setEditingId(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 32, padding: '0 12px', backgroundColor: 'var(--color-surface-2)', color: 'var(--color-text-primary)', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        <X size={12} /> Cancel
                      </button>
                    </div>
                  </div>
                )}

                <Link
                  href={`/classroom/${classroom_id}/assignment/${assignment.id}`}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isTeacher ? '1fr 160px 90px 120px 130px 120px' : '1fr 160px 90px 120px 40px',
                      padding: '0 20px',
                      height: 52,
                      borderBottom: i < assignments.length - 1 ? '1px solid var(--color-border)' : 'none',
                      alignItems: 'center',
                      gap: 12,
                      transition: 'background-color 120ms ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-surface-2)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
                  >
                    {/* Title */}
                    <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {assignment.title}
                    </span>

                    {/* Due date */}
                    <span style={{ fontSize: 13, color: due.overdue ? '#EF4444' : due.urgent ? '#D97706' : '#64748B', fontWeight: due.urgent || due.overdue ? 600 : 400, textAlign: 'center' }}>
                      {due.label}
                    </span>

                    {/* Points */}
                    <span style={{ fontSize: 13, color: '#475569', textAlign: 'center' }}>
                      {assignment.max_points} pts
                    </span>

                    {/* Status / Submissions */}
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      {isTeacher ? (
                        <span style={{ fontSize: 13, fontWeight: 600, color: assignment.submission_count > 0 ? '#059669' : '#94A3B8' }}>
                          {assignment.submission_count}<span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>/{totalStudents}</span>
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: statusCfg.color, backgroundColor: statusCfg.bg, borderRadius: 9999, padding: '3px 10px' }}>
                          <StatusIcon size={11} />{statusCfg.label}
                        </span>
                      )}
                    </div>

                    {/* Add to Gradebook (teacher only) */}
                    {isTeacher && (() => {
                      const added = inGradebook.has(assignment.id)
                      const gbLoading = addingToGradebook === assignment.id
                      return (
                        <div style={{ display: 'flex', justifyContent: 'center' }}
                          onClick={e => { e.preventDefault(); e.stopPropagation(); addToGradebook(assignment) }}>
                          <button
                            disabled={added || gbLoading}
                            title={added ? 'Already in Grade Sheet' : 'Add as a grade column'}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 28, padding: '0 10px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: added ? 'default' : 'pointer', border: 'none', backgroundColor: added ? '#D1FAE5' : '#EEF2FF', color: added ? '#065F46' : '#4F46E5', transition: 'all 120ms ease', whiteSpace: 'nowrap' }}
                          >
                            {gbLoading ? <Loader2 size={11} className="animate-spin" /> : added ? <BookmarkCheck size={11} /> : <BookmarkPlus size={11} />}
                            {gbLoading ? 'Adding…' : added ? 'In sheet' : 'Add to sheet'}
                          </button>
                        </div>
                      )
                    })()}

                    {/* Teacher action buttons */}
                    {isTeacher ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                        onClick={e => { e.preventDefault(); e.stopPropagation() }}>
                        <button onClick={() => startEdit(assignment)} title="Edit" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: '#475569', cursor: 'pointer' }}>
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => setCopyingItem(assignment)} title="Copy to class" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, border: '1px solid #C7D2FE', backgroundColor: '#EEF2FF', color: '#3730A3', cursor: 'pointer' }}>
                          <Copy size={12} />
                        </button>
                        <button onClick={() => handleDeleteAssignment(assignment)} disabled={isDeleting} title="Delete" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, border: '1px solid #FECACA', backgroundColor: '#FEE2E2', color: '#991B1B', cursor: 'pointer' }}>
                          {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        </button>
                      </div>
                    ) : (
                      <ChevronRight size={16} color="#CBD5E1" style={{ justifySelf: 'center' }} />
                    )}
                  </div>
                </Link>
              </div>
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
      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{label}</label>
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
    color: 'var(--color-text-primary)',
    backgroundColor: 'var(--color-surface)',
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
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
}
