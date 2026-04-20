interface GradeRow {
  student_name: string
  student_email: string
  assignment_title: string
  max_points: number
  grade: number | null
  feedback: string | null
  submitted: boolean
  status: string
}

export function buildGradeCsv(rows: GradeRow[], classroomName: string): string {
  const headers = ['Student Name', 'Email', 'Assignment', 'Max Points', 'Grade', 'Percentage', 'Status', 'Feedback']
  const lines: string[] = [headers.join(',')]

  for (const row of rows) {
    const pct = row.grade !== null && row.max_points > 0
      ? ((row.grade / row.max_points) * 100).toFixed(1)
      : ''

    lines.push([
      csvCell(row.student_name),
      csvCell(row.student_email),
      csvCell(row.assignment_title),
      row.max_points,
      row.grade ?? '',
      pct,
      csvCell(row.status),
      csvCell(row.feedback ?? ''),
    ].join(','))
  }

  return lines.join('\n')
}

function csvCell(value: string | number): string {
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
