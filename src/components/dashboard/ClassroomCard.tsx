import Link from 'next/link'
import { User, ClipboardList, ChevronRight } from 'lucide-react'

interface ClassroomCardProps {
  id: string
  name: string
  subject: string
  cover_color: string
  teacher_name?: string
  pending_count: number
}

export function ClassroomCard({
  id,
  name,
  subject,
  cover_color,
  teacher_name,
  pending_count,
}: ClassroomCardProps) {
  const color = cover_color || '#4F46E5'

  return (
    <Link
      href={`/classroom/${id}`}
      style={{ textDecoration: 'none', display: 'block' }}
      className="card-hover"
    >
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: 'var(--shadow-card)',
          cursor: 'pointer',
          transition: 'background-color 200ms ease, border-color 200ms ease',
        }}
      >
        {/* Colour header strip */}
        <div
          style={{
            height: 6,
            background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
          }}
        />

        <div style={{ padding: '16px 20px 18px' }}>
          {/* Subject chip */}
          <span
            style={{
              display: 'inline-block',
              fontSize: 11,
              fontWeight: 600,
              color: color,
              backgroundColor: `${color}18`,
              borderRadius: 9999,
              padding: '2px 10px',
              marginBottom: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {subject}
          </span>

          {/* Class name */}
          <h3
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              margin: '0 0 12px 0',
              lineHeight: 1.3,
              letterSpacing: '-0.01em',
            }}
          >
            {name}
          </h3>

          {/* Footer row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {teacher_name ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={13} color="#94A3B8" />
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{teacher_name}</span>
              </div>
            ) : (
              <span />
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {pending_count > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <ClipboardList size={13} color="#D97706" />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#D97706',
                    }}
                  >
                    {pending_count} due
                  </span>
                </div>
              )}
              <ChevronRight size={15} color="#CBD5E1" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
