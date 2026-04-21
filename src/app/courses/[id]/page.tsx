import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, Star, Users, Clock, Tag, ArrowLeft, Award } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { EnrollButton } from './EnrollButton'
import { EditCourseCard } from './EditCourseCard'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('courses').select('title, description').eq('id', id).single()
  if (!data) return { title: 'Course — Classtory' }
  return { title: `${data.title} — Classtory`, description: data.description }
}

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: course, error } = await supabase
    .from('courses')
    .select('*, instructor:profiles(id, full_name, avatar_url)')
    .eq('id', id)
    .single()

  if (error || !course) notFound()

  const isInstructor = !!user && user.id === course.instructor_id
  const linkedClassroomId = (course as Record<string, unknown>).linked_classroom_id as string | null ?? null

  let isEnrolled = false
  if (user && !isInstructor) {
    const { data: enrollment } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('course_id', id)
      .eq('student_id', user.id)
      .maybeSingle()
    isEnrolled = !!enrollment

    // Auto-sync: if student is enrolled in course but not the linked classroom, enroll them
    if (isEnrolled && linkedClassroomId) {
      const { data: clsEnrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('classroom_id', linkedClassroomId)
        .eq('student_id', user.id)
        .maybeSingle()
      if (!clsEnrollment) {
        await supabase.from('enrollments').insert({ classroom_id: linkedClassroomId, student_id: user.id })
      }
    }
  }

  const instructor = course.instructor as { id: string; full_name: string; avatar_url: string | null } | null
  const instructorInitials = instructor?.full_name
    ? instructor.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {/* Navbar */}
      <nav style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, backgroundColor: '#4F46E5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={16} color="white" />
            </div>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 18, color: 'var(--color-text-primary)' }}>Classtory</span>
          </Link>
          {user ? (
            <Link href="/student" style={{ fontSize: 14, fontWeight: 500, color: '#4F46E5', textDecoration: 'none' }}>Dashboard →</Link>
          ) : (
            <div style={{ display: 'flex', gap: 12 }}>
              <Link href="/auth/login" style={{ fontSize: 14, fontWeight: 500, color: '#475569', textDecoration: 'none', padding: '8px 14px' }}>Log in</Link>
              <Link href="/auth/signup" style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF', backgroundColor: '#4F46E5', borderRadius: 8, padding: '8px 16px', textDecoration: 'none' }}>Get started</Link>
            </div>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 60px' }}>
        {/* Back */}
        <Link href="/courses" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-secondary)', textDecoration: 'none', fontWeight: 500, marginBottom: 24 }}>
          <ArrowLeft size={14} />
          Back to courses
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'start' }}>
          {/* Main */}
          <div>
            {/* Thumbnail */}
            <div style={{ height: 280, borderRadius: 14, overflow: 'hidden', marginBottom: 28, backgroundColor: '#EEF2FF' }}>
              {course.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={course.thumbnail_url} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)' }}>
                  <BookOpen size={56} color="#A5B4FC" />
                </div>
              )}
            </div>

            {/* Category + title */}
            <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, color: '#3730A3', backgroundColor: '#EEF2FF', borderRadius: 9999, padding: '3px 12px', marginBottom: 12 }}>
              {course.category}
            </div>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 28, fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 16px 0', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {course.title}
            </h1>

            {/* Meta row */}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Star size={14} fill="#F59E0B" color="#F59E0B" />
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{course.rating?.toFixed(1) ?? '—'}</span>
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>rating</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Users size={14} color="#64748B" />
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{course.student_count ?? 0} students</span>
              </div>
            </div>

            {/* Instructor */}
            {instructor && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, padding: '16px 20px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                  {instructor.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={instructor.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF' }}>{instructorInitials}</span>
                  )}
                </div>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '0 0 2px 0' }}>Instructor</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>{instructor.full_name}</p>
                </div>
              </div>
            )}

            {/* Description */}
            <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '24px 28px' }}>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 17, fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 12px 0' }}>About this course</h2>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.75, margin: '0 0 16px 0', whiteSpace: 'pre-wrap' }}>{course.description}</p>

              {course.tags && course.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                  <Tag size={14} color="#94A3B8" style={{ flexShrink: 0, marginTop: 2 }} />
                  {(course.tags as string[]).map(tag => (
                    <span key={tag} style={{ fontSize: 12, fontWeight: 500, color: '#475569', backgroundColor: 'var(--color-surface-2)', borderRadius: 9999, padding: '2px 10px' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Enroll / Manage card */}
          <div style={{ position: 'sticky', top: 88 }}>
            {isInstructor ? (
              <EditCourseCard course={{
                id: course.id,
                title: course.title,
                description: course.description,
                category: course.category,
                price: course.price,
                tags: course.tags ?? [],
                student_count: course.student_count ?? 0,
              }} linkedClassroomId={linkedClassroomId} />
            ) : (
            <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 30, fontWeight: 800, color: course.price === 0 ? '#10B981' : '#0F172A', margin: '0 0 20px 0' }}>
                {course.price === 0 ? 'Free' : `$${course.price}`}
              </p>

              <EnrollButton
                courseId={course.id}
                courseName={course.title}
                isAuthenticated={!!user}
                isEnrolled={isEnrolled}
              />

              {/* Course Room button — shown once enrolled */}
              {isEnrolled && linkedClassroomId && (
                <Link
                  href={`/classroom/${linkedClassroomId}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, marginTop: 10, backgroundColor: '#1E1B4B', color: '#FFFFFF', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}
                >
                  Go to Course Room →
                </Link>
              )}

              {/* Course Room button — shown once enrolled */}
              {isEnrolled && linkedClassroomId && (
                <Link
                  href={`/classroom/${linkedClassroomId}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, marginTop: 10, backgroundColor: '#1E1B4B', color: '#FFFFFF', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}
                >
                  Go to Course Room →
                </Link>
              )}

              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { Icon: Award, text: 'Certificate on completion' },
                  { Icon: Clock, text: 'Self-paced learning' },
                  { Icon: Users, text: `${course.student_count ?? 0} learners enrolled` },
                ].map(({ Icon, text }) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon size={14} color="#64748B" />
                    <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
