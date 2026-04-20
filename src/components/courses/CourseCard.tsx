import Link from 'next/link'
import { Star, BookOpen } from 'lucide-react'
import type { Course, Profile } from '@/lib/types'

export type CourseCardCourse = Pick<
  Course,
  'id' | 'title' | 'category' | 'thumbnail_url' | 'rating' | 'student_count' | 'price'
> & {
  instructor: Pick<Profile, 'full_name'> | null
}

export function CourseCard({ course }: { course: CourseCardCourse }) {
  return (
    <Link href={`/courses/${course.id}`} style={{ textDecoration: 'none' }}>
      <div
        className="card-hover"
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          height: '100%',
        }}
      >
        {/* Thumbnail */}
        <div style={{ height: 160, position: 'relative', overflow: 'hidden' }}>
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)',
              }}
            >
              <BookOpen size={40} color="#A5B4FC" />
            </div>
          )}

          {/* Category badge */}
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              backgroundColor: 'rgba(255,255,255,0.92)',
              borderRadius: 9999,
              padding: '3px 10px',
              fontSize: 11,
              fontWeight: 600,
              color: '#3730A3',
            }}
          >
            {course.category}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px 20px' }}>
          <h3
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 15,
              fontWeight: 700,
              color: '#0F172A',
              marginBottom: 6,
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {course.title}
          </h3>

          <p style={{ fontSize: 12, color: '#64748B', marginBottom: 14 }}>
            by {course.instructor?.full_name ?? 'Instructor'}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Rating */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Star size={13} fill="#F59E0B" color="#F59E0B" />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                {course.rating?.toFixed(1) ?? '—'}
              </span>
              <span style={{ fontSize: 12, color: '#94A3B8' }}>
                ({course.student_count ?? 0})
              </span>
            </div>

            {/* Price */}
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 16,
                fontWeight: 700,
                color: course.price === 0 ? '#10B981' : '#0F172A',
              }}
            >
              {course.price === 0 ? 'Free' : `$${course.price}`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
