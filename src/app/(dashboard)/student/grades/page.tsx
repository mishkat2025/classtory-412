import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BarChart3, BookOpen, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'

/* ─── Types ──────────────────────────────────────────────────── */

interface SubmissionRow {
  assignment_id: string
  grade: number | null
  status: string
  submitted_at: string
  assignment: {
    id: string
    title: string
    max_points: number
    classroom_id: string
    due_date: string
  } | null
}

interface ClassroomRow {
  id: string
  name: string
  subject: string
  cover_color: string
  teacher: { full_name: string } | null
}

interface CourseGrade {
  assignmentId: string
  title: string
  maxPoints: number
  grade: number
  pct: number
  submittedAt: string
  dueDate: string
}

interface ClassroomGrades {
  classroom: ClassroomRow
  grades: CourseGrade[]
  average: number | null
}

/* ─── Page ───────────────────────────────────────────────────── */

export default async function StudentGradesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profileData) redirect('/auth/login')
  const profile = profileData as Profile
  if (profile.role !== 'student') redirect(`/${profile.role}`)

  /* Classrooms */
  const { data: enrollmentData } = await supabase
    .from('enrollments')
    .select('classroom:classrooms(id, name, subject, cover_color, teacher:profiles(full_name))')
    .eq('student_id', user.id)

  const classrooms = ((enrollmentData ?? [])
    .map(e => (e as { classroom: ClassroomRow | null }).classroom)
    .filter((c): c is ClassroomRow => c !== null))

  /* All graded submissions with assignment info */
  const { data: submissionData } = await supabase
    .from('submissions')
    .select('assignment_id, grade, status, submitted_at, assignment:assignments(id, title, max_points, classroom_id, due_date)')
    .eq('student_id', user.id)
    .not('grade', 'is', null)
    .order('submitted_at', { ascending: false })

  const submissions = (submissionData ?? []) as unknown as SubmissionRow[]

  /* Group by classroom */
  const classroomMap = new Map<string, ClassroomGrades>()
  for (const cls of classrooms) {
    classroomMap.set(cls.id, { classroom: cls, grades: [], average: null })
  }

  for (const sub of submissions) {
    if (!sub.assignment || sub.grade == null) continue
    const { classroom_id } = sub.assignment
    if (!classroomMap.has(classroom_id)) continue
    classroomMap.get(classroom_id)!.grades.push({
      assignmentId: sub.assignment.id,
      title: sub.assignment.title,
      maxPoints: sub.assignment.max_points,
      grade: sub.grade,
      pct: Math.round((sub.grade / sub.assignment.max_points) * 100),
      submittedAt: sub.submitted_at,
      dueDate: sub.assignment.due_date,
    })
  }

  /* Compute per-classroom average */
  const classroomGrades: ClassroomGrades[] = []
  for (const entry of classroomMap.values()) {
    if (entry.grades.length > 0) {
      entry.average = Math.round(
        entry.grades.reduce((s, g) => s + g.pct, 0) / entry.grades.length
      )
    }
    classroomGrades.push(entry)
  }

  /* Sort: classrooms with grades first */
  classroomGrades.sort((a, b) => b.grades.length - a.grades.length)

  /* Overall average */
  const allGrades = classroomGrades.flatMap(c => c.grades)
  const overallAvg = allGrades.length > 0
    ? Math.round(allGrades.reduce((s, g) => s + g.pct, 0) / allGrades.length)
    : null

  const gradeLetter = (pct: number) =>
    pct >= 80 ? 'A+' : pct >= 75 ? 'A' : pct >= 70 ? 'A-' :
    pct >= 65 ? 'B+' : pct >= 60 ? 'B'  : pct >= 55 ? 'B-' :
    pct >= 50 ? 'C+' : pct >= 45 ? 'C'  : pct >= 40 ? 'D'  : 'F'
  const gradeColor = (pct: number) => pct >= 65 ? '#065F46' : pct >= 40 ? '#92400E' : '#991B1B'
  const gradeBg    = (pct: number) => pct >= 65 ? '#D1FAE5' : pct >= 40 ? '#FEF3C7' : '#FEE2E2'

  return (
    <div style={{ padding: '28px 28px 48px', maxWidth: 1000, width: '100%' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart3 size={18} color="#2563EB" />
          </div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
            My Grades
          </h1>
        </div>
        <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 0 46px' }}>
          Grades from all your classrooms in one place
        </p>
      </div>

      {/* ── Overall summary ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 32 }}>
        {[
          { label: 'Classrooms',      value: classrooms.length,          bg: '#EEF2FF', color: '#3730A3' },
          { label: 'Graded Work',     value: allGrades.length,            bg: '#D1FAE5', color: '#065F46' },
          { label: 'Overall Average', value: overallAvg != null ? `${overallAvg}%` : '—', bg: overallAvg == null ? '#F1F5F9' : gradeBg(overallAvg), color: overallAvg == null ? '#64748B' : gradeColor(overallAvg) },
        ].map(({ label, value, bg, color }) => (
          <div key={label} style={{ backgroundColor: bg, borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</div>
            <div style={{ fontSize: 12, color, opacity: 0.8, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── No classrooms ── */}
      {classrooms.length === 0 && (
        <div style={{ backgroundColor: '#FFFFFF', border: '2px dashed #E2E8F0', borderRadius: 14, padding: '56px 24px', textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <BookOpen size={28} color="#A5B4FC" />
          </div>
          <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 8px 0' }}>
            No classrooms yet
          </h3>
          <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 20px 0' }}>
            Join a classroom to see your grades here.
          </p>
          <Link href="/student/join" style={{ display: 'inline-flex', alignItems: 'center', height: 38, padding: '0 20px', backgroundColor: '#4F46E5', color: '#FFFFFF', borderRadius: 8, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
            Join a class
          </Link>
        </div>
      )}

      {/* ── Per-classroom cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {classroomGrades.map(({ classroom, grades, average }) => (
          <div
            key={classroom.id}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            {/* Card header */}
            <div style={{
              borderLeft: `6px solid ${classroom.cover_color ?? '#4F46E5'}`,
              padding: '16px 20px',
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
              backgroundColor: '#FAFBFC',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    {classroom.name}
                  </h2>
                  <span style={{ fontSize: 12, color: '#64748B', backgroundColor: '#F1F5F9', borderRadius: 9999, padding: '1px 8px' }}>
                    {classroom.subject}
                  </span>
                </div>
                {classroom.teacher && (
                  <p style={{ fontSize: 12, color: '#94A3B8', margin: '3px 0 0 0' }}>
                    {classroom.teacher.full_name}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {average != null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TrendingUp size={14} color={gradeColor(average)} />
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: gradeColor(average), fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1 }}>
                        {average}%
                      </div>
                      <div style={{ fontSize: 10, color: '#94A3B8', lineHeight: 1, marginTop: 2 }}>
                        avg · {grades.length} graded
                      </div>
                    </div>
                    <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: gradeBg(average), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 800, color: gradeColor(average) }}>
                        {gradeLetter(average)}
                      </span>
                    </div>
                  </div>
                )}
                <Link
                  href={`/classroom/${classroom.id}/grades`}
                  style={{ fontSize: 12, color: '#4F46E5', textDecoration: 'none', fontWeight: 600, backgroundColor: '#EEF2FF', borderRadius: 7, padding: '5px 10px', whiteSpace: 'nowrap' }}
                >
                  Full gradebook →
                </Link>
              </div>
            </div>

            {/* Grade table */}
            {grades.length === 0 ? (
              <div style={{ padding: '28px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>
                  No graded assignments yet for this classroom.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC' }}>
                      {['Assignment', 'Due', 'Score', 'Grade', ''].map(h => (
                        <th key={h} style={{
                          padding: '8px 16px',
                          textAlign: h === 'Score' || h === 'Grade' || h === '' ? 'center' : 'left',
                          fontSize: 11, fontWeight: 700, color: '#64748B',
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                          borderBottom: '1px solid #F1F5F9',
                          whiteSpace: 'nowrap',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((g, i) => (
                      <tr
                        key={g.assignmentId}
                        style={{ borderBottom: i < grades.length - 1 ? '1px solid #F9FAFB' : 'none' }}
                      >
                        {/* Assignment title */}
                        <td style={{ padding: '11px 16px', maxWidth: 280 }}>
                          <Link
                            href={`/classroom/${classroom.id}/assignment/${g.assignmentId}`}
                            style={{ textDecoration: 'none' }}
                          >
                            <p style={{ fontSize: 13, fontWeight: 500, color: '#0F172A', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {g.title}
                            </p>
                          </Link>
                        </td>

                        {/* Due date */}
                        <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: 12, color: '#64748B' }}>
                            {new Date(g.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </td>

                        {/* Raw score */}
                        <td style={{ padding: '11px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                            {g.grade}
                            <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 400 }}>/{g.maxPoints}</span>
                          </span>
                        </td>

                        {/* Percentage badge */}
                        <td style={{ padding: '11px 16px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            minWidth: 52, height: 26,
                            backgroundColor: gradeBg(g.pct), color: gradeColor(g.pct),
                            fontSize: 12, fontWeight: 700, borderRadius: 8,
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                          }}>
                            {g.pct}%
                          </span>
                        </td>

                        {/* Letter grade */}
                        <td style={{ padding: '11px 16px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: 28, height: 28, borderRadius: 7,
                            backgroundColor: gradeBg(g.pct), color: gradeColor(g.pct),
                            fontSize: 13, fontWeight: 800,
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                          }}>
                            {gradeLetter(g.pct)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
