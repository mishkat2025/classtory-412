'use client'

import Link from 'next/link'

interface AssignmentCardProps {
  id: string
  classroom_id: string
  title: string
  classroomName: string
  classroomColor: string
  maxPoints: number
  dueLabel: string
  dueColor: string
  dueBg: string
  statusLabel: string
  statusColor: string
  statusBg: string
  statusBorder: string
  grade: number | null
  pct: number | null
  gradeColor: string | null
  gradeBg: string | null
}

export function AssignmentCard({
  id,
  classroom_id,
  title,
  classroomName,
  classroomColor,
  maxPoints,
  dueLabel,
  dueColor,
  dueBg,
  statusLabel,
  statusColor,
  statusBg,
  statusBorder,
  grade,
  pct,
  gradeColor,
  gradeBg,
}: AssignmentCardProps) {
  return (
    <Link
      href={`/classroom/${classroom_id}/assignment/${id}`}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderLeft: `4px solid ${statusBorder}`,
          borderRadius: 12,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          transition: 'box-shadow 120ms ease, transform 120ms ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement
          el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
          el.style.transform = 'translateY(-1px)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'
          el.style.transform = 'translateY(0)'
        }}
      >
        {/* Classroom color dot */}
        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: classroomColor, flexShrink: 0 }} />

        {/* Title + classroom */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', margin: '0 0 2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title}
          </p>
          <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
            {classroomName} &nbsp;·&nbsp; {maxPoints} pts
          </p>
        </div>

        {/* Grade badge (if graded) */}
        {pct != null && gradeColor && gradeBg && grade != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, backgroundColor: gradeBg, borderRadius: 8, padding: '4px 10px', flexShrink: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: gradeColor, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{pct}%</span>
            <span style={{ fontSize: 11, color: gradeColor, opacity: 0.8 }}>{grade}/{maxPoints}</span>
          </div>
        )}

        {/* Due date */}
        <span style={{ fontSize: 12, fontWeight: 500, color: dueColor, backgroundColor: dueBg, borderRadius: 9999, padding: '2px 10px', flexShrink: 0, whiteSpace: 'nowrap' }}>
          {dueLabel}
        </span>

        {/* Status pill */}
        <span style={{ fontSize: 11, fontWeight: 600, color: statusColor, backgroundColor: statusBg, borderRadius: 9999, padding: '2px 9px', flexShrink: 0 }}>
          {statusLabel}
        </span>
      </div>
    </Link>
  )
}
