'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Download, Save, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { buildGradeCsv, downloadCsv } from '@/lib/utils/csvExport'

interface AssignmentCol {
  id: string
  title: string
  max_points: number
}

interface StudentGradeRow {
  student_id: string
  student_name: string
  student_email: string
  grades: Record<string, { grade: number | null; feedback: string; submissionId: string | null; status: string }>
}

interface GradebookProps {
  classroomName: string
  assignments: AssignmentCol[]
  students: StudentGradeRow[]
  isTeacher: boolean
}

export function Gradebook({ classroomName, assignments, students, isTeacher }: GradebookProps) {
  const [gradeMap, setGradeMap] = useState<Map<string, { grade: string; feedback: string }>>(
    new Map(
      students.flatMap(s =>
        assignments.map(a => {
          const key = `${s.student_id}:${a.id}`
          const existing = s.grades[a.id]
          return [key, {
            grade: existing?.grade !== null && existing?.grade !== undefined ? String(existing.grade) : '',
            feedback: existing?.feedback ?? '',
          }]
        })
      )
    )
  )
  const [saving, setSaving] = useState<string | null>(null)

  function setField(studentId: string, assignmentId: string, field: 'grade' | 'feedback', value: string) {
    const key = `${studentId}:${assignmentId}`
    setGradeMap(prev => {
      const next = new Map(prev)
      const existing = next.get(key) ?? { grade: '', feedback: '' }
      next.set(key, { ...existing, [field]: value })
      return next
    })
  }

  async function saveGrade(studentId: string, assignmentId: string, maxPoints: number) {
    const key = `${studentId}:${assignmentId}`
    const val = gradeMap.get(key)
    if (!val) return

    const gradeNum = val.grade === '' ? null : Number(val.grade)
    if (gradeNum !== null && (isNaN(gradeNum) || gradeNum < 0 || gradeNum > maxPoints)) {
      toast.error(`Grade must be between 0 and ${maxPoints}`)
      return
    }

    setSaving(key)
    const supabase = createClient()

    const student = students.find(s => s.student_id === studentId)
    const existing = student?.grades[assignmentId]

    if (existing?.submissionId) {
      const { error } = await supabase
        .from('submissions')
        .update({ grade: gradeNum, feedback: val.feedback, status: gradeNum !== null ? 'graded' : existing.status })
        .eq('id', existing.submissionId)

      if (error) toast.error('Failed to save grade.')
      else toast.success('Grade saved.')
    } else {
      const { error } = await supabase
        .from('submissions')
        .insert({
          assignment_id: assignmentId,
          student_id: studentId,
          grade: gradeNum,
          feedback: val.feedback,
          status: gradeNum !== null ? 'graded' : 'submitted',
          text_content: '',
        })
      if (error) toast.error('Failed to save grade.')
      else toast.success('Grade saved.')
    }

    setSaving(null)
  }

  function exportCsv() {
    const rows = students.flatMap(s =>
      assignments.map(a => {
        const g = s.grades[a.id]
        return {
          student_name: s.student_name,
          student_email: s.student_email,
          assignment_title: a.title,
          max_points: a.max_points,
          grade: g?.grade ?? null,
          feedback: g?.feedback ?? null,
          submitted: !!g?.submissionId,
          status: g?.status ?? 'not submitted',
        }
      })
    )
    const csv = buildGradeCsv(rows, classroomName)
    downloadCsv(csv, `${classroomName.replace(/\s+/g, '_')}_grades.csv`)
    toast.success('Grade sheet exported.')
  }

  if (assignments.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 24px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14 }}>
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>No assignments created yet.</p>
      </div>
    )
  }

  if (students.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 24px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14 }}>
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>No students enrolled yet.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          onClick={exportCsv}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            height: 36,
            padding: '0 14px',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 120ms ease',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-surface-2)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-surface)' }}
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Table — horizontally scrollable */}
      <div style={{ overflowX: 'auto', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', position: 'sticky', left: 0, backgroundColor: 'var(--color-surface-2)', zIndex: 1 }}>
                Student
              </th>
              {assignments.map(a => (
                <th key={a.id} style={{ padding: '10px 16px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: isTeacher ? 180 : 100 }}>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }} title={a.title}>
                    {a.title}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 400, textTransform: 'none' }}>/{a.max_points} pts</div>
                </th>
              ))}
              <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Total %
              </th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, si) => {
              const totalEarned = assignments.reduce((sum, a) => sum + (student.grades[a.id]?.grade ?? 0), 0)
              const totalMax = assignments.reduce((sum, a) => sum + a.max_points, 0)
              const totalPct = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : null

              return (
                <tr
                  key={student.student_id}
                  style={{ borderBottom: si < students.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-surface-2)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
                >
                  {/* Student name - sticky */}
                  <td style={{ padding: '12px 16px', position: 'sticky', left: 0, backgroundColor: 'inherit', zIndex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)', margin: '0 0 2px 0', whiteSpace: 'nowrap' }}>{student.student_name}</p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>{student.student_email}</p>
                  </td>

                  {assignments.map(a => {
                    const key = `${student.student_id}:${a.id}`
                    const val = gradeMap.get(key) ?? { grade: '', feedback: '' }
                    const isSaving = saving === key
                    const existing = student.grades[a.id]
                    const gradeNum = val.grade !== '' ? Number(val.grade) : null
                    const pct = gradeNum !== null ? Math.round((gradeNum / a.max_points) * 100) : null
                    const pctColor = pct === null ? '#94A3B8' : pct >= 80 ? '#059669' : pct >= 60 ? '#D97706' : '#DC2626'

                    return (
                      <td key={a.id} style={{ padding: '8px 16px', textAlign: 'center', verticalAlign: 'middle' }}>
                        {isTeacher ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <input
                                type="number"
                                min={0}
                                max={a.max_points}
                                value={val.grade}
                                onChange={e => setField(student.student_id, a.id, 'grade', e.target.value)}
                                placeholder="—"
                                style={{
                                  width: 60,
                                  height: 30,
                                  border: '1px solid var(--color-border)',
                                  borderRadius: 6,
                                  padding: '0 8px',
                                  fontSize: 13,
                                  fontFamily: "'Inter', sans-serif",
                                  color: 'var(--color-text-primary)',
                                  outline: 'none',
                                  textAlign: 'center',
                                }}
                                onFocus={e => { e.currentTarget.style.borderColor = '#4F46E5'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(79,70,229,0.1)' }}
                                onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none' }}
                              />
                              <button
                                onClick={() => saveGrade(student.student_id, a.id, a.max_points)}
                                disabled={isSaving}
                                title="Save grade"
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 6,
                                  backgroundColor: 'var(--color-primary-light)',
                                  border: 'none',
                                  cursor: isSaving ? 'not-allowed' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                {isSaving ? <Loader2 size={12} color="#4F46E5" className="animate-spin" /> : <Save size={12} color="#4F46E5" />}
                              </button>
                            </div>
                            {pct !== null && (
                              <span style={{ fontSize: 11, fontWeight: 600, color: pctColor }}>{pct}%</span>
                            )}
                            {existing?.status === 'submitted' && val.grade === '' && (
                              <span style={{ fontSize: 10, color: '#3B82F6', fontWeight: 500 }}>Submitted</span>
                            )}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            {existing?.grade !== null && existing?.grade !== undefined ? (
                              <>
                                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 700, color: pctColor }}>
                                  {existing.grade}/{a.max_points}
                                </span>
                                <span style={{ fontSize: 11, color: pctColor }}>{pct}%</span>
                              </>
                            ) : existing?.status === 'submitted' ? (
                              <CheckCircle2 size={16} color="#3B82F6" />
                            ) : (
                              <span style={{ fontSize: 13, color: '#CBD5E1' }}>—</span>
                            )}
                          </div>
                        )}
                      </td>
                    )
                  })}

                  {/* Total % */}
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    {totalPct !== null ? (
                      <span style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: 14,
                        fontWeight: 700,
                        color: totalPct >= 80 ? '#059669' : totalPct >= 60 ? '#D97706' : '#DC2626',
                      }}>
                        {totalPct}%
                      </span>
                    ) : (
                      <span style={{ fontSize: 13, color: '#CBD5E1' }}>—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
