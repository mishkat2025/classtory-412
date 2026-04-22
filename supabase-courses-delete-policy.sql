-- ============================================================
-- CLASSTORY — ADD MISSING DELETE POLICY FOR COURSES
-- Run this in Supabase Dashboard → SQL Editor
--
-- Root cause: the `courses` table had no DELETE policy.
-- With RLS enabled and no matching policy, Supabase silently
-- blocks the DELETE (returns no error, 0 rows affected).
-- ============================================================

DROP POLICY IF EXISTS "courses_delete" ON public.courses;

CREATE POLICY "courses_delete" ON public.courses
  FOR DELETE TO authenticated
  USING (instructor_id = auth.uid());
