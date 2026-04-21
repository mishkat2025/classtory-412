'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface AttendanceDateNavProps {
  classroomId: string
  selectedDate: string
}

export function AttendanceDateNav({ classroomId, selectedDate }: AttendanceDateNavProps) {
  const router = useRouter()

  function changeDate(delta: number) {
    const d = new Date(selectedDate + 'T00:00:00')
    d.setDate(d.getDate() + delta)
    const newDate = d.toISOString().split('T')[0]
    router.push(`/classroom/${classroomId}/attendance?date=${newDate}`)
  }

  function onDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    router.push(`/classroom/${classroomId}/attendance?date=${e.target.value}`)
  }

  const today = new Date().toISOString().split('T')[0]
  const isToday = selectedDate === today

  const displayDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <button
        onClick={() => changeDate(-1)}
        style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}
      >
        <ChevronLeft size={16} />
      </button>

      <input
        type="date"
        value={selectedDate}
        max={today}
        onChange={onDateChange}
        style={{
          height: 36,
          border: '1px solid var(--color-border)',
          borderRadius: 8,
          padding: '0 10px',
          fontSize: 14,
          fontFamily: "'Inter', sans-serif",
          color: 'var(--color-text-primary)',
          cursor: 'pointer',
          outline: 'none',
        }}
      />

      <span style={{ fontSize: 14, color: 'var(--color-text-secondary)', fontWeight: 500 }}>{displayDate}</span>

      <button
        onClick={() => changeDate(1)}
        disabled={isToday}
        style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: isToday ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isToday ? '#CBD5E1' : '#475569', opacity: isToday ? 0.5 : 1 }}
      >
        <ChevronRight size={16} />
      </button>

      {!isToday && (
        <button
          onClick={() => router.push(`/classroom/${classroomId}/attendance`)}
          style={{ height: 32, padding: '0 12px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary-on-tint)', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
        >
          Today
        </button>
      )}
    </div>
  )
}
