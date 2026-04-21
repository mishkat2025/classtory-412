'use client'

import Link from 'next/link'
import { Clock, CheckCircle2, Star, AlertCircle } from 'lucide-react'

type AssignmentStatus = 'pending' | 'submitted' | 'graded' | 'overdue'

interface AssignmentItemProps {
  id: string
  classroom_id: string
  title: string
  classroom_name: string
  due_date: string
  max_points: number
  status: AssignmentStatus
  grade: number | null
  isLast: boolean
}

function formatDue(iso: string): { label: string; urgent: boolean } {
  const due = new Date(iso)
  const now = new Date()
  const diffMs = due.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { label: 'Overdue', urgent: true }
  if (diffDays === 0) return { label: 'Due today', urgent: true }
  if (diffDays === 1) return { label: 'Due tomorrow', urgent: true }
  if (diffDays <= 7) return { label: `Due in ${diffDays} days`, urgent: false }

  return {
    label: `Due ${due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    urgent: false,
  }
}

const statusConfig: Record<
  AssignmentStatus,
  { label: string; bg: string; text: string; icon: React.ReactNode }
> = {
  pending: {
    label: 'Pending',
    bg: '#FEF3C7',
    text: '#92400E',
    icon: <Clock size={11} />,
  },
  submitted: {
    label: 'Submitted',
    bg: '#DBEAFE',
    text: '#1E40AF',
    icon: <CheckCircle2 size={11} />,
  },
  graded: {
    label: 'Graded',
    bg: '#D1FAE5',
    text: '#065F46',
    icon: <Star size={11} />,
  },
  overdue: {
    label: 'Overdue',
    bg: '#FEE2E2',
    text: '#991B1B',
    icon: <AlertCircle size={11} />,
  },
}

export function AssignmentItem({
  id,
  classroom_id,
  title,
  classroom_name,
  due_date,
  max_points,
  status,
  grade,
  isLast,
}: AssignmentItemProps) {
  const due = formatDue(due_date)
  const effectiveStatus: AssignmentStatus =
    status === 'pending' && due.label === 'Overdue' ? 'overdue' : status
  const config = statusConfig[effectiveStatus]

  return (
    <Link
      href={`/classroom/${classroom_id}/assignment/${id}`}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '14px 20px',
          borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
          transition: 'background-color 120ms ease',
        }}
        onMouseEnter={e =>
          ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-surface-2)')
        }
        onMouseLeave={e =>
          ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')
        }
      >
        {/* Left accent bar */}
        <div
          style={{
            width: 3,
            height: 36,
            borderRadius: 9999,
            backgroundColor:
              effectiveStatus === 'overdue'
                ? '#EF4444'
                : effectiveStatus === 'graded'
                ? '#10B981'
                : effectiveStatus === 'submitted'
                ? '#3B82F6'
                : due.urgent
                ? '#F59E0B'
                : '#CBD5E1',
            flexShrink: 0,
          }}
        />

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              margin: '0 0 3px 0',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
            {classroom_name}
            {' · '}
            <span style={{ color: due.urgent && effectiveStatus === 'pending' ? '#D97706' : '#94A3B8' }}>
              {due.label}
            </span>
            {' · '}
            {max_points} pts
          </p>
        </div>

        {/* Right: status badge or grade */}
        {effectiveStatus === 'graded' && grade !== null ? (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 16,
                fontWeight: 700,
                color: grade >= 70 ? '#059669' : grade >= 50 ? '#D97706' : '#DC2626',
              }}
            >
              {grade}
            </span>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>/{max_points}</span>
          </div>
        ) : (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
              color: config.text,
              backgroundColor: config.bg,
              borderRadius: 9999,
              padding: '3px 10px',
              flexShrink: 0,
            }}
          >
            {config.icon}
            {config.label}
          </span>
        )}
      </div>
    </Link>
  )
}
