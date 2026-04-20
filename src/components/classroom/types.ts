export interface ClassroomFull {
  id: string
  name: string
  subject: string
  class_code: string
  teacher_id: string
  cover_color: string
  created_at: string
  teacher: { full_name: string; avatar_url: string | null } | null
}

export interface AnnouncementFull {
  id: string
  classroom_id: string
  author_id: string
  content: string
  created_at: string
  author: { full_name: string; avatar_url: string | null; role: string } | null
}

export interface AssignmentWithMeta {
  id: string
  classroom_id: string
  title: string
  description: string
  due_date: string
  max_points: number
  created_at: string
  submission_count: number
  student_submission: { status: string; grade: number | null } | null
}

export interface MaterialFull {
  id: string
  classroom_id: string
  title: string
  file_url: string
  file_type: string
  file_size: number | null
  uploaded_by: string
  created_at: string
  uploader: { full_name: string } | null
}

export interface StudentEnrollment {
  id: string
  student_id: string
  enrolled_at: string
  student: {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
  } | null
}
