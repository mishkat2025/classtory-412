import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import type { Profile, UserRole } from '@/lib/types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Auto-create profile if it was lost (e.g. after DB recreation)
  if (!profile) {
    const meta = user.user_metadata ?? {}
    const { data: created, error: insertErr } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        full_name: (meta.full_name as string) || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        role: ((meta.role as string) || 'student') as UserRole,
      })
      .select()
      .single()

    if (insertErr || !created) redirect('/auth/login')
    profile = created
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-bg)', transition: 'background-color 200ms ease' }}>
      <Sidebar profile={profile as Profile} />
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', overflowX: 'hidden' }}>
        <div style={{ width: '100%', maxWidth: 1280, flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
