import { Users } from 'lucide-react'
import type { StudentEnrollment } from './types'

interface StudentListProps {
  enrollments: StudentEnrollment[]
  isTeacher: boolean
  teacherId: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const AVATAR_COLORS = [
  '#4F46E5', '#0891B2', '#059669', '#D97706',
  '#DC2626', '#7C3AED', '#DB2777', '#EA580C',
]

function avatarColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function StudentList({ enrollments, isTeacher, teacherId }: StudentListProps) {
  const students = enrollments
    .map(e => e.student)
    .filter((s): s is NonNullable<typeof s> => Boolean(s))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Count banner */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: 'var(--color-primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Users size={18} color="#4F46E5" />
        </div>
        <div>
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              marginRight: 6,
            }}
          >
            {students.length}
          </span>
          <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
            {students.length === 1 ? 'student enrolled' : 'students enrolled'}
          </span>
        </div>
      </div>

      {students.length === 0 ? (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 14,
            padding: '48px 24px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: 'var(--color-primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
            }}
          >
            <Users size={24} color="#4F46E5" />
          </div>
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              margin: '0 0 6px 0',
            }}
          >
            No students yet
          </p>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>
            Share the class code so students can join.
          </p>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          {students.map((student, i) => {
            const color = avatarColor(student.id)
            const initials = getInitials(student.full_name)
            const isCurrentTeacher = student.id === teacherId

            return (
              <div
                key={student.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 20px',
                  borderBottom:
                    i < students.length - 1 ? '1px solid var(--color-border)' : 'none',
                  transition: 'background-color 120ms ease',
                }}
                onMouseEnter={e =>
                  ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-surface-2)')
                }
                onMouseLeave={e =>
                  ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')
                }
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    backgroundColor: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  {student.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={student.avatar_url}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                      {initials}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: 'var(--color-text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {student.full_name}
                    </span>
                    {isCurrentTeacher && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#3730A3',
                          backgroundColor: 'var(--color-primary-light)',
                          borderRadius: 9999,
                          padding: '1px 8px',
                        }}
                      >
                        You
                      </span>
                    )}
                  </div>
                  {isTeacher && (
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0, marginTop: 1 }}>
                      {student.email}
                    </p>
                  )}
                </div>

                {/* Enrolled index */}
                <span style={{ fontSize: 12, color: '#CBD5E1', flexShrink: 0 }}>
                  #{i + 1}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
