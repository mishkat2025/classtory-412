'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Send, Megaphone, Pencil, Trash2, Copy, X, Check, Loader2 } from 'lucide-react'
import { CopyToClassroomModal } from './CopyToClassroomModal'
import { createClient } from '@/lib/supabase/client'
import type { AnnouncementFull } from './types'
import type { Profile } from '@/lib/types'

interface AnnouncementFeedProps {
  initialAnnouncements: AnnouncementFull[]
  classroom_id: string
  profile: Profile
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (diff < 60000) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'Yesterday'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function Initials({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        backgroundColor: '#4F46E5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{initials}</span>
      )}
    </div>
  )
}

export function AnnouncementFeed({
  initialAnnouncements,
  classroom_id,
  profile,
}: AnnouncementFeedProps) {
  const [announcements, setAnnouncements] = useState<AnnouncementFull[]>(initialAnnouncements)
  const [draft, setDraft] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()
  const isTeacher = profile.role === 'teacher'

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Copy modal state
  const [copyingItem, setCopyingItem] = useState<AnnouncementFull | null>(null)

  /* ── Realtime subscription ──────────────────────────────── */
  useEffect(() => {
    const channel = supabase
      .channel(`announcements:${classroom_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'announcements',
          filter: `classroom_id=eq.${classroom_id}`,
        },
        async payload => {
          const { data } = await supabase
            .from('announcements')
            .select('*, author:profiles(full_name, avatar_url, role)')
            .eq('id', (payload.new as { id: string }).id)
            .single()

          if (data) {
            setAnnouncements(prev => {
              if (prev.some(a => a.id === data.id)) return prev
              return [data as AnnouncementFull, ...prev]
            })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [classroom_id]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Post ───────────────────────────────────────────────── */
  async function handlePost() {
    const content = draft.trim()
    if (!content) return
    setIsPosting(true)

    const { data, error } = await supabase
      .from('announcements')
      .insert({ classroom_id, author_id: profile.id, content })
      .select('*, author:profiles(full_name, avatar_url, role)')
      .single()

    setIsPosting(false)

    if (error) {
      toast.error('Failed to post announcement.')
      return
    }

    setDraft('')
    // Add immediately; realtime dedup handles the channel echo
    setAnnouncements(prev => {
      if (prev.some(a => a.id === data.id)) return prev
      return [data as AnnouncementFull, ...prev]
    })
    textareaRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handlePost()
    }
  }

  /* ── Edit ───────────────────────────────────────────────── */
  function startEdit(item: AnnouncementFull) {
    setEditingId(item.id)
    setEditDraft(item.content)
  }

  async function saveEdit(id: string) {
    const content = editDraft.trim()
    if (!content) return
    setIsSavingEdit(true)
    const { error } = await supabase
      .from('announcements')
      .update({ content })
      .eq('id', id)
    setIsSavingEdit(false)
    if (error) { toast.error('Failed to update announcement.'); return }
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, content } : a))
    setEditingId(null)
    toast.success('Announcement updated.')
  }

  /* ── Delete ─────────────────────────────────────────────── */
  async function handleDelete(item: AnnouncementFull) {
    if (!window.confirm('Delete this announcement? This cannot be undone.')) return
    setDeletingId(item.id)
    const { error } = await supabase.from('announcements').delete().eq('id', item.id)
    setDeletingId(null)
    if (error) { toast.error('Failed to delete announcement.'); return }
    setAnnouncements(prev => prev.filter(a => a.id !== item.id))
    toast.success('Announcement deleted.')
  }

  /* ── Copy to classroom ──────────────────────────────────── */
  async function handleCopyAnnouncement(targetClassroomId: string) {
    if (!copyingItem) return
    const { error } = await supabase
      .from('announcements')
      .insert({ classroom_id: targetClassroomId, author_id: profile.id, content: copyingItem.content })
    if (error) toast.error('Copy failed: ' + error.message)
  }

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {copyingItem && (
        <CopyToClassroomModal
          contentType="announcement"
          contentPreview={copyingItem.content}
          currentClassroomId={classroom_id}
          teacherId={profile.id}
          onClose={() => setCopyingItem(null)}
          onCopy={handleCopyAnnouncement}
        />
      )}
      {/* Compose box */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 14,
          padding: 20,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ display: 'flex', gap: 12 }}>
          <Initials name={profile.full_name} avatarUrl={profile.avatar_url ?? null} />
          <div style={{ flex: 1 }}>
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Share something with the class…"
              rows={3}
              style={{
                width: '100%',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 14,
                fontFamily: "'Inter', sans-serif",
                color: 'var(--color-text-primary)',
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 150ms ease, box-shadow 150ms ease',
                boxSizing: 'border-box',
                lineHeight: 1.6,
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = '#4F46E5'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)'
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = '#E2E8F0'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 10,
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                Ctrl+Enter to post
              </span>
              <button
                onClick={handlePost}
                disabled={!draft.trim() || isPosting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  height: 34,
                  padding: '0 14px',
                  backgroundColor:
                    !draft.trim() || isPosting ? '#E2E8F0' : '#4F46E5',
                  color: !draft.trim() || isPosting ? '#94A3B8' : '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: !draft.trim() || isPosting ? 'not-allowed' : 'pointer',
                  transition: 'background-color 150ms ease',
                }}
              >
                <Send size={14} />
                {isPosting ? 'Posting…' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed */}
      {announcements.length === 0 ? (
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
            <Megaphone size={24} color="#4F46E5" />
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
            No announcements yet
          </p>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>
            Post something to get the conversation started.
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
          {announcements.map((item, i) => (
            <div
              key={item.id}
              style={{
                padding: '20px 24px',
                borderBottom:
                  i < announcements.length - 1 ? '1px solid var(--color-border)' : 'none',
              }}
            >
              {/* Author row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <Initials
                  name={item.author?.full_name ?? 'Unknown'}
                  avatarUrl={item.author?.avatar_url ?? null}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {item.author?.full_name ?? 'Unknown'}
                    </span>
                    {item.author?.role === 'teacher' && (
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
                        Teacher
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    {relativeTime(item.created_at)}
                  </span>
                </div>
              </div>

              {/* Content or edit textarea */}
              {editingId === item.id ? (
                <div>
                  <textarea
                    value={editDraft}
                    onChange={e => setEditDraft(e.target.value)}
                    rows={3}
                    style={{
                      width: '100%', border: '1px solid #4F46E5', borderRadius: 8,
                      padding: '10px 12px', fontSize: 14, fontFamily: "'Inter', sans-serif",
                      color: 'var(--color-text-primary)', resize: 'vertical', outline: 'none',
                      boxShadow: '0 0 0 3px rgba(79,70,229,0.1)', boxSizing: 'border-box', lineHeight: 1.6,
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button
                      onClick={() => saveEdit(item.id)}
                      disabled={isSavingEdit || !editDraft.trim()}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 32, padding: '0 12px', backgroundColor: '#4F46E5', color: '#FFFFFF', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                    >
                      {isSavingEdit ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 32, padding: '0 12px', backgroundColor: 'var(--color-surface-2)', color: 'var(--color-text-primary)', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                    >
                      <X size={12} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p
                  style={{
                    fontSize: 14, color: '#475569', margin: 0,
                    lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}
                >
                  {item.content}
                </p>
              )}

              {/* Teacher actions */}
              {isTeacher && editingId !== item.id && (
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <button
                    onClick={() => startEdit(item)}
                    title="Edit"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 28, padding: '0 10px', backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 7, fontSize: 11, fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                  >
                    <Pencil size={11} /> Edit
                  </button>
                  <button
                    onClick={() => setCopyingItem(item)}
                    title="Copy to another class"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 28, padding: '0 10px', backgroundColor: 'var(--color-primary-light)', border: '1px solid #C7D2FE', borderRadius: 7, fontSize: 11, fontWeight: 600, color: '#3730A3', cursor: 'pointer' }}
                  >
                    <Copy size={11} /> Copy to class
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    disabled={deletingId === item.id}
                    title="Delete"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 28, padding: '0 10px', backgroundColor: 'var(--color-danger-light)', border: '1px solid #FECACA', borderRadius: 7, fontSize: 11, fontWeight: 600, color: '#991B1B', cursor: 'pointer' }}
                  >
                    {deletingId === item.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
