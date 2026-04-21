'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  CalendarDays, Plus, Pencil, Trash2, X, Loader2,
  BookOpen, ClipboardList, GraduationCap, Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { ScheduleItem, ScheduleItemType } from '@/lib/types'

/* ─── Schema ─────────────────────────────────────────────────────── */
const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(0),
  event_date: z.string().min(1, 'Date & time is required'),
  type: z.enum(['exam', 'assignment', 'class', 'custom']),
  classroom_id: z.string().min(0),
})

type FormData = z.infer<typeof schema>

/* ─── Helpers ────────────────────────────────────────────────────── */
const TYPE_LABELS: Record<ScheduleItemType, string> = {
  exam: 'Exam',
  assignment: 'Assignment Deadline',
  class: 'Class / Session',
  custom: 'Custom Event',
}

const TYPE_COLORS: Record<ScheduleItemType, { bg: string; text: string }> = {
  exam:       { bg: 'var(--color-danger-light)', text: '#991B1B' },
  assignment: { bg: 'var(--color-warning-light)', text: '#92400E' },
  class:      { bg: 'var(--color-success-light)', text: '#065F46' },
  custom:     { bg: 'var(--color-primary-light)', text: '#3730A3' },
}

const TYPE_ICONS: Record<ScheduleItemType, React.ReactNode> = {
  exam:       <GraduationCap size={14} />,
  assignment: <ClipboardList size={14} />,
  class:      <BookOpen size={14} />,
  custom:     <Sparkles size={14} />,
}

function formatEventDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function toDatetimeLocal(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/* ─── Props ──────────────────────────────────────────────────────── */
interface ClassroomOption {
  id: string
  name: string
}

interface ScheduleManagerProps {
  teacherId: string
  classrooms: ClassroomOption[]
}

/* ─── Component ──────────────────────────────────────────────────── */
export function ScheduleManager({ teacherId, classrooms }: ScheduleManagerProps) {
  const [items, setItems] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ScheduleItem | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      event_date: '',
      type: 'class',
      classroom_id: classrooms[0]?.id ?? '',
    },
  })

  /* ── Fetch ──────────────────────────────────────────────────────── */
  const fetchItems = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('schedule_items')
      .select('*, classroom:classrooms(name)')
      .eq('teacher_id', teacherId)
      .order('event_date', { ascending: true })

    if (error) {
      toast.error('Failed to load schedule')
    } else {
      setItems((data ?? []) as ScheduleItem[])
    }
    setLoading(false)
  }, [teacherId])

  useEffect(() => { fetchItems() }, [fetchItems])

  /* ── Open modal ─────────────────────────────────────────────────── */
  function openCreate() {
    setEditing(null)
    reset({
      title: '',
      description: '',
      event_date: '',
      type: 'class',
      classroom_id: classrooms[0]?.id ?? '',
    })
    setModalOpen(true)
  }

  function openEdit(item: ScheduleItem) {
    setEditing(item)
    reset({
      title: item.title,
      description: item.description,
      event_date: toDatetimeLocal(item.event_date),
      type: item.type,
      classroom_id: item.classroom_id ?? '',
    })
    setModalOpen(true)
  }

  /* ── Submit ─────────────────────────────────────────────────────── */
  async function onSubmit(values: FormData) {
    const supabase = createClient()

    // Parse the datetime-local string as local time → ISO
    const parsedDate = new Date(values.event_date)
    if (isNaN(parsedDate.getTime())) {
      toast.error('Invalid date — please pick a date and time')
      return
    }

    const payload = {
      teacher_id: teacherId,
      title: values.title.trim(),
      description: values.description ?? '',
      event_date: parsedDate.toISOString(),
      type: values.type,
      classroom_id: values.classroom_id || null,
    }

    if (editing) {
      const { error } = await supabase
        .from('schedule_items')
        .update(payload)
        .eq('id', editing.id)
      if (error) {
        console.error('Schedule update error:', error)
        toast.error(`Failed to update: ${error.message}`)
        return
      }
      toast.success('Schedule item updated')
    } else {
      const { error } = await supabase
        .from('schedule_items')
        .insert(payload)
      if (error) {
        console.error('Schedule insert error:', error)
        toast.error(`Failed to create: ${error.message}`)
        return
      }
      toast.success('Schedule item created')
    }

    setModalOpen(false)
    fetchItems()
  }

  /* ── Delete ─────────────────────────────────────────────────────── */
  async function handleDelete(id: string) {
    setDeletingId(id)
    const supabase = createClient()
    const { error } = await supabase.from('schedule_items').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete item')
    } else {
      toast.success('Item deleted')
      setItems(prev => prev.filter(i => i.id !== id))
    }
    setDeletingId(null)
  }

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <>
      {/* Section */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarDays size={16} color="#4F46E5" />
            </div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 17, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
              Schedule
            </h2>
          </div>
          <button
            onClick={openCreate}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', backgroundColor: '#4F46E5', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
          >
            <Plus size={14} />
            Add Event
          </button>
        </div>

        <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          {loading ? (
            <div style={{ padding: '36px 24px', textAlign: 'center' }}>
              <Loader2 size={24} color="#94A3B8" style={{ margin: '0 auto', display: 'block', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : items.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <CalendarDays size={22} color="#4F46E5" />
              </div>
              <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: '0 0 4px 0', fontWeight: 500 }}>No schedule items yet</p>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>Add exams, class sessions, or deadlines.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
                  {['Event', 'Type', 'Classroom', 'Date & Time', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const colors = TYPE_COLORS[item.type]
                  const isPast = new Date(item.event_date) < new Date()
                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: i < items.length - 1 ? '1px solid var(--color-border)' : 'none',
                        opacity: isPast ? 0.55 : 1,
                      }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 2px 0' }}>{item.title}</p>
                        {item.description && (
                          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>{item.description}</p>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500, color: colors.text, backgroundColor: colors.bg, borderRadius: 9999, padding: '3px 10px' }}>
                          {TYPE_ICONS[item.type]}
                          {TYPE_LABELS[item.type]}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                          {(item.classroom as { name: string } | null)?.name ?? <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 13, color: isPast ? '#94A3B8' : '#0F172A', fontWeight: 500 }}>
                          {formatEventDate(item.event_date)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => openEdit(item)}
                            title="Edit"
                            style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Pencil size={13} color="#475569" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            title="Delete"
                            disabled={deletingId === item.id}
                            style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid #FEE2E2', backgroundColor: 'var(--color-danger-light)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            {deletingId === item.id
                              ? <Loader2 size={13} color="#DC2626" style={{ animation: 'spin 1s linear infinite' }} />
                              : <Trash2 size={13} color="#DC2626" />
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ── Modal ──────────────────────────────────────────────────── */}
      {modalOpen && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}
        >
          <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 16, width: '100%', maxWidth: 520, boxShadow: '0 8px 32px rgba(0,0,0,0.16)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 17, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                {editing ? 'Edit Schedule Item' : 'New Schedule Item'}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={15} color="#475569" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Title */}
              <div>
                <label style={labelStyle}>Title *</label>
                <input
                  {...register('title')}
                  placeholder="e.g. Midterm Exam, Chapter 5 Deadline"
                  style={inputStyle(!!errors.title)}
                />
                {errors.title && <p style={errStyle}>{errors.title.message}</p>}
              </div>

              {/* Type + Classroom row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Type *</label>
                  <select {...register('type')} style={inputStyle(!!errors.type)}>
                    <option value="class">Class / Session</option>
                    <option value="exam">Exam</option>
                    <option value="assignment">Assignment Deadline</option>
                    <option value="custom">Custom Event</option>
                  </select>
                  {errors.type && <p style={errStyle}>{errors.type.message}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Classroom (optional)</label>
                  <select {...register('classroom_id')} style={inputStyle(false)}>
                    <option value="">— None —</option>
                    {classrooms.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date */}
              <div>
                <label style={labelStyle}>Date & Time *</label>
                <input
                  type="datetime-local"
                  {...register('event_date')}
                  style={inputStyle(!!errors.event_date)}
                />
                {errors.event_date && <p style={errStyle}>{errors.event_date.message}</p>}
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>Description (optional)</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  placeholder="Additional notes…"
                  style={{ ...inputStyle(false), height: 'auto', resize: 'vertical', paddingTop: 8, paddingBottom: 8 }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
                <button type="button" onClick={() => setModalOpen(false)} style={{ height: 38, padding: '0 16px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} style={{ height: 38, padding: '0 18px', backgroundColor: '#4F46E5', border: 'none', color: '#FFFFFF', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  {isSubmitting && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                  {editing ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

/* ─── Style helpers ──────────────────────────────────────────────── */
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: '#374151',
  marginBottom: 6,
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: '100%',
    height: 38,
    border: `1px solid ${hasError ? '#EF4444' : '#E2E8F0'}`,
    borderRadius: 8,
    padding: '0 12px',
    fontSize: 14,
    color: 'var(--color-text-primary)',
    backgroundColor: 'var(--color-surface)',
    outline: 'none',
    boxSizing: 'border-box',
  }
}

const errStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#EF4444',
  marginTop: 4,
}
