'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, Clock, Save, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { AttendanceStatus } from '@/lib/types'

interface StudentRow {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
}

interface AttendanceRecord {
  student_id: string
  status: AttendanceStatus
}

interface AttendanceSheetProps {
  students: StudentRow[]
  classroom_id: string
  isTeacher: boolean
  date: string
  initialRecords: AttendanceRecord[]
}

const statusConfig: Record<AttendanceStatus, { label: string; bg: string; color: string; borderColor: string }> = {
  present: { label: 'Present', bg: '#D1FAE5', color: '#065F46', borderColor: '#10B981' },
  absent:  { label: 'Absent',  bg: '#FEE2E2', color: '#991B1B', borderColor: '#EF4444' },
  late:    { label: 'Late',    bg: '#FEF3C7', color: '#92400E', borderColor: '#F59E0B' },
}

const STATUS_ORDER: AttendanceStatus[] = ['present', 'absent', 'late']

export function AttendanceSheet({ students, classroom_id, isTeacher, date, initialRecords }: AttendanceSheetProps) {
  const [records, setRecords] = useState<Map<string, AttendanceStatus>>(
    new Map(initialRecords.map(r => [r.student_id, r.status]))
  )
  const [saving, setSaving] = useState(false)

  function toggle(studentId: string) {
    if (!isTeacher) return
    setRecords(prev => {
      const next = new Map(prev)
      const current = next.get(studentId)
      const idx = current ? STATUS_ORDER.indexOf(current) : -1
      const next_status = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length]
      next.set(studentId, next_status)
      return next
    })
  }

  async function save() {
    setSaving(true)
    const supabase = createClient()

    const upserts = Array.from(records.entries()).map(([student_id, status]) => ({
      classroom_id,
      student_id,
      date,
      status,
    }))

    const { error } = await supabase
      .from('attendance')
      .upsert(upserts, { onConflict: 'classroom_id,student_id,date' })

    setSaving(false)
    if (error) {
      toast.error('Failed to save attendance.')
    } else {
      toast.success('Attendance saved.')
    }
  }

  const presentCount = Array.from(records.values()).filter(s => s === 'present').length
  const absentCount = Array.from(records.values()).filter(s => s === 'absent').length
  const lateCount = Array.from(records.values()).filter(s => s === 'late').length
  const unmarkedCount = students.filter(s => !records.has(s.id)).length

  return (
    <div>
      {/* Summary row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Present', count: presentCount, bg: '#D1FAE5', color: '#065F46', Icon: CheckCircle2 },
          { label: 'Absent',  count: absentCount,  bg: '#FEE2E2', color: '#991B1B', Icon: XCircle },
          { label: 'Late',    count: lateCount,    bg: '#FEF3C7', color: '#92400E', Icon: Clock },
        ].map(({ label, count, bg, color, Icon }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: bg, borderRadius: 8, padding: '8px 14px' }}>
            <Icon size={15} color={color} />
            <span style={{ fontSize: 13, fontWeight: 600, color }}>{label}: {count}</span>
          </div>
        ))}
        {unmarkedCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#F1F5F9', borderRadius: 8, padding: '8px 14px' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Unmarked: {unmarkedCount}</span>
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', padding: '0 20px', height: 40, backgroundColor: '#F8FAFC', borderBottom: '1px solid #F1F5F9', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Student</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>Status</span>
        </div>

        {students.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: '#94A3B8', margin: 0 }}>No students enrolled yet.</p>
          </div>
        ) : (
          students.map((student, i) => {
            const status = records.get(student.id)
            const cfg = status ? statusConfig[status] : null
            const initials = student.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

            return (
              <div
                key={student.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 200px',
                  padding: '0 20px',
                  height: 56,
                  borderBottom: i < students.length - 1 ? '1px solid #F1F5F9' : 'none',
                  alignItems: 'center',
                  gap: 12,
                  transition: 'background-color 120ms ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F8FAFC' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
              >
                {/* Student info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                    {student.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={student.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#FFFFFF' }}>{initials}</span>
                    )}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#0F172A', margin: 0 }}>{student.full_name}</p>
                    <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>{student.email}</p>
                  </div>
                </div>

                {/* Status button */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    onClick={() => toggle(student.id)}
                    disabled={!isTeacher}
                    style={{
                      height: 30,
                      padding: '0 14px',
                      borderRadius: 9999,
                      border: `1px solid ${cfg ? cfg.borderColor : '#E2E8F0'}`,
                      backgroundColor: cfg ? cfg.bg : '#F1F5F9',
                      color: cfg ? cfg.color : '#94A3B8',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: isTeacher ? 'pointer' : 'default',
                      transition: 'all 120ms ease',
                    }}
                  >
                    {cfg ? cfg.label : 'Mark'}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Save button */}
      {isTeacher && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button
            onClick={save}
            disabled={saving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              height: 38,
              padding: '0 20px',
              backgroundColor: '#4F46E5',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving…' : 'Save Attendance'}
          </button>
        </div>
      )}
    </div>
  )
}
