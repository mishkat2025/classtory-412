'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Save, ExternalLink, FileText, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Submission {
  id: string
  student_id: string
  status: string
  text_content: string | null
  file_url: string | null
  grade: number | null
  feedback: string | null
  submitted_at: string
  student: { id: string; full_name: string; email: string; avatar_url: string | null } | null
}

interface GradeSubmissionsProps {
  submissions: Submission[]
  maxPoints: number
  assignmentId: string
}

export function GradeSubmissions({ submissions, maxPoints, assignmentId }: GradeSubmissionsProps) {
  const [grades, setGrades] = useState<Map<string, { grade: string; feedback: string }>>(
    new Map(submissions.map(s => [s.id, {
      grade: s.grade !== null ? String(s.grade) : '',
      feedback: s.feedback ?? '',
    }]))
  )
  const [saving, setSaving] = useState<string | null>(null)

  async function saveGrade(submissionId: string) {
    const val = grades.get(submissionId)
    if (!val) return
    const gradeNum = val.grade === '' ? null : Number(val.grade)
    if (gradeNum !== null && (isNaN(gradeNum) || gradeNum < 0 || gradeNum > maxPoints)) {
      toast.error(`Grade must be 0–${maxPoints}`)
      return
    }

    setSaving(submissionId)
    const supabase = createClient()
    const { error } = await supabase
      .from('submissions')
      .update({ grade: gradeNum, feedback: val.feedback, status: gradeNum !== null ? 'graded' : 'submitted' })
      .eq('id', submissionId)

    setSaving(null)
    if (error) toast.error('Failed to save grade.')
    else toast.success('Grade saved.')
  }

  if (submissions.length === 0) {
    return (
      <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '40px 24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <Users size={32} color="#CBD5E1" style={{ margin: '0 auto 12px', display: 'block' }} />
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>No submissions yet.</p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 17, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
          Submissions
        </h2>
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {submissions.map(sub => {
          const val = grades.get(sub.id) ?? { grade: '', feedback: '' }
          const isSaving = saving === sub.id
          const initials = sub.student?.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? '?'
          const gradeNum = val.grade !== '' ? Number(val.grade) : null
          const pct = gradeNum !== null ? Math.round((gradeNum / maxPoints) * 100) : null

          return (
            <div key={sub.id} style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              {/* Student header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                    {sub.student?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={sub.student.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>{initials}</span>
                    )}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 1px 0' }}>{sub.student?.full_name}</p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
                      {new Date(sub.submitted_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  borderRadius: 9999,
                  padding: '2px 10px',
                  backgroundColor: sub.status === 'graded' ? '#D1FAE5' : sub.status === 'late' ? '#FEE2E2' : '#DBEAFE',
                  color: sub.status === 'graded' ? '#065F46' : sub.status === 'late' ? '#991B1B' : '#1E40AF',
                }}>
                  {sub.status === 'graded' ? 'Graded' : sub.status === 'late' ? 'Late' : 'Submitted'}
                </span>
              </div>

              {/* Submission content */}
              {sub.text_content && (
                <div style={{ backgroundColor: 'var(--color-bg)', borderRadius: 8, padding: '12px 14px', border: '1px solid var(--color-border)', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <FileText size={13} color="#64748B" />
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Response</span>
                  </div>
                  <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{sub.text_content}</p>
                </div>
              )}
              {sub.file_url && (
                <div style={{ marginBottom: 16 }}>
                  <a href={sub.file_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#4F46E5', textDecoration: 'none', fontWeight: 500 }}>
                    <ExternalLink size={13} />
                    View submitted file
                  </a>
                </div>
              )}

              {/* Grading */}
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 10, alignItems: 'flex-start' }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Grade (/{maxPoints})</label>
                  <input
                    type="number"
                    min={0}
                    max={maxPoints}
                    value={val.grade}
                    onChange={e => setGrades(prev => { const n = new Map(prev); n.set(sub.id, { ...val, grade: e.target.value }); return n })}
                    placeholder="—"
                    style={{
                      height: 36,
                      width: '100%',
                      border: '1px solid var(--color-border)',
                      borderRadius: 8,
                      padding: '0 10px',
                      fontSize: 14,
                      fontFamily: "'Inter', sans-serif",
                      color: 'var(--color-text-primary)',
                      outline: 'none',
                      boxSizing: 'border-box',
                      textAlign: 'center',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#4F46E5'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(79,70,229,0.1)' }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none' }}
                  />
                  {pct !== null && (
                    <p style={{ fontSize: 11, color: pct >= 80 ? '#059669' : pct >= 60 ? '#D97706' : '#DC2626', fontWeight: 600, margin: '3px 0 0 0', textAlign: 'center' }}>{pct}%</p>
                  )}
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Feedback (optional)</label>
                  <textarea
                    value={val.feedback}
                    onChange={e => setGrades(prev => { const n = new Map(prev); n.set(sub.id, { ...val, feedback: e.target.value }); return n })}
                    placeholder="Leave feedback for the student…"
                    rows={2}
                    style={{
                      width: '100%',
                      border: '1px solid var(--color-border)',
                      borderRadius: 8,
                      padding: '8px 10px',
                      fontSize: 13,
                      fontFamily: "'Inter', sans-serif",
                      color: 'var(--color-text-primary)',
                      resize: 'vertical',
                      outline: 'none',
                      boxSizing: 'border-box',
                      lineHeight: 1.5,
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#4F46E5'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(79,70,229,0.1)' }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none' }}
                  />
                </div>
                <div style={{ paddingTop: 20 }}>
                  <button
                    onClick={() => saveGrade(sub.id)}
                    disabled={isSaving}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      height: 36,
                      padding: '0 14px',
                      backgroundColor: '#4F46E5',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      opacity: isSaving ? 0.7 : 1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    {isSaving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
