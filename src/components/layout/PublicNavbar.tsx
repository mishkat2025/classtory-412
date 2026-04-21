import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ThemeToggle } from '@/components/shared/ThemeToggle'

interface PublicNavbarProps {
  /** Extra nav links to show between logo and auth buttons */
  links?: { href: string; label: string }[]
}

export async function PublicNavbar({ links }: PublicNavbarProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('profiles').select('role').eq('id', user.id).single()
    : { data: null }

  const dashboardHref =
    profile?.role === 'teacher' ? '/teacher'
    : profile?.role === 'admin'   ? '/admin'
    : '/student'

  return (
    <nav style={{
      backgroundColor: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, backgroundColor: '#4F46E5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={16} color="white" />
          </div>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 18, color: 'var(--color-text-primary)' }}>
            Classtory
          </span>
        </Link>

        {/* Optional mid-links */}
        {links && links.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {links.map(({ href, label }) => (
              <Link key={href} href={href} style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Auth buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ThemeToggle variant="navbar" />
          {user ? (
            <Link
              href={dashboardHref}
              style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF', backgroundColor: '#4F46E5', borderRadius: 8, padding: '8px 18px', textDecoration: 'none' }}
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/auth/login"
                style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-secondary)', textDecoration: 'none', padding: '8px 16px' }}
              >
                Log in
              </Link>
              <Link
                href="/auth/signup"
                style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF', backgroundColor: '#4F46E5', borderRadius: 8, padding: '8px 18px', textDecoration: 'none' }}
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
