'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { generateClassCode } from '@/lib/utils/classCode'

const COVER_COLORS = [
  '#4F46E5', '#0891B2', '#059669', '#D97706', '#DC2626',
  '#7C3AED', '#C2410C', '#0369A1', '#065F46', '#9333EA',
]

const schema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  subject: z.string().min(2, 'Subject is required'),
  cover_color: z.string().min(1, 'Select a color'),
})

type FormData = z.infer<typeof schema>

interface CreateClassroomButtonProps {
  teacherId: string
}

export function CreateClassroomButton({ teacherId }: CreateClassroomButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedColor, setSelectedColor] = useState(COVER_COLORS[0])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { cover_color: COVER_COLORS[0] },
  })

  async function onSubmit(values: FormData) {
    const supabase = createClient()
    const classCode = generateClassCode()

    const { data, error } = await supabase
      .from('classrooms')
      .insert({
        name: values.name,
        subject: values.subject,
        cover_color: values.cover_color,
        teacher_id: teacherId,
        class_code: classCode,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Classroom insert error:', error)
      toast.error(`Failed to create classroom: ${error.message}`)
      return
    }

    toast.success(`Classroom created! Code: ${classCode}`)
    setOpen(false)
    reset()
    router.refresh()
    router.push(`/classroom/${data.id}`)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          height: 38,
          padding: '0 16px',
          backgroundColor: '#4F46E5',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'background-color 150ms ease',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#3730A3' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#4F46E5' }}
      >
        <Plus size={16} />
        New Classroom
      </button>

      {/* Modal */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          {/* Backdrop */}
          <div
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)' }}
            onClick={() => setOpen(false)}
          />

          {/* Dialog */}
          <div style={{ position: 'relative', width: '100%', maxWidth: 480, backgroundColor: 'var(--color-surface)', borderRadius: 16, padding: '28px 28px 24px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                Create Classroom
              </h2>
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: 4, borderRadius: 6 }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <Field label="Classroom name" error={errors.name?.message}>
                <input
                  {...register('name')}
                  placeholder="e.g. Advanced Mathematics 101"
                  style={inputStyle(!!errors.name)}
                  onFocus={e => { e.currentTarget.style.borderColor = '#4F46E5'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = errors.name ? '#EF4444' : '#E2E8F0'; e.currentTarget.style.boxShadow = 'none' }}
                />
              </Field>

              <Field label="Subject" error={errors.subject?.message}>
                <input
                  {...register('subject')}
                  placeholder="e.g. Mathematics"
                  style={inputStyle(!!errors.subject)}
                  onFocus={e => { e.currentTarget.style.borderColor = '#4F46E5'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = errors.subject ? '#EF4444' : '#E2E8F0'; e.currentTarget.style.boxShadow = 'none' }}
                />
              </Field>

              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', display: 'block', marginBottom: 8 }}>Cover color</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {COVER_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => { setSelectedColor(color); setValue('cover_color', color) }}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: color,
                        border: selectedColor === color ? '3px solid #0F172A' : '3px solid transparent',
                        cursor: 'pointer',
                        outline: selectedColor === color ? '2px solid #FFFFFF' : 'none',
                        outlineOffset: -4,
                        transition: 'transform 120ms ease',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
                    />
                  ))}
                </div>
                {errors.cover_color && <span style={{ fontSize: 12, color: '#EF4444', marginTop: 4, display: 'block' }}>{errors.cover_color.message}</span>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => { setOpen(false); reset() }}
                  style={{ height: 38, padding: '0 16px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    height: 38,
                    padding: '0 18px',
                    backgroundColor: '#4F46E5',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  {isSubmitting ? 'Creating…' : 'Create Classroom'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
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
  }
}
