import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import type { Profile } from '@/lib/types'

interface DashboardLayoutProps {
  profile: Profile
  children: React.ReactNode
}

export function DashboardLayout({ profile, children }: DashboardLayoutProps) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      <Sidebar profile={profile} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <main style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
