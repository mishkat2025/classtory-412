export type UserRole = 'student' | 'teacher' | 'admin'
export type AttendanceStatus = 'present' | 'absent' | 'late'
export type SubmissionStatus = 'submitted' | 'graded' | 'late'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: UserRole
  avatar_url?: string
  created_at: string
}

export interface Course {
  id: string
  title: string
  description: string
  thumbnail_url?: string
  category: string
  instructor_id: string
  instructor?: Profile
  rating: number
  student_count: number
  price: number
  tags: string[]
  created_at: string
}

export interface Classroom {
  id: string
  name: string
  subject: string
  class_code: string
  teacher_id: string
  teacher?: Profile
  cover_color: string
  created_at: string
}

export interface Enrollment {
  id: string
  classroom_id: string
  student_id: string
  enrolled_at: string
}

export interface Assignment {
  id: string
  classroom_id: string
  title: string
  description: string
  due_date: string
  max_points: number
  created_at: string
}

export interface Submission {
  id: string
  assignment_id: string
  student_id: string
  student?: Profile
  file_url?: string
  text_content?: string
  grade?: number
  feedback?: string
  status: SubmissionStatus
  submitted_at: string
}

export interface Material {
  id: string
  classroom_id: string
  title: string
  file_url: string
  file_type: string
  file_size?: number
  uploaded_by: string
  created_at: string
}

export interface Announcement {
  id: string
  classroom_id: string
  author_id: string
  author?: Profile
  content: string
  created_at: string
}

export interface Attendance {
  id: string
  classroom_id: string
  student_id: string
  student?: Profile
  date: string
  status: AttendanceStatus
}

export interface Notification {
  id: string
  user_id: string
  message: string
  link?: string
  is_read: boolean
  created_at: string
}

export interface Grade {
  student_id: string
  student?: Profile
  assignment_id: string
  assignment?: Assignment
  grade?: number
  feedback?: string
  submitted: boolean
}
