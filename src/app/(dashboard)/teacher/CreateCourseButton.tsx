'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { generateClassCode } from '@/lib/utils/classCode'

const CATEGORIES = [
  'General', 'Mathematics', 'Science', 'English', 'History',
  'Programming', 'Art', 'Music', 'Physical Education', 'Languages',
]

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Select a category'),
  price: z.coerce.number().min(0, 'Price must be 0 or more'),
  tags: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface CreateCourseButtonProps {
  teacherId: string
}

export function CreateCourseButton({ teacherId }: CreateCourseButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', category: 'General', price: 0, tags: '' },
  })

  async function onSubmit(values: FormData) {
    const supabase = createClient()
    const tags = values.tags
      ? values.tags.split(',').map(t => t.trim()).filter(Boolean)
      : []

    // 1. Create the course
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .insert({
        title: values.title,
        description: values.description,
        category: values.category,
        price: values.price,
        tags,
        instructor_id: teacherId,
      })
      .select('id')
      .single()

    if (courseError || !courseData) {
      toast.error('Failed to create course: ' + courseError?.message)
      return
    }

    // 2. Create a linked classroom for the course
    const COVER_COLORS = ['#4F46E5', '#0891B2', '#059669', '#D97706', '#DC2626', '#7C3AED']
    const color = COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)]

    const { data: classroomData } = await supabase
      .from('classrooms')
      .insert({
        name: values.title,
        subject: values.category,
        class_code: generateClassCode(),
        teacher_id: teacherId,
        cover_color: color,
      })
      .select('id')
      .single()

    // 3. Link classroom to course
    if (classroomData) {
      await supabase
        .from('courses')
        .update({ linked_classroom_id: classroomData.id })
        .eq('id', courseData.id)
    }

    toast.success('Course created!')
    setOpen(false)
    reset()
    router.refresh()
    router.push(`/courses/${courseData.id}`)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          height: 38, padding: '0 16px', backgroundColor: '#4F46E5',
          color: '#FFFFFF', border: 'none', borderRadius: 8,
          fontSize: 14, fontWeight: 600, cursor: 'pointer',
          transition: 'background-color 150ms ease',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#3730A3' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#4F46E5' }}
      >
        <Plus size={16} /> New Course
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)' }} onClick={() => setOpen(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 520, backgroundColor: '#FFFFFF', borderRadius: 16, padding: '28px 28px 24px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Create Course
              </h2>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', padding: 4, borderRadius: 6 }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Course title</label>
                <input {...register('title')} placeholder="e.g. Introduction to Algebra" style={inputStyle(!!errors.title)} />
                {errors.title && <span style={errStyle}>{errors.title.message}</span>}
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  {...register('description')}
                  placeholder="What will students learn in this course?"
                  rows={3}
                  style={{ ...inputStyle(!!errors.description), height: 'auto', padding: '10px 12px', resize: 'vertical' }}
                />
                {errors.description && <span style={errStyle}>{errors.description.message}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select {...register('category')} style={{ ...inputStyle(!!errors.category), cursor: 'pointer' }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.category && <span style={errStyle}>{errors.category.message}</span>}
                </div>
                <div>
                  <label style={labelStyle}>Price (USD)</label>
                  <input {...register('price')} type="number" min="0" step="0.01" placeholder="0 = Free" style={inputStyle(!!errors.price)} />
                  {errors.price && <span style={errStyle}>{errors.price.message}</span>}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Tags <span style={{ color: '#94A3B8', fontWeight: 400 }}>(comma separated)</span></label>
                <input {...register('tags')} placeholder="e.g. beginner, math, algebra" style={inputStyle(false)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => { setOpen(false); reset() }} style={{ height: 38, padding: '0 16px', backgroundColor: '#FFFFFF', color: '#0F172A', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} style={{ height: 38, padding: '0 18px', backgroundColor: '#4F46E5', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  {isSubmitting ? 'Creating…' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: '#0F172A', marginBottom: 6 }
const errStyle: React.CSSProperties = { fontSize: 12, color: '#EF4444', marginTop: 4, display: 'block' }
function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: '100%', height: 38, border: `1px solid ${hasError ? '#EF4444' : '#E2E8F0'}`,
    borderRadius: 8, padding: '0 12px', fontSize: 14, outline: 'none',
    fontFamily: 'inherit', backgroundColor: '#FFFFFF', color: '#0F172A',
    boxSizing: 'border-box',
  }
}
