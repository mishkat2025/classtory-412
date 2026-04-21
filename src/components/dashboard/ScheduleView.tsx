import { CalendarDays, GraduationCap, ClipboardList, BookOpen, Sparkles, AlertCircle } from 'lucide-react'
import type { ScheduleItem, ScheduleItemType } from '@/lib/types'

/* ─── Helpers ────────────────────────────────────────────────────── */
const TYPE_LABELS: Record<ScheduleItemType, string> = {
  exam:       'Exam',
  assignment: 'Assignment Deadline',
  class:      'Class / Session',
  custom:     'Custom Event',
}

const TYPE_COLORS: Record<ScheduleItemType, { bg: string; text: string; border: string }> = {
  exam:       { bg: 'var(--color-danger-light)', text: '#991B1B', border: '#FECACA' },
  assignment: { bg: 'var(--color-warning-light)', text: '#92400E', border: '#FDE68A' },
  class:      { bg: 'var(--color-success-light)', text: '#065F46', border: '#A7F3D0' },
  custom:     { bg: 'var(--color-primary-light)', text: '#3730A3', border: '#C7D2FE' },
}

const TYPE_ICONS: Record<ScheduleItemType, React.ReactNode> = {
  exam:       <GraduationCap size={13} />,
  assignment: <ClipboardList size={13} />,
  class:      <BookOpen size={13} />,
  custom:     <Sparkles size={13} />,
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function getDaysUntil(iso: string): number {
  const now = new Date()
  const then = new Date(iso)
  return Math.ceil((then.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

/* ─── Props ──────────────────────────────────────────────────────── */
interface ScheduleViewProps {
  items: ScheduleItem[]
}

/* ─── Component ──────────────────────────────────────────────────── */
export function ScheduleView({ items }: ScheduleViewProps) {
  const now = new Date()
  const upcoming = items.filter(i => new Date(i.event_date) >= now)
  const nextDeadline = upcoming.find(i => i.type === 'assignment')
  const nextExam = upcoming.find(i => i.type === 'exam')

  return (
    <section style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CalendarDays size={16} color="#4F46E5" />
        </div>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 17, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
          Upcoming Schedule
        </h2>
      </div>

      {/* ── Highlight cards ───────────────────────────────────── */}
      {(nextDeadline || nextExam) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
          {nextDeadline && (
            <HighlightCard
              label="Next Deadline"
              item={nextDeadline}
            />
          )}
          {nextExam && (
            <HighlightCard
              label="Next Exam"
              item={nextExam}
            />
          )}
        </div>
      )}

      {/* ── Full list ─────────────────────────────────────────── */}
      <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {upcoming.length === 0 ? (
          <div style={{ padding: '36px 24px', textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, backgroundColor: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <CalendarDays size={20} color="#4F46E5" />
            </div>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: 0, fontWeight: 500 }}>
              No upcoming events
            </p>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
              Your teachers haven&apos;t scheduled anything yet.
            </p>
          </div>
        ) : (
          upcoming.map((item, i) => {
            const colors = TYPE_COLORS[item.type]
            const daysUntil = getDaysUntil(item.event_date)
            const isUrgent = daysUntil <= 3
            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 18px',
                  borderBottom: i < upcoming.length - 1 ? '1px solid var(--color-border)' : 'none',
                }}
              >
                {/* Date column */}
                <div style={{ minWidth: 52, textAlign: 'center', flexShrink: 0 }}>
                  <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1 }}>
                    {new Date(item.event_date).getDate()}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {new Date(item.event_date).toLocaleString('en-US', { month: 'short' })}
                  </p>
                </div>

                {/* Divider */}
                <div style={{ width: 2, height: 40, backgroundColor: colors.border, borderRadius: 2, flexShrink: 0 }} />

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </p>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 500, color: colors.text, backgroundColor: colors.bg, borderRadius: 9999, padding: '2px 8px', flexShrink: 0 }}>
                      {TYPE_ICONS[item.type]}
                      {TYPE_LABELS[item.type]}
                    </span>
                    {isUrgent && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 500, color: 'var(--color-danger-on-tint)', backgroundColor: 'var(--color-danger-light)', borderRadius: 9999, padding: '2px 8px', flexShrink: 0 }}>
                        <AlertCircle size={11} />
                        {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil}d`}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 3 }}>
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
                      {formatDate(item.event_date)}
                    </p>
                    {(item.classroom as { name: string } | null)?.name && (
                      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0, fontWeight: 500 }}>
                        · {(item.classroom as { name: string }).name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}

/* ─── Highlight Card ─────────────────────────────────────────────── */
function HighlightCard({ label, item }: { label: string; item: ScheduleItem }) {
  const colors = TYPE_COLORS[item.type]
  const daysUntil = getDaysUntil(item.event_date)
  const daysLabel =
    daysUntil === 0 ? 'Today'
    : daysUntil === 1 ? 'Tomorrow'
    : `In ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`

  return (
    <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </p>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color: colors.text }}>{TYPE_ICONS[item.type]}</span>
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.title}
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
            {formatDate(item.event_date)}
          </p>
        </div>
      </div>
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
        <span style={{
          fontSize: 12,
          fontWeight: 600,
          color: daysUntil <= 3 ? '#991B1B' : '#3730A3',
          backgroundColor: daysUntil <= 3 ? '#FEE2E2' : 'var(--color-primary-light)',
          borderRadius: 9999,
          padding: '3px 10px',
        }}>
          {daysLabel}
        </span>
      </div>
    </div>
  )
}
