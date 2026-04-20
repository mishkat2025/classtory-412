'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Send, Megaphone } from 'lucide-react'
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

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Compose box */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
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
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 14,
                fontFamily: "'Inter', sans-serif",
                color: '#0F172A',
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
              <span style={{ fontSize: 12, color: '#94A3B8' }}>
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
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
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
              backgroundColor: '#EEF2FF',
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
              color: '#0F172A',
              margin: '0 0 6px 0',
            }}
          >
            No announcements yet
          </p>
          <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
            Post something to get the conversation started.
          </p>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
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
                  i < announcements.length - 1 ? '1px solid #F1F5F9' : 'none',
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
                        color: '#0F172A',
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
                          backgroundColor: '#EEF2FF',
                          borderRadius: 9999,
                          padding: '1px 8px',
                        }}
                      >
                        Teacher
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>
                    {relativeTime(item.created_at)}
                  </span>
                </div>
              </div>

              {/* Content */}
              <p
                style={{
                  fontSize: 14,
                  color: '#475569',
                  margin: 0,
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {item.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
