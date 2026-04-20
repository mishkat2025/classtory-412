'use client'

import { useState, useEffect } from 'react'
import { X, Copy, Check, Loader2, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Classroom {
  id: string
  name: string
  subject: string
  cover_color: string
}

interface CopyToClassroomModalProps {
  /** Label shown in the modal title e.g. "announcement", "assignment", "material" */
  contentType: string
  /** Summary shown under the title e.g. the announcement text or assignment title */
  contentPreview: string
  /** Current classroom id — excluded from target list */
  currentClassroomId: string
  /** Teacher's user id */
  teacherId: string
  onClose: () => void
  /** Called with each selected classroom id, one at a time */
  onCopy: (targetClassroomId: string) => Promise<void>
}

export function CopyToClassroomModal({
  contentType,
  contentPreview,
  currentClassroomId,
  teacherId,
  onClose,
  onCopy,
}: CopyToClassroomModalProps) {
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [copying, setCopying] = useState(false)
  const [copied, setCopied] = useState<Set<string>>(new Set())
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('classrooms')
        .select('id, name, subject, cover_color')
        .eq('teacher_id', teacherId)
        .neq('id', currentClassroomId)
        .order('name')
      setClassrooms((data ?? []) as Classroom[])
      setLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleCopy() {
    if (selected.size === 0) return
    setCopying(true)
    for (const id of selected) {
      await onCopy(id)
      setCopied(prev => new Set([...prev, id]))
    }
    setCopying(false)
    // auto-close after brief moment
    setTimeout(onClose, 600)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        backgroundColor: 'rgba(15,23,42,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 460,
        boxShadow: '0 20px 48px rgba(0,0,0,0.18)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>
              Copy {contentType} to another class
            </h2>
            <p style={{
              fontSize: 12, color: '#64748B', margin: 0,
              maxWidth: 340, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {contentPreview}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4, marginTop: -2 }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 24px 0' }}>
          {loading ? (
            <div style={{ padding: '32px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#94A3B8', fontSize: 13 }}>
              <Loader2 size={16} className="animate-spin" /> Loading classrooms…
            </div>
          ) : classrooms.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <BookOpen size={20} color="#A5B4FC" />
              </div>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>No other classrooms found.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
              {classrooms.map(cls => {
                const isSelected = selected.has(cls.id)
                const isDone = copied.has(cls.id)
                return (
                  <button
                    key={cls.id}
                    onClick={() => !isDone && toggle(cls.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', borderRadius: 10, cursor: isDone ? 'default' : 'pointer',
                      border: `1.5px solid ${isSelected ? '#4F46E5' : '#E2E8F0'}`,
                      backgroundColor: isDone ? '#F0FDF4' : isSelected ? '#EEF2FF' : '#FFFFFF',
                      textAlign: 'left', transition: 'all 120ms ease',
                    }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: cls.cover_color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cls.name}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>{cls.subject}</div>
                    </div>
                    {isDone ? (
                      <Check size={15} color="#10B981" />
                    ) : isSelected ? (
                      <div style={{ width: 18, height: 18, borderRadius: 5, backgroundColor: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={11} color="white" />
                      </div>
                    ) : (
                      <div style={{ width: 18, height: 18, borderRadius: 5, border: '1.5px solid #CBD5E1' }} />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', marginTop: 16 }}>
          <span style={{ fontSize: 12, color: '#94A3B8' }}>
            {selected.size > 0 ? `${selected.size} class${selected.size > 1 ? 'es' : ''} selected` : 'Select one or more'}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ height: 36, padding: '0 16px', borderRadius: 8, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#0F172A' }}>
              Cancel
            </button>
            <button
              onClick={handleCopy}
              disabled={selected.size === 0 || copying}
              style={{
                height: 36, padding: '0 16px', borderRadius: 8, border: 'none',
                backgroundColor: selected.size === 0 || copying ? '#E2E8F0' : '#4F46E5',
                color: selected.size === 0 || copying ? '#94A3B8' : '#FFFFFF',
                fontSize: 13, fontWeight: 600, cursor: selected.size === 0 || copying ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {copying ? <Loader2 size={13} className="animate-spin" /> : <Copy size={13} />}
              {copying ? 'Copying…' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
