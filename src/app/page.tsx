import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  BookOpen, Users, Award, ArrowRight,
  CheckCircle2, Zap, Shield, TrendingUp,
  GraduationCap, Layers, BarChart3,
} from 'lucide-react'
import { CourseCard } from '@/components/courses/CourseCard'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import type { CourseCardCourse } from '@/components/courses/CourseCard'

export default async function LandingPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('role').eq('id', user.id).single()
    : { data: null }
  const dashboardHref = profile?.role === 'teacher' ? '/teacher' : profile?.role === 'admin' ? '/admin' : '/student'

  const [
    { data: featuredCourses },
    { count: totalStudents },
    { count: totalCourses },
    { count: totalTeachers },
  ] = await Promise.all([
    supabase
      .from('courses')
      .select('*, instructor:profiles(full_name, avatar_url)')
      .order('student_count', { ascending: false })
      .limit(6),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('courses').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
  ])

  const courses = (featuredCourses ?? []) as CourseCardCourse[]

  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

      {/* ── NAVBAR ─────────────────────────────────────────────── */}
      <nav style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, backgroundColor: '#4F46E5', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={20} color="white" />
            </div>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 20, color: 'var(--color-text-primary)' }}>Classtory</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <Link href="/courses" style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Courses</Link>
            <Link href="/auth/signup" style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-secondary)', textDecoration: 'none' }}>For Teachers</Link>
          </div>

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
                <Link href="/auth/login" style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-secondary)', textDecoration: 'none', padding: '8px 16px' }}>
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

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section className="hero-section" style={{
        padding: '88px 24px 100px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.09) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -50, left: -50, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 760, margin: '0 auto', position: 'relative' }}>
          <div className="hero-badge">
            <Zap size={13} color="#4F46E5" />
            <span className="hero-badge-text">The all-in-one education platform</span>
          </div>

          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 54, fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1.1, marginBottom: 24, letterSpacing: '-0.02em' }}>
            Learn, Teach &{' '}
            <span style={{ color: '#4F46E5' }}>Collaborate</span>
            <br />in One Place
          </h1>

          <p style={{ fontSize: 18, color: 'var(--color-text-secondary)', lineHeight: 1.75, maxWidth: 540, margin: '0 auto 44px' }}>
            Classtory unifies a rich course marketplace with private classroom tools — everything students and teachers need, beautifully in one place.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/courses"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#4F46E5', color: '#FFFFFF', borderRadius: 10, padding: '13px 28px', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}
            >
              Explore Courses <ArrowRight size={16} />
            </Link>
            <Link
              href="/auth/signup"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '13px 28px', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}
            >
              Start for free
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ────────────────────────────────────────── */}
      <section style={{ backgroundColor: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 32, textAlign: 'center' }}>
          {([
            { label: 'Active Students',  value: totalStudents  ? `${totalStudents.toLocaleString()}+`  : '1,000+', Icon: Users,         bg: 'var(--color-primary-light)', ic: '#4F46E5' },
            { label: 'Courses Available', value: totalCourses  ? `${totalCourses.toLocaleString()}+`   : '200+',   Icon: BookOpen,      bg: 'var(--color-success-light)', ic: '#10B981' },
            { label: 'Expert Teachers',  value: totalTeachers  ? `${totalTeachers.toLocaleString()}+`  : '50+',    Icon: GraduationCap, bg: 'var(--color-warning-light)', ic: '#F59E0B' },
            { label: 'Success Rate',     value: '94%',                                                              Icon: Award,         bg: 'var(--color-info-light)',    ic: '#3B82F6' },
          ] as const).map(({ label, value, Icon, bg, ic }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={22} color={ic} />
              </div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 28, fontWeight: 700, color: 'var(--color-text-primary)' }}>{value}</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 34, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 12 }}>
              Everything you need to succeed
            </h2>
            <p style={{ fontSize: 16, color: 'var(--color-text-secondary)', maxWidth: 460, margin: '0 auto' }}>
              Whether you're a student looking to grow or a teacher building a classroom, Classtory has you covered.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {([
              {
                Icon: Layers, bg: 'var(--color-primary-light)', ic: '#4F46E5',
                title: 'Course Marketplace',
                desc:  'Browse hundreds of expertly crafted courses. Enroll with one click and learn at your own pace.',
                bullets: ['Search & filter by category', 'Instructor ratings & reviews', 'Certificate on completion'],
              },
              {
                Icon: Users, bg: 'var(--color-success-light)', ic: '#10B981',
                title: 'Private Classrooms',
                desc:  'Teachers create secure classrooms with a unique code. Students join instantly and access all resources.',
                bullets: ['Join via 6-character code', 'Real-time announcements', 'Attendance tracking'],
              },
              {
                Icon: BarChart3, bg: 'var(--color-warning-light)', ic: '#F59E0B',
                title: 'Smart Gradebook',
                desc:  'Assignments, submissions, grades, and feedback — all in one place. Export tabulation sheets instantly.',
                bullets: ['Assignment deadlines', 'File & text submissions', 'CSV grade export'],
              },
            ] as const).map(({ Icon, bg, ic, title, desc, bullets }) => (
              <div
                key={title}
                className="card-hover"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '28px 28px 32px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <Icon size={22} color={ic} />
                </div>
                <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 10 }}>{title}</h3>
                <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>{desc}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {bullets.map(b => (
                    <li key={b} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                      <CheckCircle2 size={14} color="#10B981" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED COURSES ───────────────────────────────────── */}
      <section style={{ backgroundColor: 'var(--color-surface)', padding: '80px 24px', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 28, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 6 }}>Featured Courses</h2>
              <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Top-rated courses from expert instructors</p>
            </div>
            <Link href="/courses" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: '#4F46E5', textDecoration: 'none' }}>
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {courses.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {courses.map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '64px 24px', backgroundColor: 'var(--color-bg)', borderRadius: 14, border: '1px dashed #CBD5E1' }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <BookOpen size={26} color="#4F46E5" />
              </div>
              <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 17, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 6 }}>No courses yet</h3>
              <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 24 }}>Be the first to create a course on Classtory.</p>
              <Link
                href="/auth/signup"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#4F46E5', color: '#FFFFFF', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
              >
                Start Teaching
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── FOR TEACHERS ───────────────────────────────────────── */}
      <section style={{ padding: '88px 24px', background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 56, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(165,180,252,0.15)', border: '1px solid rgba(165,180,252,0.25)', borderRadius: 9999, padding: '4px 14px', marginBottom: 24 }}>
              <TrendingUp size={13} color="#A5B4FC" />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#A5B4FC' }}>For Teachers</span>
            </div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 34, fontWeight: 700, color: '#FFFFFF', marginBottom: 16, lineHeight: 1.2 }}>
              Build your classroom.<br />Grow your impact.
            </h2>
            <p style={{ fontSize: 16, color: '#C7D2FE', lineHeight: 1.75, marginBottom: 32 }}>
              Create private classrooms, post assignments, track attendance, and grade work — all from one intuitive dashboard. Students get everything in real time.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 36 }}>
              {[
                'Create unlimited classrooms',
                'Real-time announcements & discussion',
                'Assignment grading with file uploads',
                'One-click attendance sheets',
                'Export tabulation CSV for reports',
              ].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CheckCircle2 size={16} color="#10B981" />
                  <span style={{ fontSize: 14, color: '#E0E7FF' }}>{item}</span>
                </div>
              ))}
            </div>
            <Link
              href="/auth/signup"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#4F46E5', color: '#FFFFFF', borderRadius: 10, padding: '13px 28px', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}
            >
              Create your classroom <ArrowRight size={16} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {([
              { Icon: Users,    bg: 'var(--color-primary-light)', ic: '#4F46E5', label: 'Student Management', desc: "Track who's enrolled, active, and thriving" },
              { Icon: Shield,   bg: 'var(--color-success-light)', ic: '#10B981', label: 'Secure Classrooms',  desc: 'Invite-only via unique 6-character class codes' },
              { Icon: BarChart3,bg: 'var(--color-warning-light)', ic: '#F59E0B', label: 'Analytics & Grades', desc: 'Real-time grade tracking and CSV exports' },
            ] as const).map(({ Icon, bg, ic, label, desc }) => (
              <div key={label} style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} color={ic} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 13, color: '#A5B4FC' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────── */}
      <section style={{ padding: '88px 24px', textAlign: 'center', backgroundColor: 'var(--color-bg)' }}>
        <div style={{ maxWidth: 540, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 36, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 14 }}>
            Ready to get started?
          </h2>
          <p style={{ fontSize: 16, color: 'var(--color-text-secondary)', lineHeight: 1.75, marginBottom: 40 }}>
            Join thousands of students and teachers already using Classtory. Free to start, powerful to scale.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/auth/signup"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#4F46E5', color: '#FFFFFF', borderRadius: 10, padding: '13px 28px', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}
            >
              Create free account <ArrowRight size={16} />
            </Link>
            <Link
              href="/courses"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '13px 28px', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}
            >
              Browse courses
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer style={{ backgroundColor: '#0F172A', padding: '52px 24px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 40, marginBottom: 48 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 32, height: 32, backgroundColor: '#4F46E5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={16} color="white" />
                </div>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 18, color: '#FFFFFF' }}>Classtory</span>
              </div>
              <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.7 }}>The premium education platform for learners and teachers everywhere.</p>
            </div>

            {([
              { heading: 'Platform', links: [{ label: 'Courses', href: '/courses' }, { label: 'Classrooms', href: '/student' }, { label: 'For Teachers', href: '/for-teachers' }, { label: 'Pricing', href: '/pricing' }] },
              { heading: 'Company',  links: [{ label: 'About', href: '/about' }, { label: 'Blog', href: '/blog' }, { label: 'Careers', href: '/careers' }, { label: 'Contact', href: '/contact' }] },
              { heading: 'Legal',    links: [{ label: 'Privacy Policy', href: '/privacy' }, { label: 'Terms of Service', href: '/terms' }, { label: 'Cookie Policy', href: '/cookies' }] },
            ] as const).map(({ heading, links }) => (
              <div key={heading}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>{heading}</div>
                {links.map(item => (
                  <div key={item.label} style={{ marginBottom: 9 }}>
                    <Link href={item.href} style={{ fontSize: 13, color: '#94A3B8', textDecoration: 'none' }}>{item.label}</Link>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #1E293B', paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 13, color: '#94A3B8' }}>© 2026 Classtory. All rights reserved.</p>
            <p style={{ fontSize: 13, color: '#94A3B8' }}>Built with Next.js &amp; Supabase</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
