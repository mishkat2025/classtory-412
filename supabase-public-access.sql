-- ============================================================
-- CLASSTORY — PUBLIC (ANON) READ ACCESS
-- Run this in Supabase Dashboard → SQL Editor
-- Allows logged-out visitors to read public marketplace data
-- without touching any existing authenticated policies.
-- ============================================================

-- ── courses (marketplace listings are inherently public) ────
-- Drop the old anon policy if it exists from a previous run
DROP POLICY IF EXISTS "courses_anon_select" ON public.courses;

CREATE POLICY "courses_anon_select" ON public.courses
  FOR SELECT TO anon
  USING (true);

-- ── profiles (needed for aggregate counts: students, teachers) ──
-- Only the count is used on the homepage; no individual rows
-- are rendered for anonymous visitors.
DROP POLICY IF EXISTS "profiles_anon_select" ON public.profiles;

CREATE POLICY "profiles_anon_select" ON public.profiles
  FOR SELECT TO anon
  USING (true);
