'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Check, X, Download, Loader2, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

/* ─── Types ─────────────────────────────────────────────────── */
export interface GradeColumn {
  id: string
  classroom_id: string
  title: string
  max_raw: number
  max_converted: number | null
  sort_order: number
}

export interface GradeValueRow {
  column_id: string
  student_id: string
  raw_score: number | null
}

interface Student {
  id: string
  full_name: string
  email: string
}

interface CustomGradebookProps {
  classroomId: string
  classroomName: string
  students: Student[]
  initialColumns: GradeColumn[]
  initialValues: GradeValueRow[]
  isTeacher: boolean
}

/* ─── Helpers ────────────────────────────────────────────────── */
function converted(raw: number | null, maxRaw: number, maxConverted: number | null): number | null {
  if (raw === null || maxRaw <= 0) return null
  if (!maxConverted) return raw
  return Math.round(((raw / maxRaw) * maxConverted) * 100) / 100
}

function csvCell(v: string | number | null | undefined): string {
  const s = String(v ?? '')
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
  return s
}

/* ─── Add / Edit Column Form ─────────────────────────────────── */
interface ColFormState { title: string; maxRaw: string; maxConverted: string }

function ColForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: ColFormState
  onSave: (v: ColFormState) => void
  onCancel: () => void
  saving: boolean
}) {
  const [v, setV] = useState(initial)
  const set = (k: keyof ColFormState) => (e: React.ChangeEvent<HTMLInputElement>) => setV(p => ({ ...p, [k]: e.target.value }))

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!v.title.trim()) { toast.error('Title is required'); return }
    const raw = Number(v.maxRaw)
    if (isNaN(raw) || raw <= 0) { toast.error('Max raw must be > 0'); return }
    if (v.maxConverted !== '' && (isNaN(Number(v.maxConverted)) || Number(v.maxConverted) <= 0)) {
      toast.error('Max converted must be > 0 if set'); return
    }
    onSave(v)
  }

  return (
    <form onSubmit={submit} style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px', gap: 8 }}>
        <div>
          <label style={lbl}>Column title</label>
          <input value={v.title} onChange={set('title')} placeholder="e.g. Midterm 1" style={inp} />
        </div>
        <div>
          <label style={lbl}>Raw max</label>
          <input value={v.maxRaw} onChange={set('maxRaw')} type="number" min={1} step="any" placeholder="100" style={inp} />
        </div>
        <div>
          <label style={lbl}>Convert to <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(opt)</span></label>
          <input value={v.maxConverted} onChange={set('maxConverted')} type="number" min={0} step="any" placeholder="—" style={inp} />
        </div>
      </div>
      {v.maxConverted && v.maxRaw && (
        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: 0 }}>
          Preview: score of <b>{Number(v.maxRaw)}</b> / {v.maxRaw} → <b>{v.maxConverted}</b> pts (full marks)
        </p>
      )}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={{ ...btn, backgroundColor: 'var(--color-surface)', color: '#475569', border: '1px solid var(--color-border)' }}>Cancel</button>
        <button type="submit" disabled={saving} style={{ ...btn, backgroundColor: '#4F46E5', color: '#FFFFFF', border: 'none', opacity: saving ? 0.7 : 1, gap: 5 }}>
          {saving && <Loader2 size={12} className="animate-spin" />} Save
        </button>
      </div>
    </form>
  )
}

/* ─── Main Component ─────────────────────────────────────────── */
export function CustomGradebook({
  classroomId,
  classroomName,
  students,
  initialColumns,
  initialValues,
  isTeacher,
}: CustomGradebookProps) {
  const [columns, setColumns] = useState<GradeColumn[]>([...initialColumns].sort((a, b) => a.sort_order - b.sort_order))
  const [valueMap, setValueMap] = useState<Map<string, number | null>>(() => {
    const m = new Map<string, number | null>()
    for (const v of initialValues) m.set(`${v.column_id}:${v.student_id}`, v.raw_score)
    return m
  })
  // Local edit state (before save)
  const [editMap, setEditMap] = useState<Map<string, string>>(() => {
    const m = new Map<string, string>()
    for (const v of initialValues) m.set(`${v.column_id}:${v.student_id}`, v.raw_score !== null ? String(v.raw_score) : '')
    return m
  })

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingColId, setEditingColId] = useState<string | null>(null)
  const [colSaving, setColSaving] = useState(false)
  const [cellSaving, setCellSaving] = useState<string | null>(null)

  const supabase = createClient()

  /* ── Column CRUD ── */
  async function addColumn(v: ColFormState) {
    setColSaving(true)
    const newSortOrder = columns.length
    const { data, error } = await supabase
      .from('grade_columns')
      .insert({
        classroom_id: classroomId,
        title: v.title.trim(),
        max_raw: Number(v.maxRaw),
        max_converted: v.maxConverted ? Number(v.maxConverted) : null,
        sort_order: newSortOrder,
      })
      .select()
      .single()

    setColSaving(false)
    if (error || !data) { toast.error('Failed to add column: ' + error?.message); return }
    setColumns(prev => [...prev, data as GradeColumn])
    setShowAddForm(false)
    toast.success(`Column "${v.title.trim()}" added.`)
  }

  async function updateColumn(colId: string, v: ColFormState) {
    setColSaving(true)
    const { data, error } = await supabase
      .from('grade_columns')
      .update({ title: v.title.trim(), max_raw: Number(v.maxRaw), max_converted: v.maxConverted ? Number(v.maxConverted) : null })
      .eq('id', colId)
      .select()
      .single()

    setColSaving(false)
    if (error || !data) { toast.error('Failed to update column.'); return }
    setColumns(prev => prev.map(c => c.id === colId ? { ...c, ...(data as GradeColumn) } : c))
    setEditingColId(null)
    toast.success('Column updated.')
  }

  async function deleteColumn(col: GradeColumn) {
    if (!confirm(`Delete column "${col.title}"? All scores in this column will be lost.`)) return
    const { error } = await supabase.from('grade_columns').delete().eq('id', col.id)
    if (error) { toast.error('Failed to delete column.'); return }
    setColumns(prev => prev.filter(c => c.id !== col.id))
    // Remove from value map
    setValueMap(prev => { const n = new Map(prev); for (const s of students) n.delete(`${col.id}:${s.id}`); return n })
    setEditMap(prev => { const n = new Map(prev); for (const s of students) n.delete(`${col.id}:${s.id}`); return n })
    toast.success(`Column "${col.title}" deleted.`)
  }

  /* ── Cell editing ── */
  function setCellEdit(colId: string, studentId: string, val: string) {
    setEditMap(prev => { const n = new Map(prev); n.set(`${colId}:${studentId}`, val); return n })
  }

  async function saveCell(col: GradeColumn, studentId: string) {
    const key = `${col.id}:${studentId}`
    const rawStr = editMap.get(key) ?? ''
    const raw = rawStr === '' ? null : Number(rawStr)
    if (raw !== null && (isNaN(raw) || raw < 0 || raw > col.max_raw)) {
      toast.error(`Score must be between 0 and ${col.max_raw}`)
      return
    }

    setCellSaving(key)
    const existing = valueMap.has(key)

    if (existing || raw !== null) {
      const { error } = await supabase.from('grade_values').upsert(
        { column_id: col.id, student_id: studentId, raw_score: raw },
        { onConflict: 'column_id,student_id' }
      )
      if (error) { toast.error('Failed to save score.'); setCellSaving(null); return }
    }

    setValueMap(prev => { const n = new Map(prev); n.set(key, raw); return n })
    setCellSaving(null)
  }

  /* ── CSV export ── */
  function exportCsv() {
    const headers = ['Student', 'Email', ...columns.map(c => `${c.title} (/${c.max_converted ?? c.max_raw})`), 'Total']
    const lines: string[] = [headers.join(',')]

    for (const s of students) {
      const vals = columns.map(c => {
        const raw = valueMap.get(`${c.id}:${s.id}`) ?? null
        const conv = converted(raw, c.max_raw, c.max_converted)
        return csvCell(conv)
      })
      const totalConverted = columns.reduce((sum, c) => {
        const raw = valueMap.get(`${c.id}:${s.id}`) ?? null
        return sum + (converted(raw, c.max_raw, c.max_converted) ?? 0)
      }, 0)
      const maxTotal = columns.reduce((sum, c) => sum + (c.max_converted ?? c.max_raw), 0)
      lines.push([csvCell(s.full_name), csvCell(s.email), ...vals, csvCell(`${totalConverted}/${maxTotal}`)].join(','))
    }

    const csv = lines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${classroomName.replace(/\s+/g, '_')}_grade_sheet.csv`; a.click()
    URL.revokeObjectURL(url)
    toast.success('Grade sheet exported.')
  }

  /* ── Render ── */
  const maxTotal = columns.reduce((sum, c) => sum + (c.max_converted ?? c.max_raw), 0)

  if (students.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 24px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14 }}>
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>No students enrolled yet.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
            {columns.length} column{columns.length !== 1 ? 's' : ''} · {students.length} student{students.length !== 1 ? 's' : ''}
            {maxTotal > 0 && ` · Total: ${maxTotal} pts`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={exportCsv} style={{ ...btn, backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', gap: 5 }}>
            <Download size={14} /> Export CSV
          </button>
          {isTeacher && !showAddForm && (
            <button onClick={() => setShowAddForm(true)} style={{ ...btn, backgroundColor: '#4F46E5', color: '#FFFFFF', border: 'none', gap: 5 }}>
              <Plus size={14} /> Add Column
            </button>
          )}
        </div>
      </div>

      {/* Add column form */}
      {isTeacher && showAddForm && (
        <ColForm
          initial={{ title: '', maxRaw: '100', maxConverted: '' }}
          onSave={addColumn}
          onCancel={() => setShowAddForm(false)}
          saving={colSaving}
        />
      )}

      {/* Edit column form */}
      {isTeacher && editingColId && (() => {
        const col = columns.find(c => c.id === editingColId)!
        return (
          <ColForm
            initial={{ title: col.title, maxRaw: String(col.max_raw), maxConverted: col.max_converted !== null ? String(col.max_converted) : '' }}
            onSave={v => updateColumn(editingColId, v)}
            onCancel={() => setEditingColId(null)}
            saving={colSaving}
          />
        )
      })()}

      {/* Table */}
      {columns.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px 24px', backgroundColor: 'var(--color-surface)', border: '2px dashed var(--color-border)', borderRadius: 14 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 6px 0' }}>No columns yet</p>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
            {isTeacher ? 'Click "Add Column" to create your first evaluation (e.g. Midterm, Quiz, Final).' : 'No evaluations set up yet.'}
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface-2)', borderBottom: '2px solid #E2E8F0' }}>
                {/* Student col */}
                <th style={{ ...th, position: 'sticky', left: 0, backgroundColor: 'var(--color-surface-2)', zIndex: 2, textAlign: 'left', minWidth: 180 }}>
                  Student
                </th>
                {columns.map(col => (
                  <th key={col.id} style={{ ...th, minWidth: isTeacher ? 160 : 110, textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }} title={col.title}>{col.title}</span>
                        {isTeacher && (
                          <>
                            <button onClick={() => { setEditingColId(col.id); setShowAddForm(false) }} title="Edit column" style={iconBtn}><Pencil size={11} /></button>
                            <button onClick={() => deleteColumn(col)} title="Delete column" style={{ ...iconBtn, color: '#EF4444' }}><Trash2 size={11} /></button>
                          </>
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 400, textTransform: 'none' }}>
                        {col.max_converted
                          ? `raw/${col.max_raw} → ${col.max_converted}pts`
                          : `/${col.max_raw} pts`}
                      </div>
                    </div>
                  </th>
                ))}
                {/* Total */}
                <th style={{ ...th, textAlign: 'center', minWidth: 90 }}>
                  Total
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 400, textTransform: 'none' }}>/{maxTotal}</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, si) => {
                const totalConverted = columns.reduce((sum, c) => {
                  const raw = valueMap.get(`${c.id}:${student.id}`) ?? null
                  return sum + (converted(raw, c.max_raw, c.max_converted) ?? 0)
                }, 0)
                const hasAnyScore = columns.some(c => valueMap.get(`${c.id}:${student.id}`) !== null && valueMap.get(`${c.id}:${student.id}`) !== undefined)
                const totalPct = hasAnyScore && maxTotal > 0 ? Math.round((totalConverted / maxTotal) * 100) : null
                const pctColor = (p: number) => p >= 80 ? '#059669' : p >= 60 ? '#D97706' : '#DC2626'

                return (
                  <tr key={student.id} style={{ borderBottom: si < students.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-surface-2)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}>
                    {/* Student */}
                    <td style={{ padding: '12px 16px', position: 'sticky', left: 0, backgroundColor: 'inherit', zIndex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)', margin: '0 0 2px 0', whiteSpace: 'nowrap' }}>{student.full_name}</p>
                      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>{student.email}</p>
                    </td>

                    {/* Score cells */}
                    {columns.map(col => {
                      const key = `${col.id}:${student.id}`
                      const raw = valueMap.get(key) ?? null
                      const editVal = editMap.get(key) ?? ''
                      const conv = converted(raw, col.max_raw, col.max_converted)
                      const isSaving = cellSaving === key

                      return (
                        <td key={col.id} style={{ padding: '8px 12px', textAlign: 'center', verticalAlign: 'middle' }}>
                          {isTeacher ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <input
                                  type="number"
                                  min={0}
                                  max={col.max_raw}
                                  value={editVal}
                                  onChange={e => setCellEdit(col.id, student.id, e.target.value)}
                                  onBlur={() => saveCell(col, student.id)}
                                  placeholder="—"
                                  style={{ width: 56, height: 30, border: '1px solid var(--color-border)', borderRadius: 6, padding: '0 6px', fontSize: 13, textAlign: 'center', fontFamily: "'Inter', sans-serif", outline: 'none', color: 'var(--color-text-primary)' }}
                                  onFocus={e => { e.currentTarget.style.borderColor = '#4F46E5'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(79,70,229,0.1)' }}
                                  onBlurCapture={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none' }}
                                />
                                <button onClick={() => saveCell(col, student.id)} disabled={!!isSaving} title="Save" style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: 'var(--color-primary-light)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  {isSaving ? <Loader2 size={11} color="#4F46E5" className="animate-spin" /> : <Save size={11} color="#4F46E5" />}
                                </button>
                              </div>
                              {conv !== null && col.max_converted && (
                                <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{conv} / {col.max_converted}</span>
                              )}
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                              {raw !== null ? (
                                <>
                                  <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--color-text-primary)' }}>
                                    {raw} / {col.max_raw}
                                  </span>
                                  {conv !== null && col.max_converted && (
                                    <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>= {conv} pts</span>
                                  )}
                                </>
                              ) : (
                                <span style={{ fontSize: 13, color: '#CBD5E1' }}>—</span>
                              )}
                            </div>
                          )}
                        </td>
                      )
                    })}

                    {/* Total */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {hasAnyScore ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 700, color: totalPct !== null ? pctColor(totalPct) : '#0F172A' }}>
                            {totalConverted.toFixed(1)}
                          </span>
                          {totalPct !== null && (
                            <span style={{ fontSize: 11, fontWeight: 600, color: pctColor(totalPct) }}>{totalPct}%</span>
                          )}
                        </div>
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
      )}
    </div>
  )
}

/* ─── Shared style tokens ─────────────────────────────────────── */
const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }
const inp: React.CSSProperties = { width: '100%', height: 34, border: '1px solid var(--color-border)', borderRadius: 7, padding: '0 10px', fontSize: 13, fontFamily: "'Inter', sans-serif", backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', outline: 'none', boxSizing: 'border-box' }
const btn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', height: 34, padding: '0 13px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 120ms ease' }
const th: React.CSSProperties = { padding: '10px 16px', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }
const iconBtn: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 2, display: 'inline-flex', alignItems: 'center', borderRadius: 4 }
