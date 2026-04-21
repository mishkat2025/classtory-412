'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Pencil, Loader2, X, Trash2, LayoutDashboard } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { generateClassCode } from '@/lib/utils/classCode'

const CATEGORIES = [
  'Mathematics', 'Science', 'English', 'History', 'Computer Science',
  'Art', 'Music', 'Physical Education', 'Languages', 'Other',
]

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Select a category'),
  price: z.number().min(0, 'Price must be 0 or more'),
  tags: z.string().min(0),
})
type FormValues = z.infer<typeof schema>

interface Props {
  course: {
    id: string
    title: string
    description: string
    category: string
    price: number
    tags: string[]
    student_count: number
  }
  linkedClassroomId: string | null
}

export function EditCourseCard({ course, linkedClassroomId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [creatingRoom, setCreatingRoom] = useState(false)
  const [roomId, setRoomId] = useState<string | null>(linkedClassroomId)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: course.title,
      description: course.description,
      category: course.category,
      price: course.price,
      tags: (course.tags ?? []).join(', '),
    },
  })

  async function onSubmit(values: FormValues) {
    const supabase = createClient()
    const tags = values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    const { error } = await supabase
      .from('courses')
      .update({ title: values.title, description: values.description, category: values.category, price: values.price, tags })
      .eq('id', course.id)
    if (error) { toast.error('Failed to update: ' + error.message); return }
    toast.success('Course updated!')
    setOpen(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('Delete this course? This cannot be undone.')) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('courses').delete().eq('id', course.id)
    if (error) { toast.error('Delete failed: ' + error.message); setDeleting(false); return }
    toast.success('Course deleted.')
    router.push('/teacher')
  }

  async function handleSetupRoom() {
    setCreatingRoom(true)
    const supabase = createClient()
    const COVER_COLORS = ['#4F46E5', '#0891B2', '#059669', '#D97706', '#DC2626', '#7C3AED']
    const color = COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)]

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setCreatingRoom(false); return }

    const { data: classroomData, error: clsErr } = await supabase
      .from('classrooms')
      .insert({ name: course.title, subject: course.category, class_code: generateClassCode(), teacher_id: user.id, cover_color: color })
      .select('id')
      .single()

    if (clsErr || !classroomData) { toast.error('Failed to create room: ' + clsErr?.message); setCreatingRoom(false); return }

    const { error: updateErr } = await supabase
      .from('courses')
      .update({ linked_classroom_id: classroomData.id })
      .eq('id', course.id)

    if (updateErr) { toast.error('Failed to link room.'); setCreatingRoom(false); return }

    setRoomId(classroomData.id)
    setCreatingRoom(false)
    toast.success('Course Room created!')
    router.refresh()
  }

  return (
    <>
      {/* Instructor management card */}
      <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#3730A3', backgroundColor: '#EEF2FF', borderRadius: 9999, padding: '3px 12px', marginBottom: 16 }}>
          Your Course
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <div style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '12px 14px' }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{course.student_count ?? 0}</p>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>Students enrolled</p>
          </div>
          <div style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '12px 14px' }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#10B981', margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {course.price === 0 ? 'Free' : `$${course.price}`}
            </p>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>Price</p>
          </div>
        </div>

        {/* Actions */}
        <button
          onClick={() => setOpen(true)}
          style={{ width: '100%', height: 42, backgroundColor: '#4F46E5', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}
        >
          <Pencil size={15} />
          Edit Course
        </button>

        {/* Course Room button */}
        {roomId ? (
          <Link
            href={`/classroom/${roomId}`}
            style={{ width: '100%', height: 42, backgroundColor: '#1E1B4B', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10, textDecoration: 'none' }}
          >
            <LayoutDashboard size={15} />
            Manage Course Room
          </Link>
        ) : (
          <button
            onClick={handleSetupRoom}
            disabled={creatingRoom}
            style={{ width: '100%', height: 42, backgroundColor: creatingRoom ? '#E2E8F0' : '#EEF2FF', color: creatingRoom ? '#94A3B8' : '#4F46E5', border: '1px solid #C7D2FE', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: creatingRoom ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}
          >
            {creatingRoom ? <Loader2 size={14} className="animate-spin" /> : <LayoutDashboard size={15} />}
            {creatingRoom ? 'Setting up…' : 'Set Up Course Room'}
          </button>
        )}

        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{ width: '100%', height: 42, backgroundColor: deleting ? '#F1F5F9' : '#FEE2E2', color: deleting ? '#94A3B8' : '#DC2626', border: '1px solid #FECACA', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          {deleting ? 'Deleting…' : 'Delete Course'}
        </button>
      </div>

      {/* Edit modal */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 48px rgba(0,0,0,0.18)', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>Edit Course</h2>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={lbl}>Course Title</label>
                <input {...register('title')} style={inp(!!errors.title)} />
                {errors.title && <span style={err}>{errors.title.message}</span>}
              </div>
              <div>
                <label style={lbl}>Description</label>
                <textarea {...register('description')} rows={4} style={{ ...inp(!!errors.description), height: 'auto', padding: '10px 12px', resize: 'vertical' }} />
                {errors.description && <span style={err}>{errors.description.message}</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>Category</label>
                  <select {...register('category')} style={inp(!!errors.category)}>
                    <option value="">Select…</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.category && <span style={err}>{errors.category.message}</span>}
                </div>
                <div>
                  <label style={lbl}>Price ($)</label>
                  <input {...register('price', { valueAsNumber: true })} type="number" min={0} step={0.01} style={inp(!!errors.price)} />
                  {errors.price && <span style={err}>{errors.price.message}</span>}
                </div>
              </div>
              <div>
                <label style={lbl}>Tags <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(comma-separated)</span></label>
                <input {...register('tags')} placeholder="e.g. math, algebra, grade 9" style={inp(false)} />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setOpen(false)} style={{ flex: 1, height: 40, backgroundColor: 'var(--color-surface-2)', color: '#475569', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} style={{ flex: 2, height: 40, backgroundColor: isSubmitting ? '#A5B4FC' : '#4F46E5', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

const lbl: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 6 }
const err: React.CSSProperties = { fontSize: 12, color: '#EF4444', marginTop: 4, display: 'block' }
function inp(hasError: boolean): React.CSSProperties {
  return { width: '100%', height: 38, border: `1px solid ${hasError ? '#EF4444' : '#E2E8F0'}`, borderRadius: 8, padding: '0 12px', fontSize: 14, fontFamily: 'inherit', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', boxSizing: 'border-box', outline: 'none' }
}
