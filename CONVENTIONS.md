# Development & Naming Conventions

This document outlines the architecture and terminology conventions used in this project to prevent breaking changes during future development by human developers or AI coding assistants.

---

## 1. UI Terminology vs. Database Schema Mapping

To make the platform more welcoming and community-focused, we use customized terms in the user interface (UI) while keeping the database tables and backend variables unchanged.

| Database Table Name | Database Entity Column/Relation | UI Display Label (Singular) | UI Display Label (Plural) |
| :--- | :--- | :--- | :--- |
| `courses` | Table / `course_id` | **Program** | **Programs** |
| `chapters` | Table / `chapter_id` | **Module** | **Modules** |

### ⚠️ Critical Rule for AI & Developers
* **DO NOT** perform global search-and-replace of "course" $\to$ "program" or "chapter" $\to$ "module".
* **Keep Database Schemas intact:** Supabase tables (`courses`, `chapters`, `course_tier_access`, etc.) and columns must always be referenced by their exact database names in any SQL migrations, prisma schemas, API endpoints, or database queries.
* **Keep API Payload Keys intact:** Do not change properties returned by Next.js Server Actions or API routes (e.g., `course.id`, `chapters: []`), as the frontend state and other parts of the application rely on these exact property names.
* **Only Change User-Facing UI Labels:** Only update text content, button labels, headers, placeholder texts, and descriptive text displayed directly to the end user.

---

## 2. Routing Conventions

The project uses Next.js App Router. Be aware of the following routing structure:

1. **Student / Global Routes (`src/app/(dashboard)/(student)`)**:
   - The route group `(student)` is omitted from the URL path.
   - **Global Settings Page** is located at `src/app/(dashboard)/(student)/settings/page.tsx` $\to$ accessible via `/settings`.
   - **Student Dashboard** is at `src/app/(dashboard)/(student)/dashboard/page.tsx` $\to$ accessible via `/dashboard`.
   - **Student Courses** is at `src/app/(dashboard)/(student)/courses/page.tsx` $\to$ accessible via `/courses`.

2. **Instructor Routes (`src/app/(dashboard)/instructor`)**:
   - Accessible via `/instructor/...`.
   - Note: Instructors use the global `/settings` page for their preferences (theme, notification configs) rather than a separate `/instructor/settings` route.

3. **Admin Routes (`src/app/(dashboard)/admin`)**:
   - Accessible via `/admin/...`.
   - Admin settings are located at `/admin/settings`.
   - Audit logs page is at `/admin/audit-logs` and queries the `admin_audit_log` table (columns: `admin_id`, `resource_type`, `resource_id`, etc.).

---

## 3. Stability Verification Checklist

Before committing any changes:
1. **Never skip type safety checks**: Ensure no TypeScript errors are introduced.
2. **Run production build locally**:
   ```bash
   npx next build
   ```
   This ensures Next.js verifies page generation, dynamic imports, and compilation constraints.
3. **Verify Dynamic Imports**: When using `next/dynamic` or importing sub-components, verify that the module exports (e.g. `mod.CoursesList`) exist and are mapped correctly.
