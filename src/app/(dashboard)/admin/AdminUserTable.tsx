'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ChevronDown, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, UserRole } from '@/lib/types'

interface AdminUserTableProps {
  initialUsers: Profile[]
}

const roleBadge: Record<UserRole, { bg: string; color: string }> = {
  student: { bg: '#DBEAFE', color: '#1E40AF' },
  teacher: { bg: '#D1FAE5', color: '#065F46' },
  admin:   { bg: '#EEF2FF', color: '#3730A3' },
}

export function AdminUserTable({ initialUsers }: AdminUserTableProps) {
  const [users, setUsers] = useState<Profile[]>(initialUsers)
  const [updating, setUpdating] = useState<string | null>(null)

  async function changeRole(userId: string, newRole: UserRole) {
    setUpdating(userId)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    setUpdating(null)

    if (error) {
      toast.error('Failed to update role.')
      return
    }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    toast.success('Role updated.')
  }

  return (
    <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      {/* Table header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 160px 140px', padding: '0 20px', height: 40, backgroundColor: '#F8FAFC', borderBottom: '1px solid #F1F5F9', alignItems: 'center', gap: 12 }}>
        {['User', 'Email', 'Joined', 'Role'].map((h, i) => (
          <span key={i} style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
        ))}
      </div>

      {users.length === 0 ? (
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: '#94A3B8', margin: 0 }}>No users found.</p>
        </div>
      ) : (
        users.map((user, i) => {
          const badge = roleBadge[user.role]
          const isUpdating = updating === user.id
          const initials = user.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

          return (
            <div
              key={user.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 180px 160px 140px',
                padding: '0 20px',
                height: 56,
                borderBottom: i < users.length - 1 ? '1px solid #F1F5F9' : 'none',
                alignItems: 'center',
                gap: 12,
                transition: 'background-color 120ms ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F8FAFC' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
            >
              {/* Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                  {user.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#FFFFFF' }}>{initials}</span>
                  )}
                </div>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.full_name}
                </span>
              </div>

              {/* Email */}
              <span style={{ fontSize: 13, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </span>

              {/* Joined */}
              <span style={{ fontSize: 13, color: '#94A3B8' }}>
                {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>

              {/* Role dropdown */}
              <div style={{ position: 'relative' }}>
                {isUpdating ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Loader2 size={14} color="#4F46E5" className="animate-spin" />
                    <span style={{ fontSize: 12, color: '#94A3B8' }}>Updating…</span>
                  </div>
                ) : (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <select
                      value={user.role}
                      onChange={e => changeRole(user.id, e.target.value as UserRole)}
                      style={{
                        height: 28,
                        padding: '0 28px 0 10px',
                        borderRadius: 9999,
                        border: `1px solid ${badge.color}30`,
                        backgroundColor: badge.bg,
                        color: badge.color,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        appearance: 'none',
                        outline: 'none',
                      }}
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                    <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: badge.color, pointerEvents: 'none' }} />
                  </div>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
