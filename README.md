# Classtory

A premium education platform that combines a public course marketplace (Udemy-style) with a private classroom system (Google Classroom-style).

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Database | Supabase (PostgreSQL + Auth + Storage + RLS) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Icons | lucide-react |
| Forms | react-hook-form + zod |
| Toasts | sonner |
| State | Zustand |

---

## Prerequisites

- Node.js 20+
- A Supabase project (https://supabase.com, free tier works)

---

## 1. Clone and Install

git clone <your-repo-url>
cd classtory
npm install

---

## 2. Environment Variables

Create a .env.local file in the project root:

NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

Find both values at: Supabase Dashboard > Settings > API

---

## 3. Database Setup

Run these SQL files in order inside Supabase Dashboard > SQL Editor:

Step 1 - Schema
Paste and run supabase-schema.sql
This creates all tables, indexes, RLS policies, and the handle_new_user trigger.

Step 2 - RLS Fix
Paste and run supabase-rls-fix.sql
This replaces the default policies with recursion-safe SECURITY DEFINER helper functions.

NOTE: If you have existing data, do NOT run supabase-schema.sql again - it drops all tables first.
Only run supabase-rls-fix.sql to update policies on an existing database.

---

## 4. Run the Development Server

npm run dev

Open http://localhost:3000

---

## 5. Supabase Storage Buckets

Create these buckets in Supabase Dashboard > Storage:

  avatars          (public)   - User profile pictures
  materials        (private)  - Classroom file uploads
  course-thumbnails (public)  - Course cover images

---

## 6. Admin Panel

A standalone Node.js admin panel runs separately from the Next.js app.

npm run admin

Opens http://localhost:9999 automatically.

First run: Enter your Supabase service role key when prompted.
Find it at: Supabase Dashboard > Settings > API > service_role secret

The key is saved to admin-panel.config.json (gitignored - never commit it).

---

## 7. User Roles

  student  - Browse courses, join classrooms via code, submit assignments, view own grades
  teacher  - Create classrooms and courses, manage assignments, grade submissions, take attendance
  admin    - Everything above plus user management via the admin panel

To make yourself an admin: open the Admin Panel, find your account in the Users table, change role to admin.

---

## 8. Key Pages

  /                         Landing page
  /courses                  Course marketplace
  /courses/[id]             Course detail and enroll
  /auth/login               Login
  /auth/signup              Sign up (choose role)
  /student                  Student dashboard
  /teacher                  Teacher dashboard
  /admin                    Admin dashboard
  /classroom/[id]           Classroom - Announcements, Assignments, Materials, Students
  /classroom/[id]/grades    Gradebook
  /classroom/[id]/attendance  Attendance sheet

---

## 9. Deploy to Vercel

npm i -g vercel
vercel

Add these environment variables in Vercel Dashboard > Project > Settings > Environment Variables:
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY

---

## 10. Project Structure

src/
  app/               Next.js App Router pages
    (auth)/          Login and signup routes
    (dashboard)/     Role-based dashboards (student, teacher, admin)
    classroom/[id]/  Classroom pages
    courses/         Marketplace pages
  components/
    auth/            Login and signup forms
    classroom/       Tabs, gradebook, attendance, announcements
    dashboard/       Stat cards, classroom cards
    layout/          Sidebar, navbar
    shared/          File upload, notifications, role guard
  lib/
    supabase/        Browser and server Supabase clients
    types.ts         Shared TypeScript interfaces
    utils/           Class code generator, CSV export, date formatting
  proxy.ts           Route protection (Next.js 16 middleware replacement)