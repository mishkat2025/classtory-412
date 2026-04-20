// Shared types used between GradesView and the page
export interface AssignmentCol {
  id: string
  title: string
  max_points: number
}

export interface StudentGradeRow {
  student_id: string
  student_name: string
  student_email: string
  grades: Record<string, { grade: number | null; feedback: string; submissionId: string | null; status: string }>
}
