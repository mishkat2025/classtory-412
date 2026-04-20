import { BookOpen } from 'lucide-react'
import { CourseCard, type CourseCardCourse } from './CourseCard'
import Link from 'next/link'

interface CourseGridProps {
  courses: CourseCardCourse[]
  emptyMessage?: string
}

export function CourseGrid({ courses, emptyMessage = 'No courses found.' }: CourseGridProps) {
  if (courses.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '72px 24px', backgroundColor: '#FFFFFF', borderRadius: 14, border: '1px dashed #CBD5E1' }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <BookOpen size={26} color="#4F46E5" />
        </div>
        <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 8px 0' }}>
          {emptyMessage}
        </h3>
        <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 20px 0' }}>
          Try a different search or category filter.
        </p>
        <Link
          href="/courses"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 16px', backgroundColor: '#4F46E5', color: '#FFFFFF', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
        >
          Clear filters
        </Link>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
      {courses.map(course => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  )
}
