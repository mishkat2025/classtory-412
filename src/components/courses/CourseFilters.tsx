'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { useCallback, useTransition } from 'react'

interface CourseFiltersProps {
  categories: string[]
}

export function CourseFilters({ categories }: CourseFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const q = searchParams.get('q') ?? ''
  const cat = searchParams.get('category') ?? ''

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [k, v] of Object.entries(updates)) {
        if (v) params.set(k, v)
        else params.delete(k)
      }
      params.delete('page')
      startTransition(() => router.push(`/courses?${params.toString()}`))
    },
    [router, searchParams]
  )

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
      {/* Search */}
      <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 200 }}>
        <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input
          type="search"
          placeholder="Search courses…"
          defaultValue={q}
          onChange={e => updateParams({ q: e.target.value })}
          style={{
            width: '100%',
            height: 38,
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            paddingLeft: 34,
            paddingRight: q ? 32 : 12,
            fontSize: 14,
            fontFamily: "'Inter', sans-serif",
            color: 'var(--color-text-primary)',
            backgroundColor: 'var(--color-surface)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = '#4F46E5'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)' }}
          onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none' }}
        />
        {q && (
          <button
            onClick={() => updateParams({ q: '' })}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: 2 }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Category chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={() => updateParams({ category: '' })}
          style={{
            height: 34,
            padding: '0 14px',
            borderRadius: 9999,
            border: `1px solid ${!cat ? '#4F46E5' : '#E2E8F0'}`,
            backgroundColor: !cat ? '#EEF2FF' : '#FFFFFF',
            color: !cat ? '#3730A3' : '#475569',
            fontSize: 13,
            fontWeight: !cat ? 600 : 400,
            cursor: 'pointer',
            transition: 'all 120ms ease',
          }}
        >
          All
        </button>
        {categories.map(c => (
          <button
            key={c}
            onClick={() => updateParams({ category: c === cat ? '' : c })}
            style={{
              height: 34,
              padding: '0 14px',
              borderRadius: 9999,
              border: `1px solid ${cat === c ? '#4F46E5' : '#E2E8F0'}`,
              backgroundColor: cat === c ? '#EEF2FF' : '#FFFFFF',
              color: cat === c ? '#3730A3' : '#475569',
              fontSize: 13,
              fontWeight: cat === c ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 120ms ease',
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {isPending && <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Searching…</span>}
    </div>
  )
}
