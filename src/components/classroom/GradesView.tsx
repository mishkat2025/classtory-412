'use client'

import { useState } from 'react'
import { ClipboardList, LayoutGrid } from 'lucide-react'
import { Gradebook } from './Gradebook'
import { CustomGradebook, type GradeColumn, type GradeValueRow } from './CustomGradebook'
import type { AssignmentCol, StudentGradeRow } from './GradesViewTypes'

interface GradesViewProps {
  classroomId: string
  classroomName: string
  isTeacher: boolean
  // Assignment-based gradebook props
  assignments: AssignmentCol[]
  studentRows: StudentGradeRow[]
  // Custom grade sheet props
  students: { id: string; full_name: string; email: string }[]
  initialColumns: GradeColumn[]
  initialValues: GradeValueRow[]
}

type Tab = 'assignments' | 'sheet'

export function GradesView({
  classroomId,
  classroomName,
  isTeacher,
  assignments,
  studentRows,
  students,
  initialColumns,
  initialValues,
}: GradesViewProps) {
  const [tab, setTab] = useState<Tab>('sheet')

  const tabs: { id: Tab; label: string; Icon: React.ElementType }[] = [
    { id: 'sheet', label: 'Grade Sheet', Icon: LayoutGrid },
    { id: 'assignments', label: 'Assignment Grades', Icon: ClipboardList },
  ]

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #E2E8F0', paddingBottom: 0 }}>
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              height: 38, padding: '0 16px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              borderBottom: tab === id ? '2px solid #4F46E5' : '2px solid transparent',
              backgroundColor: tab === id ? '#EEF2FF' : 'transparent',
              color: tab === id ? '#4F46E5' : '#64748B',
              fontSize: 13, fontWeight: tab === id ? 600 : 500,
              cursor: 'pointer', transition: 'all 120ms ease',
              marginBottom: -1,
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'sheet' && (
        <CustomGradebook
          classroomId={classroomId}
          classroomName={classroomName}
          students={students}
          initialColumns={initialColumns}
          initialValues={initialValues}
          isTeacher={isTeacher}
        />
      )}

      {tab === 'assignments' && (
        <Gradebook
          classroomName={classroomName}
          assignments={assignments}
          students={studentRows}
          isTeacher={isTeacher}
        />
      )}
    </div>
  )
}
