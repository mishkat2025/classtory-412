'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, X, Check } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/lib/types'

interface NotificationBellProps {
  userId: string
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

export function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const unreadCount = notifications.filter(n => !n.is_read).length

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)
      setNotifications((data ?? []) as Notification[])
      setLoading(false)
    }
    load()

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        payload => {
          setNotifications(prev => [payload.new as Notification, ...prev])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function markAllRead() {
    const unread = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unread.length === 0) return
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unread)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  async function markRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          position: 'relative',
          width: 36,
          height: 36,
          borderRadius: 8,
          backgroundColor: open ? '#EEF2FF' : 'transparent',
          border: '1px solid transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#475569',
          transition: 'background-color 120ms ease',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F1F5F9' }}
        onMouseLeave={e => { if (!open) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 16,
            height: 16,
            borderRadius: '50%',
            backgroundColor: '#EF4444',
            fontSize: 10,
            fontWeight: 700,
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 44,
          right: 0,
          width: 360,
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 14,
          boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
          zIndex: 100,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Notifications
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  style={{ fontSize: 12, color: '#4F46E5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Check size={12} />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: 2 }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 }}>Loading…</div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                <Bell size={28} color="#CBD5E1" style={{ margin: '0 auto 10px', display: 'block' }} />
                <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif, i) => (
                <div
                  key={notif.id}
                  onClick={() => markRead(notif.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '12px 16px',
                    borderBottom: i < notifications.length - 1 ? '1px solid #F1F5F9' : 'none',
                    backgroundColor: notif.is_read ? 'transparent' : '#F8F9FF',
                    cursor: 'pointer',
                    transition: 'background-color 120ms ease',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F8FAFC' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = notif.is_read ? 'transparent' : '#F8F9FF' }}
                >
                  {!notif.is_read && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#4F46E5', flexShrink: 0, marginTop: 5 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0, paddingLeft: notif.is_read ? 20 : 0 }}>
                    {notif.link ? (
                      <Link href={notif.link} style={{ textDecoration: 'none' }}>
                        <p style={{ fontSize: 13, color: 'var(--color-text-primary)', margin: '0 0 3px 0', lineHeight: 1.5 }}>{notif.message}</p>
                      </Link>
                    ) : (
                      <p style={{ fontSize: 13, color: 'var(--color-text-primary)', margin: '0 0 3px 0', lineHeight: 1.5 }}>{notif.message}</p>
                    )}
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{relativeTime(notif.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
