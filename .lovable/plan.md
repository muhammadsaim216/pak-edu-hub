

# EduPDF Pakistan — Academic Resource Portal

## Overview
A full-stack academic PDF repository for Pakistani students and educators. Students browse and download PDFs filtered by Education Level (BCS, BEE, BCE, etc.). Teachers upload and manage their own materials via a private dashboard. Admins moderate everything.

---

## Pages & Features

### 1. Home Page
- Sticky navbar with logo, navigation links, Education Levels dropdown, and Auth buttons
- Hero section: headline ("Access Pakistan's largest archive of verified academic PDFs"), global search bar (L1 magnet), and a subtle background
- Featured Education Levels displayed as a dense card grid (e.g., BCS, BEE, BCE) linking to the filtered library
- Footer with minimal links

### 2. Library Page
- **Desktop:** Left sidebar (`w-64`) listing all Education Levels as filterable links; **Mobile:** horizontal scrolling chip-bar
- Real-time search bar at the top of the content area
- PDF card grid (`grid-cols-1 sm:2 lg:3 xl:4`): each card shows file-type icon, title (2-line clamp), education level badge, author initials, file size, and upload date in mono font
- Click a card → PDF detail view or direct download
- Skeleton loading states for the grid (no full-screen loaders)

### 3. Auth System (Login / Signup)
- Login page with email + password
- Signup page with email, password, and a "Register as Teacher" checkbox/toggle
- Password reset flow with dedicated `/reset-password` route
- Supabase Auth with RLS; roles stored in a separate `user_roles` table (student default, teacher on request)

### 4. Teacher Dashboard (Protected Route)
- Summary stats: total uploads, downloads (if tracked)
- Table of teacher's own uploads: Title, Education Level, Upload Date, Actions (Edit / Delete)
- "Upload PDF" button (L1 magnet) → opens upload modal

### 5. Upload Flow (Teacher Only)
- Modal with: file dropzone (dashed border, drag-over highlight), Title input, Description textarea, Education Level dropdown
- Uploads file to Supabase Storage bucket, creates record in `pdf_materials` table
- Success toast on completion

### 6. Admin Dashboard (Protected Route)
- Manage Education Levels: CRUD (add, edit, delete categories)
- User management table: view users, assign/revoke teacher role
- Global file moderation: view all PDFs, delete inappropriate content

---

## Database Schema (Supabase / Lovable Cloud)

### Tables
- **education_levels**: `id`, `name`, `slug`, `description`, `created_at`
- **pdf_materials**: `id`, `title`, `description`, `file_url`, `file_size`, `education_level_id` (FK), `author_id` (FK to auth.users), `uploaded_at`
- **profiles**: `id` (FK to auth.users), `full_name`, `avatar_url`, `created_at`
- **user_roles**: `id`, `user_id` (FK to auth.users), `role` (enum: admin, teacher, user)

### Storage
- `pdfs` bucket (public read, authenticated teacher write via RLS)

### RLS Policies
- Students/guests: read access to `education_levels` and `pdf_materials`
- Teachers: insert/update/delete own rows in `pdf_materials`; upload to storage
- Admins: full access via `has_role()` security definer function

---

## Design System
- **Fonts:** IBM Plex Sans (headings/body) + IBM Plex Mono (metadata)
- **Colors:** Primary Blue `#2563eb`, Slate-950 foreground, Slate-50 background
- **Cards:** White bg, `ring-1 ring-slate-900/5`, subtle shadow, `rounded-[10px]`
- **Density:** `text-sm` body, compact grid with `gap-6`, minimal whitespace
- **Motion:** 150ms hover transitions, 300ms modal entries
- **Mobile-first:** responsive grid, collapsible sidebar → chip-bar on mobile

