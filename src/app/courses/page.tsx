import { Suspense } from 'react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { CourseGrid } from '@/components/courses/CourseGrid'
import { CourseFilters } from '@/components/courses/CourseFilters'
import { PublicNavbar } from '@/components/layout/PublicNavbar'
import type { CourseCardCourse } from '@/components/courses/CourseCard'

export const metadata: Metadata = { title: 'Browse Courses — Classtory' }

interface SearchParams {
  q?: string
  category?: string
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { q, category } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('courses')
    .select('*, instructor:profiles(full_name, avatar_url)')
    .order('student_count', { ascending: false })

  if (q) {
    query = query.ilike('title', `%${q}%`)
  }
  if (category) {
    query = query.eq('category', category)
  }

  const { data: courses, error } = await query.limit(48)

  const { data: categoryRows } = await supabase
    .from('courses')
    .select('category')
    .order('category')

  const categories = [
    ...new Set((categoryRows ?? []).map(r => r.category as string).filter(Boolean)),
  ]

  const courseList = (courses ?? []) as CourseCardCourse[]

  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <PublicNavbar />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 60px' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 28, fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            Browse Courses
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>
            {error ? 'Failed to load courses.' : `${courseList.length} course${courseList.length !== 1 ? 's' : ''} available${q ? ` for "${q}"` : ''}${category ? ` in ${category}` : ''}`}
          </p>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: 24 }}>
          <Suspense fallback={null}>
            <CourseFilters categories={categories} />
          </Suspense>
        </div>

        {/* Grid */}
        {error ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', backgroundColor: 'var(--color-surface)', borderRadius: 14, border: '1px solid var(--color-border)' }}>
            <p style={{ fontSize: 14, color: '#EF4444', margin: 0 }}>Failed to load courses. Please try again.</p>
          </div>
        ) : (
          <CourseGrid courses={courseList} emptyMessage={q || category ? 'No courses match your search.' : 'No courses yet.'} />
        )}
      </div>
    </div>
  )
}
