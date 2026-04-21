-- ─── Schedule Items Table ────────────────────────────────────────────
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS schedule_items (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id uuid       REFERENCES classrooms(id) ON DELETE CASCADE,
  teacher_id   uuid       NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title        text       NOT NULL,
  description  text       NOT NULL DEFAULT '',
  event_date   timestamptz NOT NULL,
  type         text       NOT NULL DEFAULT 'custom'
                          CHECK (type IN ('exam', 'assignment', 'class', 'custom')),
  created_at   timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE schedule_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Teachers manage own schedule_items" ON schedule_items;
DROP POLICY IF EXISTS "Students view schedule_items for enrolled classrooms" ON schedule_items;

-- Teachers can fully manage schedule items they own
CREATE POLICY "Teachers manage own schedule_items"
  ON schedule_items FOR ALL
  USING (teacher_id = auth.uid());

-- Students can read schedule items for their enrolled classrooms
CREATE POLICY "Students view schedule_items for enrolled classrooms"
  ON schedule_items FOR SELECT
  USING (
    classroom_id IN (
      SELECT classroom_id FROM enrollments WHERE student_id = auth.uid()
    )
    OR teacher_id = auth.uid()
  );
