import Link from 'next/link'
import { BookOpen, GraduationCap, BarChart3, Users, FolderOpen } from 'lucide-react'

export const metadata = { title: 'For Teachers — Classtory' }

export default function ForTeachersPage() {
  return (
    <div style={{ backgroundColor: '#F8F9FC', minHeight: '100vh' }}>
      <nav style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 30, height: 30, backgroundColor: '#4F46E5', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={14} color="white" />
          </div>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 16, color: '#0F172A' }}>Classtory</span>
        </Link>
        <Link href="/" style={{ fontSize: 13, color: '#64748B', textDecoration: 'none' }}>← Back to home</Link>
      </nav>

      <div style={{ backgroundColor: '#1E1B4B', padding: '72px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 40, fontWeight: 800, color: '#FFFFFF', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
          Built for Teachers
        </h1>
        <p style={{ fontSize: 16, color: '#A5B4FC', maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.7 }}>
          Everything you need to manage your classrooms, grade assignments, track attendance, and publish courses — all in one place.
        </p>
        <Link href="/auth/signup" style={{ display: 'inline-flex', alignItems: 'center', height: 44, padding: '0 28px', backgroundColor: '#4F46E5', color: '#FFFFFF', borderRadius: 10, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
          Start teaching for free
        </Link>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '56px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          {[
            { icon: Users,         color: '#EEF2FF', iconColor: '#4F46E5', title: 'Private Classrooms',  desc: 'Create classrooms and invite students with a simple class code.' },
            { icon: BarChart3,     color: '#D1FAE5', iconColor: '#10B981', title: 'Gradebook & Reports', desc: 'Track grades, export CSV sheets, and give detailed feedback.' },
            { icon: FolderOpen,    color: '#FEF3C7', iconColor: '#F59E0B', title: 'Materials Library',   desc: 'Upload and share files, PDFs, and resources with your class.' },
            { icon: GraduationCap, color: '#DBEAFE', iconColor: '#3B82F6', title: 'Course Marketplace',  desc: 'Publish courses publicly and reach learners beyond your classroom.' },
          ].map(({ icon: Icon, color, iconColor, title, desc }) => (
            <div key={title} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '24px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Icon size={18} color={iconColor} />
              </div>
              <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>{title}</h3>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <Link href="/auth/signup" style={{ display: 'inline-flex', alignItems: 'center', height: 42, padding: '0 24px', backgroundColor: '#4F46E5', color: '#FFFFFF', borderRadius: 9, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            Create a free teacher account →
          </Link>
        </div>
      </div>
    </div>
  )
}
