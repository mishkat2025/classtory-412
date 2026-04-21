'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import {
  Loader2, BookmarkPlus, BookmarkCheck, X, Plus, Calendar,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { AttendanceStatus } from '@/lib/types'

/* ─── Types ─────────────────────────────────────────────────────── */

interface StudentRow {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
}

interface AttendanceRecord {
  student_id: string
  date: string
  status: AttendanceStatus
}

interface AttendanceSheetProps {
  students: StudentRow[]
  classroom_id: string
  isTeacher: boolean
  initialRecords: AttendanceRecord[]
  initialDate: string
}

/* ─── Constants ─────────────────────────────────────────────────── */

const STATUS_CYCLE: AttendanceStatus[] = ['present', 'absent', 'late']

const S: Record<AttendanceStatus, { label: string; short: string; bg: string; color: string; border: string }> = {
  present: { label: 'Present', short: 'P', bg: '#D1FAE5', color: '#065F46', border: '#10B981' },
  absent:  { label: 'Absent',  short: 'A', bg: '#FEE2E2', color: '#991B1B', border: '#EF4444' },
  late:    { label: 'Late',    short: 'L', bg: '#FEF3C7', color: '#92400E', border: '#F59E0B' },
}

/* ─── Helpers ───────────────────────────────────────────────────── */

function fmtShort(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function fmtFull(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  })
}
function fmtWeekday(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })
}

/* ─── Main component ─────────────────────────────────────────────── */

export function AttendanceSheet({
  students,
  classroom_id,
  isTeacher,
  initialRecords,
  initialDate,
}: AttendanceSheetProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>(initialRecords)

  /* knownDates tracks all date columns, including empty ones (no records yet) */
  const [knownDates, setKnownDates] = useState<Set<string>>(
    () => new Set(initialRecords.map(r => r.date))
  )

  const [savingCell, setSavingCell] = useState<string | null>(null)
  const [removingDate, setRemovingDate] = useState<string | null>(null)

  /* Add date column UI */
  const [showAddDate, setShowAddDate] = useState(false)
  const [newDate, setNewDate] = useState(initialDate)

  /* Gradebook */
  const [showGradebookForm, setShowGradebookForm] = useState(false)
  const [colName, setColName] = useState('Attendance')
  const [addingToGradebook, setAddingToGradebook] = useState(false)
  const [gradebookAdded, setGradebookAdded] = useState(false)

  /* Derived state */
  const sortedDates = useMemo(
    () => [...new Set([...knownDates, ...records.map(r => r.date)])].sort(),
    [knownDates, records]
  )

  const matrix = useMemo(() => {
    const m = new Map<string, Map<string, AttendanceStatus>>()
    for (const rec of records) {
      if (!m.has(rec.student_id)) m.set(rec.student_id, new Map())
      m.get(rec.student_id)!.set(rec.date, rec.status)
    }
    return m
  }, [records])

  function getStudentSummary(studentId: string) {
    const dateMap = matrix.get(studentId) ?? new Map<string, AttendanceStatus>()
    let present = 0, absent = 0, late = 0
    for (const s of dateMap.values()) {
      if (s === 'present') present++
      else if (s === 'absent') absent++
      else if (s === 'late') late++
    }
    const pct = sortedDates.length > 0
      ? Math.round(((present + late) / sortedDates.length) * 100)
      : 0
    return { present, absent, late, pct }
  }

  function getDateSummary(date: string) {
    const recs = records.filter(r => r.date === date)
    return {
      p: recs.filter(r => r.status === 'present').length,
      a: recs.filter(r => r.status === 'absent').length,
      l: recs.filter(r => r.status === 'late').length,
    }
  }

  /* ── Cell click: cycles P → A → L → clear ── */
  async function handleCellClick(studentId: string, date: string) {
    const key = `${studentId}:${date}`
    if (savingCell === key) return
    setSavingCell(key)

    const current = matrix.get(studentId)?.get(date) ?? null
    const idx = current ? STATUS_CYCLE.indexOf(current) : -1
    const clear = current === 'late'
    const next = clear ? null : STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]

    /* Optimistic update */
    setRecords(prev => {
      const filtered = prev.filter(r => !(r.student_id === studentId && r.date === date))
      if (next) filtered.push({ student_id: studentId, date, status: next })
      return filtered
    })

    const supabase = createClient()
    let err: { message: string } | null = null

    if (clear) {
      const res = await supabase.from('attendance').delete()
        .eq('classroom_id', classroom_id).eq('student_id', studentId).eq('date', date)
      err = res.error
    } else if (next) {
      const res = await supabase.from('attendance').upsert(
        { classroom_id, student_id: studentId, date, status: next },
        { onConflict: 'classroom_id,student_id,date' }
      )
      err = res.error
    }

    setSavingCell(null)
    if (err) {
      toast.error('Failed to save.')
      /* Rollback */
      setRecords(prev => {
        const filtered = prev.filter(r => !(r.student_id === studentId && r.date === date))
        if (current) filtered.push({ student_id: studentId, date, status: current })
        return filtered
      })
    }
  }

  /* ── Add date column (empty column — mark cells inline) ── */
  function addDateColumn() {
    if (!newDate) { toast.error('Please select a date.'); return }
    if (sortedDates.includes(newDate)) {
      toast.info('That date is already in the sheet.')
      setShowAddDate(false)
      return
    }
    setKnownDates(prev => new Set([...prev, newDate]))
    setShowAddDate(false)
    toast.success(`Column "${fmtShort(newDate)}" added.`)
  }

  /* ── Remove date column + all its records ── */
  async function removeDate(date: string) {
    if (removingDate) return
    setRemovingDate(date)
    const supabase = createClient()
    const { error } = await supabase.from('attendance').delete()
      .eq('classroom_id', classroom_id).eq('date', date)
    if (error) {
      toast.error('Failed to remove: ' + error.message)
      setRemovingDate(null)
      return
    }
    setRecords(prev => prev.filter(r => r.date !== date))
    setKnownDates(prev => { const n = new Set(prev); n.delete(date); return n })
    setRemovingDate(null)
    toast.success(`Removed "${fmtShort(date)}" column.`)
  }

  /* ── Add attendance to gradebook ── */
  async function addAttendanceToGradebook() {
    if (!colName.trim()) { toast.error('Column name is required.'); return }
    if (sortedDates.length === 0) { toast.error('No sessions recorded yet.'); return }
    setAddingToGradebook(true)
    const supabase = createClient()

    const totalSessions = sortedDates.length
    const scoreMap = new Map<string, number>()
    for (const rec of records) {
      const delta = rec.status === 'present' ? 1 : rec.status === 'late' ? 0.5 : 0
      scoreMap.set(rec.student_id, (scoreMap.get(rec.student_id) ?? 0) + delta)
    }

    const { data: existingCols } = await supabase
      .from('grade_columns').select('id').eq('classroom_id', classroom_id)

    const { data: newCol, error: colErr } = await supabase.from('grade_columns').insert({
      classroom_id,
      title: colName.trim(),
      max_raw: totalSessions,
      max_converted: null,
      sort_order: (existingCols ?? []).length,
    }).select('id').single()

    if (colErr || !newCol) {
      setAddingToGradebook(false)
      toast.error('Failed: ' + (colErr?.message ?? 'unknown'))
      return
    }

    const gradeValues = Array.from(scoreMap.entries()).map(([student_id, raw_score]) => ({
      column_id: newCol.id, student_id, raw_score,
    }))
    if (gradeValues.length > 0) {
      const { error: valErr } = await supabase.from('grade_values').insert(gradeValues)
      if (valErr) toast.warning('Column created but some scores failed to import.')
    }

    setAddingToGradebook(false)
    setGradebookAdded(true)
    setShowGradebookForm(false)
    toast.success(
      `"${colName.trim()}" added to Grade Sheet. ${gradeValues.length} students · ${totalSessions} sessions.`
    )
  }

  const today = new Date().toISOString().split('T')[0]

  /* ═══════════════════════════════════════════════════════════════
     STUDENT VIEW
  ═══════════════════════════════════════════════════════════════ */
  if (!isTeacher) {
    const present = records.filter(r => r.status === 'present').length
    const absent  = records.filter(r => r.status === 'absent').length
    const late    = records.filter(r => r.status === 'late').length
    const total   = records.length
    const pct = total > 0 ? Math.round(((present + late) / total) * 100) : 0
    const pctColor = pct < 50 ? '#991B1B' : pct < 75 ? '#92400E' : '#065F46'
    const pctBg    = pct < 50 ? '#FEE2E2' : pct < 75 ? '#FEF3C7' : '#D1FAE5'
    const sortedOwn = [...records].sort((a, b) => b.date.localeCompare(a.date))

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
          {[
            { label: 'Attendance %',   value: `${pct}%`, bg: pctBg,    color: pctColor  },
            { label: 'Present',        value: present,    bg: '#D1FAE5', color: '#065F46' },
            { label: 'Late',           value: late,       bg: '#FEF3C7', color: '#92400E' },
            { label: 'Absent',         value: absent,     bg: '#FEE2E2', color: '#991B1B' },
            { label: 'Total Sessions', value: total,      bg: '#EEF2FF', color: '#3730A3' },
          ].map(({ label, value, bg, color }) => (
            <div key={label} style={{ backgroundColor: bg, borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</div>
              <div style={{ fontSize: 12, color, opacity: 0.8, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* History list */}
        <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '0 20px', height: 40, backgroundColor: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)', display: 'grid', gridTemplateColumns: '1fr 110px', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>Status</span>
          </div>
          {sortedOwn.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>No attendance records yet.</p>
            </div>
          ) : sortedOwn.map((r, i) => {
            const cfg = S[r.status]
            return (
              <div key={r.date} style={{ display: 'grid', gridTemplateColumns: '1fr 110px', padding: '0 20px', height: 48, borderBottom: i < sortedOwn.length - 1 ? '1px solid #F1F5F9' : 'none', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>{fmtFull(r.date)}</span>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: cfg.color, backgroundColor: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 9999, padding: '2px 10px' }}>
                    {cfg.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════════════════════
     TEACHER VIEW — Excel-like spreadsheet
  ═══════════════════════════════════════════════════════════════ */
  const totalSessions = sortedDates.length
  const STUDENT_COL_W = 220
  const CELL_W = 58
  const SUMMARY_W = 44
  const HDR_H = 66

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Summary cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {[
          { label: 'Sessions',        value: totalSessions,                                        bg: '#EEF2FF', color: '#3730A3' },
          { label: 'Students',        value: students.length,                                      bg: '#EEF2FF', color: '#3730A3' },
          { label: 'Present (total)', value: records.filter(r => r.status === 'present').length,  bg: '#D1FAE5', color: '#065F46' },
          { label: 'Late (total)',    value: records.filter(r => r.status === 'late').length,     bg: '#FEF3C7', color: '#92400E' },
          { label: 'Absent (total)',  value: records.filter(r => r.status === 'absent').length,   bg: '#FEE2E2', color: '#991B1B' },
        ].map(({ label, value, bg, color }) => (
          <div key={label} style={{ backgroundColor: bg, borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</div>
            <div style={{ fontSize: 12, color, opacity: 0.8, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Click a cell to cycle:</span>
          {(Object.entries(S) as [AttendanceStatus, typeof S[AttendanceStatus]][]).map(([status, cfg]) => (
            <span key={status} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, color: cfg.color, backgroundColor: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 9999, padding: '2px 8px', fontWeight: 600 }}>
              {cfg.short} = {cfg.label}
            </span>
          ))}
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>→ click again to clear</span>
        </div>

        {/* Add Date Column control */}
        {showAddDate ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 10, padding: '6px 10px' }}>
            <Calendar size={14} color="#4F46E5" />
            <input
              type="date"
              value={newDate}
              max={today}
              autoFocus
              onChange={e => setNewDate(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') addDateColumn()
                if (e.key === 'Escape') setShowAddDate(false)
              }}
              style={{ height: 30, border: '1px solid #C7D2FE', borderRadius: 6, padding: '0 8px', fontSize: 13, color: 'var(--color-text-primary)', outline: 'none', backgroundColor: 'var(--color-surface)', fontFamily: "'Inter', sans-serif" }}
            />
            <button
              onClick={addDateColumn}
              style={{ height: 30, padding: '0 12px', borderRadius: 6, border: 'none', backgroundColor: '#4F46E5', color: '#FFFFFF', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Add
            </button>
            <button
              onClick={() => setShowAddDate(false)}
              style={{ height: 30, width: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', cursor: 'pointer', flexShrink: 0 }}
            >
              <X size={13} color="#64748B" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddDate(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 8, border: '1px solid #4F46E5', backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            <Plus size={14} />
            Add Date Column
          </button>
        )}
      </div>

      {/* ── Spreadsheet table ── */}
      <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid #CBD5E1', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {students.length === 0 ? (
          <div style={{ padding: '56px 24px', textAlign: 'center' }}>
            <Calendar size={36} color="#CBD5E1" style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-secondary)', margin: '0 0 4px 0' }}>No students enrolled yet</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '65vh' }}>
            <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: 'max-content', minWidth: '100%' }}>

              {/* ── Column widths ── */}
              <colgroup>
                <col style={{ width: STUDENT_COL_W }} />
                {sortedDates.map(d => <col key={d} style={{ width: CELL_W }} />)}
                <col style={{ width: SUMMARY_W }} />
                <col style={{ width: SUMMARY_W }} />
                <col style={{ width: SUMMARY_W }} />
                <col style={{ width: SUMMARY_W + 8 }} />
              </colgroup>

              <thead>
                <tr style={{ height: HDR_H }}>

                  {/* Student header — sticky left + top */}
                  <th style={{
                    position: 'sticky', left: 0, top: 0, zIndex: 4,
                    backgroundColor: 'var(--color-surface-2)',
                    padding: '0 16px',
                    textAlign: 'left',
                    fontSize: 11, fontWeight: 700, color: '#475569',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    borderBottom: '2px solid #CBD5E1',
                    borderRight: '2px solid #94A3B8',
                    boxShadow: '2px 0 6px rgba(0,0,0,0.05)',
                    whiteSpace: 'nowrap',
                  }}>
                    Student ({students.length})
                  </th>

                  {/* Date column headers */}
                  {sortedDates.length === 0 ? (
                    <th
                      colSpan={4}
                      style={{
                        position: 'sticky', top: 0, zIndex: 3,
                        backgroundColor: 'var(--color-surface-2)', borderBottom: '2px solid #CBD5E1',
                        padding: '0 20px', textAlign: 'left',
                      }}
                    >
                      <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 400 }}>
                        No date columns yet — click &ldquo;Add Date Column&rdquo; above to begin
                      </span>
                    </th>
                  ) : sortedDates.map(date => {
                    const ds = getDateSummary(date)
                    const isToday = date === today
                    const isRemoving = removingDate === date
                    return (
                      <th key={date} style={{
                        position: 'sticky', top: 0, zIndex: 3,
                        backgroundColor: isToday ? '#EEF2FF' : '#F1F5F9',
                        padding: '6px 4px 4px',
                        textAlign: 'center',
                        borderBottom: '2px solid #CBD5E1',
                        borderLeft: '1px solid #E2E8F0',
                        verticalAlign: 'bottom',
                      }}>
                        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, paddingTop: 10 }}>
                          {/* Remove button */}
                          <button
                            onClick={() => removeDate(date)}
                            disabled={!!removingDate}
                            title={`Remove ${fmtShort(date)}`}
                            style={{
                              position: 'absolute', top: 0, right: 0,
                              width: 16, height: 16, borderRadius: '50%',
                              border: 'none',
                              backgroundColor: isRemoving ? '#F1F5F9' : '#FEE2E2',
                              color: '#991B1B', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              opacity: (removingDate && !isRemoving) ? 0.3 : 1,
                              padding: 0, lineHeight: 1,
                            }}
                          >
                            {isRemoving
                              ? <Loader2 size={9} className="animate-spin" color="#94A3B8" />
                              : <X size={9} />
                            }
                          </button>

                          <span style={{ fontSize: 12, fontWeight: 700, color: isToday ? '#4F46E5' : '#334155', lineHeight: 1 }}>
                            {fmtShort(date)}
                          </span>
                          <span style={{ fontSize: 10, color: 'var(--color-text-muted)', lineHeight: 1 }}>
                            {fmtWeekday(date)}
                          </span>
                          <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                            <span style={{ fontSize: 9, color: '#065F46', backgroundColor: '#D1FAE5', borderRadius: 3, padding: '0 3px', fontWeight: 700, lineHeight: '14px' }}>{ds.p}P</span>
                            <span style={{ fontSize: 9, color: '#991B1B', backgroundColor: '#FEE2E2', borderRadius: 3, padding: '0 3px', fontWeight: 700, lineHeight: '14px' }}>{ds.a}A</span>
                            <span style={{ fontSize: 9, color: '#92400E', backgroundColor: '#FEF3C7', borderRadius: 3, padding: '0 3px', fontWeight: 700, lineHeight: '14px' }}>{ds.l}L</span>
                          </div>
                        </div>
                      </th>
                    )
                  })}

                  {/* Summary column headers: P, A, L, % */}
                  {[
                    { key: 'P', color: '#065F46', bg: '#ECFDF5', title: 'Present total',  leftBorder: '2px solid #94A3B8' },
                    { key: 'A', color: '#991B1B', bg: '#FFF5F5', title: 'Absent total',   leftBorder: '1px solid #E2E8F0' },
                    { key: 'L', color: '#92400E', bg: '#FFFBEB', title: 'Late total',     leftBorder: '1px solid #E2E8F0' },
                    { key: '%', color: '#3730A3', bg: '#EEF2FF', title: 'Attendance %',   leftBorder: '1px solid #E2E8F0' },
                  ].map(({ key, color, bg, title, leftBorder }) => (
                    <th key={key} title={title} style={{
                      position: 'sticky', top: 0, zIndex: 3,
                      backgroundColor: bg,
                      padding: '10px 4px',
                      textAlign: 'center',
                      fontSize: 11, fontWeight: 800, color,
                      borderBottom: '2px solid #CBD5E1',
                      borderLeft: leftBorder,
                    }}>
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {students.map((student, si) => {
                  const sum = getStudentSummary(student.id)
                  const pctColor = sum.pct < 50 ? '#991B1B' : sum.pct < 75 ? '#92400E' : '#065F46'
                  const pctBg   = sum.pct < 50 ? '#FEE2E2' : sum.pct < 75 ? '#FEF3C7' : '#D1FAE5'
                  const rowBg = si % 2 === 0 ? '#FFFFFF' : '#F9FAFB'

                  return (
                    <tr key={student.id}>

                      {/* Sticky student name cell */}
                      <td style={{
                        position: 'sticky', left: 0, zIndex: 1,
                        backgroundColor: rowBg,
                        padding: '0 16px', height: 38,
                        borderBottom: '1px solid var(--color-border)',
                        borderRight: '2px solid #94A3B8',
                        boxShadow: '2px 0 6px rgba(0,0,0,0.04)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                            {student.avatar_url
                              // eslint-disable-next-line @next/next/no-img-element
                              ? <img src={student.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <span style={{ fontSize: 9, fontWeight: 700, color: '#FFFFFF' }}>
                                  {student.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                </span>
                            }
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 172 }}>
                              {student.full_name}
                            </p>
                            <p style={{ fontSize: 10, color: 'var(--color-text-muted)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 172 }}>
                              {student.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Attendance cells */}
                      {sortedDates.map(date => {
                        const cellKey = `${student.id}:${date}`
                        const status = matrix.get(student.id)?.get(date) ?? null
                        const isLoading = savingCell === cellKey
                        const cellBg = status ? `${S[status].bg}66` : rowBg

                        return (
                          <td
                            key={date}
                            onClick={() => !isLoading && handleCellClick(student.id, date)}
                            onKeyDown={e => {
                              if ((e.key === 'Enter' || e.key === ' ') && !isLoading) {
                                e.preventDefault()
                                handleCellClick(student.id, date)
                              }
                            }}
                            tabIndex={0}
                            title={status ? S[status].label : 'Click to mark'}
                            role="button"
                            aria-label={`${student.full_name} on ${fmtShort(date)}: ${status ?? 'unmarked'}`}
                            style={{
                              height: 38, padding: 4,
                              textAlign: 'center',
                              borderBottom: '1px solid var(--color-border)',
                              borderLeft: '1px solid #EAECF0',
                              cursor: isLoading ? 'wait' : 'pointer',
                              backgroundColor: cellBg,
                              transition: 'background-color 60ms',
                              userSelect: 'none',
                              outline: 'none',
                            }}
                            onMouseEnter={e => {
                              if (!isLoading) (e.currentTarget as HTMLElement).style.backgroundColor = status ? S[status].bg : '#F1F5F9'
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLElement).style.backgroundColor = cellBg
                            }}
                            onFocus={e => {
                              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 2px #4F46E5 inset'
                            }}
                            onBlur={e => {
                              (e.currentTarget as HTMLElement).style.boxShadow = 'none'
                            }}
                          >
                            {isLoading ? (
                              <Loader2 size={14} color="#94A3B8" className="animate-spin" style={{ display: 'block', margin: '0 auto' }} />
                            ) : status ? (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: 26, height: 26, borderRadius: '50%',
                                backgroundColor: S[status].bg, color: S[status].color,
                                fontSize: 12, fontWeight: 700, border: `1.5px solid ${S[status].border}`,
                              }}>
                                {S[status].short}
                              </span>
                            ) : (
                              <span style={{ fontSize: 18, color: '#D1D5DB', lineHeight: 1 }}>·</span>
                            )}
                          </td>
                        )
                      })}

                      {/* Summary: P */}
                      <td style={{ height: 38, padding: '0 4px', textAlign: 'center', borderBottom: '1px solid var(--color-border)', borderLeft: '2px solid #94A3B8', backgroundColor: '#F0FDF4' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#065F46' }}>{sum.present}</span>
                      </td>
                      {/* Summary: A */}
                      <td style={{ height: 38, padding: '0 4px', textAlign: 'center', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid #E2E8F0', backgroundColor: '#FFF5F5' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#991B1B' }}>{sum.absent}</span>
                      </td>
                      {/* Summary: L */}
                      <td style={{ height: 38, padding: '0 4px', textAlign: 'center', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid #E2E8F0', backgroundColor: '#FFFBEB' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>{sum.late}</span>
                      </td>
                      {/* Summary: % */}
                      <td style={{ height: 38, padding: '0 4px', textAlign: 'center', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid #E2E8F0', backgroundColor: '#F8F8FF' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: pctColor, backgroundColor: pctBg, borderRadius: 9999, padding: '2px 6px', whiteSpace: 'nowrap' }}>
                          {sum.pct}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>

            </table>
          </div>
        )}
      </div>

      {/* ── Add Attendance to Gradebook ── */}
      <div>
        {showGradebookForm && (
          <div style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '14px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Column Name</label>
              <input
                value={colName}
                onChange={e => setColName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addAttendanceToGradebook() }}
                placeholder="e.g. Attendance"
                style={{ height: 34, padding: '0 10px', border: '1px solid var(--color-border)', borderRadius: 7, fontSize: 13, color: 'var(--color-text-primary)', outline: 'none', width: 170, backgroundColor: 'var(--color-surface)', fontFamily: "'Inter', sans-serif" }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Scoring</span>
              <span style={{ fontSize: 12, color: '#475569', backgroundColor: '#EEF2FF', borderRadius: 6, padding: '4px 10px', whiteSpace: 'nowrap' }}>
                P = 1 &nbsp;·&nbsp; L = 0.5 &nbsp;·&nbsp; A = 0 &nbsp;/&nbsp; max = {totalSessions} sessions
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button
                onClick={() => setShowGradebookForm(false)}
                style={{ height: 34, padding: '0 14px', borderRadius: 7, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', fontSize: 13, fontWeight: 500, color: '#475569', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <X size={13} /> Cancel
              </button>
              <button
                onClick={addAttendanceToGradebook}
                disabled={addingToGradebook}
                style={{ height: 34, padding: '0 16px', borderRadius: 7, border: 'none', backgroundColor: '#4F46E5', fontSize: 13, fontWeight: 600, color: '#FFFFFF', cursor: addingToGradebook ? 'not-allowed' : 'pointer', opacity: addingToGradebook ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {addingToGradebook ? <Loader2 size={13} className="animate-spin" /> : <BookmarkPlus size={13} />}
                {addingToGradebook ? 'Adding…' : 'Confirm & Add'}
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {gradebookAdded ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px', borderRadius: 8, backgroundColor: '#D1FAE5', color: '#065F46', fontSize: 13, fontWeight: 600 }}>
              <BookmarkCheck size={14} />
              Added to Grade Sheet
            </div>
          ) : (
            <button
              onClick={() => setShowGradebookForm(v => !v)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px', borderRadius: 8, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', fontSize: 13, fontWeight: 600, color: '#4F46E5', cursor: 'pointer', transition: 'all 120ms ease' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#EEF2FF'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#FFFFFF'}
            >
              <BookmarkPlus size={14} />
              Add Attendance to Gradebook
            </button>
          )}
        </div>
      </div>

    </div>
  )
}
