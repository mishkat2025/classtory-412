'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, AlertCircle, Send, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { FileUpload } from '@/components/shared/FileUpload'

interface SubmissionFormProps {
  assignmentId: string
  classroomId: string
  studentId: string
  isOverdue: boolean
  maxPoints: number
}

export function SubmissionForm({ assignmentId, classroomId, studentId, isOverdue, maxPoints }: SubmissionFormProps) {
  const router = useRouter()
  const [tab, setTab] = useState<'text' | 'file'>('text')
  const [text, setText] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (tab === 'text' && !text.trim()) {
      toast.error('Please write your submission.')
      return
    }
    if (tab === 'file' && !fileUrl) {
      toast.error('Please upload a file.')
      return
    }

    setSubmitting(true)
    const supabase = createClient()

    const { error } = await supabase.from('submissions').insert({
      assignment_id: assignmentId,
      student_id: studentId,
      text_content: tab === 'text' ? text.trim() : null,
      file_url: tab === 'file' ? fileUrl : null,
      status: isOverdue ? 'late' : 'submitted',
    })

    setSubmitting(false)

    if (error) {
      toast.error('Failed to submit. Please try again.')
      return
    }

    toast.success('Assignment submitted successfully!')
    router.refresh()
  }

  return (
    <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 17, fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 4px 0' }}>
        Your Submission
      </h2>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 20px 0' }}>
        Worth {maxPoints} points
      </p>

      {isOverdue && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--color-warning-light)', border: '1px solid #FDE68A', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
          <AlertCircle size={15} color="#D97706" />
          <p style={{ fontSize: 13, color: '#92400E', margin: 0, fontWeight: 500 }}>
            This assignment is past due. Your submission will be marked late.
          </p>
        </div>
      )}

      {/* Tab switch */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden', width: 'fit-content' }}>
        {([
          { id: 'text' as const, label: 'Write text', Icon: Send },
          { id: 'file' as const, label: 'Upload file', Icon: Upload },
        ]).map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              height: 36,
              padding: '0 16px',
              backgroundColor: tab === id ? '#4F46E5' : 'var(--color-surface)',
              color: tab === id ? '#FFFFFF' : 'var(--color-text-secondary)',
              border: 'none',
              fontSize: 13,
              fontWeight: tab === id ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 120ms ease',
            }}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {tab === 'text' ? (
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Write your answer here…"
            rows={8}
            style={{
              width: '100%',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              padding: '12px 14px',
              fontSize: 14,
              fontFamily: "'Inter', sans-serif",
              color: 'var(--color-text-primary)',
              resize: 'vertical',
              outline: 'none',
              lineHeight: 1.7,
              boxSizing: 'border-box',
              transition: 'border-color 150ms ease, box-shadow 150ms ease',
              marginBottom: 16,
            }}
            onFocus={e => { e.currentTarget.style.borderColor = '#4F46E5'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none' }}
          />
        ) : (
          <div style={{ marginBottom: 16 }}>
            <FileUpload
              bucket="submissions"
              path={`${assignmentId}/${studentId}`}
              onUpload={(url, name) => { setFileUrl(url); setFileName(name) }}
              maxSizeMB={50}
            />
            {fileUrl && (
              <p style={{ fontSize: 13, color: '#059669', margin: '8px 0 0 0', fontWeight: 500 }}>
                ✓ {fileName} ready to submit
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            height: 40,
            padding: '0 20px',
            backgroundColor: '#4F46E5',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.7 : 1,
            transition: 'background-color 150ms ease',
          }}
          onMouseEnter={e => { if (!submitting) (e.currentTarget as HTMLElement).style.backgroundColor = '#3730A3' }}
          onMouseLeave={e => { if (!submitting) (e.currentTarget as HTMLElement).style.backgroundColor = '#4F46E5' }}
        >
          {submitting && <Loader2 size={14} className="animate-spin" />}
          {submitting ? 'Submitting…' : isOverdue ? 'Submit (Late)' : 'Submit Assignment'}
        </button>
      </form>
    </div>
  )
}
