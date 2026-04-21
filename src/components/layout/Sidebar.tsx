'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  LogOut,
  ClipboardList,
  GraduationCap,
  Shield,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Store,
  Settings,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import type { Profile } from '@/lib/types'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

interface NavSection {
  title?: string
  items: NavItem[]
}

const studentNav: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', href: '/student', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Learning',
    items: [
      { label: 'Assignments', href: '/student/assignments', icon: ClipboardList },
      { label: 'Grades', href: '/student/grades', icon: BarChart3 },
    ],
  },
  {
    title: 'Discover',
    items: [
      { label: 'Marketplace', href: '/courses', icon: Store },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
]

const teacherNav: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', href: '/teacher', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Manage',
    items: [
      { label: 'Classrooms', href: '/teacher', icon: GraduationCap },
      { label: 'Courses', href: '/courses', icon: BookOpen },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
]

const adminNav: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Management',
    items: [
      { label: 'Users', href: '/admin', icon: Users },
      { label: 'Courses', href: '/courses', icon: BookOpen },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Platform', href: '/admin', icon: Shield },
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
]

const navByRole: Record<Profile['role'], NavSection[]> = {
  student: studentNav,
  teacher: teacherNav,
  admin: adminNav,
}

interface SidebarProps {
  profile: Profile
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  const sections = navByRole[profile.role]

  function isActive(href: string) {
    if (href === '/student' || href === '/teacher' || href === '/admin') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const initials = profile.full_name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        style={{
          width: collapsed ? 64 : 240,
          minWidth: collapsed ? 64 : 240,
          backgroundColor: '#1E1B4B',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'sticky',
          top: 0,
          transition: 'width 200ms ease, min-width 200ms ease',
          overflow: 'hidden',
        }}
        className="hidden md:flex"
      >
        {/* Logo area */}
        <div
          style={{
            height: 64,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            padding: collapsed ? '0 12px' : '0 20px',
            justifyContent: collapsed ? 'center' : 'space-between',
            flexShrink: 0,
          }}
        >
          {!collapsed && (
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  backgroundColor: '#4F46E5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <BookOpen size={16} color="#fff" />
              </div>
              <span
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: 16,
                  color: '#FFFFFF',
                  letterSpacing: '-0.01em',
                }}
              >
                Classtory
              </span>
            </Link>
          )}
          {collapsed && (
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                backgroundColor: '#4F46E5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookOpen size={16} color="#fff" />
            </div>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              backgroundColor: 'rgba(255,255,255,0.06)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#C7D2FE',
              flexShrink: 0,
              marginLeft: collapsed ? 0 : 8,
            }}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Nav sections */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {sections.map((section, si) => (
            <div key={si}>
              {section.title && !collapsed && (
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#6366F1',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '0 12px',
                    marginTop: 24,
                    marginBottom: 4,
                  }}
                >
                  {section.title}
                </div>
              )}
              {section.title && collapsed && (
                <div style={{ height: 16, marginTop: 8 }} />
              )}
              {section.items.map(item => {
                const active = isActive(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      height: 40,
                      margin: '2px 8px',
                      padding: collapsed ? '0 10px' : '0 12px',
                      borderRadius: 8,
                      textDecoration: 'none',
                      backgroundColor: active ? '#4F46E5' : 'transparent',
                      color: active ? '#FFFFFF' : '#C7D2FE',
                      transition: 'background-color 120ms ease',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                    }}
                    onMouseEnter={e => {
                      if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = '#312E81'
                    }}
                    onMouseLeave={e => {
                      if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                    }}
                  >
                    <Icon
                      size={18}
                      color={active ? '#FFFFFF' : '#818CF8'}
                      style={{ flexShrink: 0 }}
                    />
                    {!collapsed && (
                      <span style={{ fontSize: 14, fontWeight: active ? 500 : 400, whiteSpace: 'nowrap' }}>
                        {item.label}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Bottom user area */}
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            padding: 16,
            flexShrink: 0,
          }}
        >
          {!collapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar initials={initials} avatarUrl={profile.avatar_url} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#FFFFFF',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {profile.full_name}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: '#A5B4FC',
                    textTransform: 'capitalize',
                  }}
                >
                  {profile.role}
                </div>
              </div>
              <ThemeToggle compact />
              <button
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#818CF8',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 4,
                  borderRadius: 6,
                  flexShrink: 0,
                }}
                title="Log out"
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#C7D2FE' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#818CF8' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <Avatar initials={initials} avatarUrl={profile.avatar_url} />
              <ThemeToggle compact />
              <button
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#818CF8',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 4,
                  borderRadius: 6,
                }}
                title="Log out"
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#C7D2FE' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#818CF8' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile sidebar */}
      <MobileSidebar
        profile={profile}
        sections={sections}
        pathname={pathname}
        isActive={isActive}
        onLogout={handleLogout}
        initials={initials}
      />
    </>
  )
}

/* ─── Avatar ─────────────────────────────────────────────────── */

function Avatar({ initials, avatarUrl }: { initials: string; avatarUrl?: string }) {
  return (
    <div
      style={{
        width: 32,
        height: 32,
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
        <span style={{ fontSize: 12, fontWeight: 600, color: '#FFFFFF' }}>{initials}</span>
      )}
    </div>
  )
}

/* ─── Mobile sidebar ─────────────────────────────────────────── */

interface MobileSidebarProps {
  profile: Profile
  sections: NavSection[]
  pathname: string
  isActive: (href: string) => boolean
  onLogout: () => void
  initials: string
}

function MobileSidebar({ profile, sections, pathname, isActive, onLogout, initials }: MobileSidebarProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden">
      {/* Topbar with hamburger */}
      <div
        style={{
          height: 56,
          backgroundColor: '#1E1B4B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              backgroundColor: '#4F46E5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BookOpen size={14} color="#fff" />
          </div>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, color: '#FFFFFF' }}>
            Classtory
          </span>
        </Link>
        <button
          onClick={() => setOpen(true)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#C7D2FE',
            display: 'flex',
            padding: 4,
          }}
          aria-label="Open menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <rect y="3" width="20" height="2" rx="1" />
            <rect y="9" width="20" height="2" rx="1" />
            <rect y="15" width="20" height="2" rx="1" />
          </svg>
        </button>
      </div>

      {/* Overlay */}
      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
          }}
          onClick={() => setOpen(false)}
        >
          <div style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} />
        </div>
      )}

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: 240,
          backgroundColor: '#1E1B4B',
          zIndex: 60,
          display: 'flex',
          flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 200ms ease',
        }}
      >
        {/* Drawer header */}
        <div
          style={{
            height: 64,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            flexShrink: 0,
          }}
        >
          <Link
            href="/"
            onClick={() => setOpen(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                backgroundColor: '#4F46E5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookOpen size={16} color="#fff" />
            </div>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 16, color: '#FFFFFF' }}>
              Classtory
            </span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#C7D2FE',
              display: 'flex',
              padding: 4,
            }}
            aria-label="Close menu"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
              <path d="M1 1l16 16M17 1L1 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Drawer nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {sections.map((section, si) => (
            <div key={si}>
              {section.title && (
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#6366F1',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '0 12px',
                    marginTop: 24,
                    marginBottom: 4,
                  }}
                >
                  {section.title}
                </div>
              )}
              {section.items.map(item => {
                const active = isActive(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      height: 40,
                      margin: '2px 8px',
                      padding: '0 12px',
                      borderRadius: 8,
                      textDecoration: 'none',
                      backgroundColor: active ? '#4F46E5' : 'transparent',
                      color: active ? '#FFFFFF' : '#C7D2FE',
                    }}
                    onMouseEnter={e => {
                      if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = '#312E81'
                    }}
                    onMouseLeave={e => {
                      if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                    }}
                  >
                    <Icon size={18} color={active ? '#FFFFFF' : '#818CF8'} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: active ? 500 : 400 }}>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Drawer bottom */}
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            padding: 16,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar initials={initials} avatarUrl={profile.avatar_url} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#FFFFFF',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {profile.full_name}
              </div>
              <div style={{ fontSize: 11, color: '#A5B4FC', textTransform: 'capitalize' }}>
                {profile.role}
              </div>
            </div>
            <button
              onClick={onLogout}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#818CF8',
                display: 'flex',
                alignItems: 'center',
                padding: 4,
                borderRadius: 6,
                flexShrink: 0,
              }}
              title="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
