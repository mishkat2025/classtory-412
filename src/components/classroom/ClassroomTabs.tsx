'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Megaphone,
  ClipboardList,
  FolderOpen,
  Users,
  Copy,
  Check,
  ArrowLeft,
  UserCheck,
} from 'lucide-react'
import { AnnouncementFeed } from './AnnouncementFeed'
import { AssignmentList } from './AssignmentList'
import { MaterialsList } from './MaterialsList'
import { StudentList } from './StudentList'
import type {
  ClassroomFull,
  AnnouncementFull,
  AssignmentWithMeta,
  MaterialFull,
  StudentEnrollment,
} from './types'
import type { Profile } from '@/lib/types'

interface ClassroomTabsProps {
  classroom: ClassroomFull
  profile: Profile
  isTeacher: boolean
  initialAnnouncements: AnnouncementFull[]
  assignments: AssignmentWithMeta[]
  materials: MaterialFull[]
  enrollments: StudentEnrollment[]
  gradeColumnAssignmentIds: Set<string>
}

const TABS = [
  { id: 'announcements', label: 'Announcements', Icon: Megaphone },
  { id: 'assignments',   label: 'Assignments',   Icon: ClipboardList },
  { id: 'materials',     label: 'Materials',      Icon: FolderOpen },
  { id: 'students',      label: 'Students',       Icon: Users },
] as const

type TabId = typeof TABS[number]['id']

export function ClassroomTabs({
  classroom,
  profile,
  isTeacher,
  initialAnnouncements,
  assignments,
  materials,
  enrollments,
  gradeColumnAssignmentIds,
}: ClassroomTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('announcements')
  const [codeCopied, setCodeCopied] = useState(false)

  const totalStudents = enrollments.filter(e => e.student !== null).length
  const backHref = profile.role === 'teacher' ? '/teacher' : '/student'

  function copyCode() {
    navigator.clipboard.writeText(classroom.class_code).then(() => {
      setCodeCopied(true)
      toast.success('Class code copied!')
      setTimeout(() => setCodeCopied(false), 2000)
    })
  }

  const color = classroom.cover_color || '#4F46E5'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* ── Classroom header ─────────────────────────────────── */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderBottom: '1px solid #E2E8F0',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        {/* Colour accent strip */}
        <div style={{ height: 4, background: `linear-gradient(90deg, ${color} 0%, ${color}99 100%)` }} />

        {/* Header content */}
        <div style={{ padding: '16px 28px 0' }}>
          {/* Back + attendance row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <Link
              href={backHref}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 13,
                color: 'var(--color-text-secondary)',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              <ArrowLeft size={14} />
              Dashboard
            </Link>

            {isTeacher && (
              <div style={{ display: 'flex', gap: 8 }}>
                <Link
                  href={`/classroom/${classroom.id}/grades`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    height: 34,
                    padding: '0 12px',
                    backgroundColor: 'var(--color-surface-2)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  <ClipboardList size={14} color="#4F46E5" />
                  Grades
                </Link>
                <Link
                  href={`/classroom/${classroom.id}/attendance`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    height: 34,
                    padding: '0 12px',
                    backgroundColor: 'var(--color-surface-2)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  <UserCheck size={14} color="#4F46E5" />
                  Attendance
                </Link>
              </div>
            )}
          </div>

          {/* Title row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
              marginBottom: 14,
            }}
          >
            <div>
              {/* Subject chip */}
              <span
                style={{
                  display: 'inline-block',
                  fontSize: 11,
                  fontWeight: 700,
                  color: color,
                  backgroundColor: `${color}18`,
                  borderRadius: 9999,
                  padding: '2px 10px',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {classroom.subject}
              </span>

              <h1
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 22,
                  fontWeight: 800,
                  color: 'var(--color-text-primary)',
                  margin: '0 0 4px 0',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}
              >
                {classroom.name}
              </h1>

              {classroom.teacher && (
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
                  by {classroom.teacher.full_name}
                  {' · '}
                  <span style={{ color: 'var(--color-text-muted)' }}>
                    {totalStudents} {totalStudents === 1 ? 'student' : 'students'}
                  </span>
                </p>
              )}
            </div>

            {/* Class code (teacher only) */}
            {isTeacher && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  flexShrink: 0,
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: 'var(--color-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      margin: '0 0 2px 0',
                    }}
                  >
                    Class Code
                  </p>
                  <span
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 18,
                      fontWeight: 800,
                      color: '#4F46E5',
                      letterSpacing: '0.1em',
                    }}
                  >
                    {classroom.class_code}
                  </span>
                </div>
                <button
                  onClick={copyCode}
                  title="Copy class code"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: codeCopied ? '#D1FAE5' : '#EEF2FF',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 150ms ease',
                    flexShrink: 0,
                  }}
                >
                  {codeCopied ? (
                    <Check size={15} color="#059669" />
                  ) : (
                    <Copy size={15} color="#4F46E5" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Tab nav */}
          <div style={{ display: 'flex', gap: 0, marginTop: 4 }}>
            {TABS.map(({ id, label, Icon }) => {
              const active = activeTab === id
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    height: 44,
                    padding: '0 16px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: active
                      ? '2px solid #4F46E5'
                      : '2px solid transparent',
                    color: active ? '#4F46E5' : '#475569',
                    fontSize: 14,
                    fontWeight: active ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'color 120ms ease, border-color 120ms ease',
                    whiteSpace: 'nowrap',
                    marginBottom: -1,
                  }}
                  onMouseEnter={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--color-text-primary)'
                  }}
                  onMouseLeave={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)'
                  }}
                >
                  <Icon size={15} />
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Tab content ──────────────────────────────────────── */}
      <div style={{ flex: 1, padding: '24px 28px 40px' }}>
        {activeTab === 'announcements' && (
          <AnnouncementFeed
            initialAnnouncements={initialAnnouncements}
            classroom_id={classroom.id}
            profile={profile}
          />
        )}

        {activeTab === 'assignments' && (
          <AssignmentList
            initialAssignments={assignments}
            classroom_id={classroom.id}
            isTeacher={isTeacher}
            profile={profile}
            totalStudents={totalStudents}
            gradeColumnAssignmentIds={gradeColumnAssignmentIds}
          />
        )}

        {activeTab === 'materials' && (
          <MaterialsList
            initialMaterials={materials}
            classroom_id={classroom.id}
            isTeacher={isTeacher}
            profile={profile}
          />
        )}

        {activeTab === 'students' && (
          <StudentList
            enrollments={enrollments}
            isTeacher={isTeacher}
            teacherId={classroom.teacher_id}
          />
        )}
      </div>
    </div>
  )
}
