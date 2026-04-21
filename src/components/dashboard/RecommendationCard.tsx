import Link from 'next/link'
import { Star, Users, BookOpen } from 'lucide-react'

interface RecommendationCardProps {
  id: string
  title: string
  category: string
  thumbnail_url: string | null
  rating: number
  student_count: number
  price: number
  instructor_name: string
}

export function RecommendationCard({
  id,
  title,
  category,
  thumbnail_url,
  rating,
  student_count,
  price,
  instructor_name,
}: RecommendationCardProps) {
  return (
    <Link
      href={`/courses/${id}`}
      style={{ textDecoration: 'none', display: 'block' }}
      className="card-hover"
    >
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Thumbnail */}
        <div
          style={{
            height: 140,
            backgroundColor: 'var(--color-primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          {thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnail_url}
              alt={title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <BookOpen size={40} color="#A5B4FC" />
          )}
          {/* Category chip overlay */}
          <span
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              fontSize: 11,
              fontWeight: 600,
              color: '#3730A3',
              backgroundColor: 'rgba(238,242,255,0.92)',
              borderRadius: 9999,
              padding: '2px 10px',
              letterSpacing: '0.03em',
              backdropFilter: 'blur(4px)',
            }}
          >
            {category}
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h4
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              margin: '0 0 4px 0',
              lineHeight: 1.35,
              letterSpacing: '-0.01em',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {title}
          </h4>

          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '0 0 10px 0' }}>
            {instructor_name}
          </p>

          {/* Rating + students */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Star size={12} color="#F59E0B" fill="#F59E0B" />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {rating > 0 ? rating.toFixed(1) : '—'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Users size={12} color="#94A3B8" />
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                {student_count.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Price row */}
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 15,
                fontWeight: 700,
                color: price === 0 ? '#059669' : '#0F172A',
              }}
            >
              {price === 0 ? 'Free' : `$${price.toFixed(2)}`}
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#4F46E5',
                backgroundColor: 'var(--color-primary-light)',
                borderRadius: 9999,
                padding: '3px 10px',
              }}
            >
              Enroll
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
