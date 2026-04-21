import { createClient } from '@/lib/supabase/server'
import { NotificationBell } from '@/components/shared/NotificationBell'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { Avatar } from '@/components/shared/Avatar'
import type { Profile } from '@/lib/types'

interface NavbarProps {
  profile: Profile
}

export async function Navbar({ profile }: NavbarProps) {
  return (
    <div
      style={{
        height: 56,
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 24px',
        gap: 12,
        flexShrink: 0,
      }}
    >
      <ThemeToggle variant="navbar" />
      <NotificationBell userId={profile.id} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar name={profile.full_name} avatarUrl={profile.avatar_url} size={32} />
        <div style={{ display: 'none' }} className="sm:block">
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>{profile.full_name}</p>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0, textTransform: 'capitalize' }}>{profile.role}</p>
        </div>
      </div>
    </div>
  )
}
