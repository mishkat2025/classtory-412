import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/dashboard/StatCard'
import { AdminUserTable } from './AdminUserTable'
import { Users, BookOpen, GraduationCap, BarChart3, Shield } from 'lucide-react'
import type { Profile } from '@/lib/types'

export const metadata: Metadata = { title: 'Admin Dashboard — Classtory' }

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profileData) redirect('/auth/login')
  const profile = profileData as Profile
  if (profile.role !== 'admin') redirect(`/${profile.role}`)

  const [
    { count: totalUsers },
    { count: totalStudents },
    { count: totalTeachers },
    { count: totalCourses },
    { count: totalClassrooms },
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
    supabase.from('courses').select('*', { count: 'exact', head: true }),
    supabase.from('classrooms').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(50),
  ])

  return (
    <div style={{ padding: '28px 28px 40px', maxWidth: 1200, width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={16} color="#4F46E5" />
          </div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Admin Dashboard
          </h1>
        </div>
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>Platform-wide overview and user management</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 36 }}>
        <StatCard icon={Users} label="Total Users" value={totalUsers ?? 0} iconBg="#EEF2FF" iconColor="#4F46E5" />
        <StatCard icon={GraduationCap} label="Students" value={totalStudents ?? 0} iconBg="#D1FAE5" iconColor="#059669" />
        <StatCard icon={Users} label="Teachers" value={totalTeachers ?? 0} iconBg="#FEF3C7" iconColor="#D97706" />
        <StatCard icon={BookOpen} label="Courses" value={totalCourses ?? 0} iconBg="#DBEAFE" iconColor="#2563EB" />
        <StatCard icon={BarChart3} label="Classrooms" value={totalClassrooms ?? 0} iconBg="#F3E8FF" iconColor="#9333EA" />
      </div>

      {/* User Table */}
      <section>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 17, fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 16px 0' }}>
          All Users
        </h2>
        <AdminUserTable initialUsers={(recentUsers ?? []) as Profile[]} />
      </section>
    </div>
  )
}
