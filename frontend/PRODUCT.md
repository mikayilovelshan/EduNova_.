# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Three roles at a university, weighted equally (confirmed):

- **Students** check their own timetable, attendance, grades and exam results, download course materials, and ask the AI assistant about their own records. They only ever see their own data.
- **Teachers** take and edit attendance for their lessons, enter grades for their own course offerings, and upload materials.
- **Administrators** manage the academic structure (faculties, departments, specialities, semesters, groups, courses, course offerings, schedules) and the people in it (students, teachers, administrators).

## Product Purpose

UniLMS is a university learning-management portal: timetable, attendance journal, gradebook, course materials and an AI assistant in one place, each scoped to the signed-in person's role. Success means a student can answer "where am I, how am I doing, what's next" in seconds, and a teacher can finish attendance or grading for a lesson without friction.

## Positioning

A product meant to serve many universities (confirmed), not a single institution's bespoke portal. Institution branding must stay neutral and swappable. It follows the Azerbaijani grading model natively (see Capabilities).

## Operating Context

- Used daily during the semester: students between lessons (often on phones), teachers in or right after a lesson, administrators at a desk at semester setup.
- The active semester frames everything; schedules are weekly (Monday–Saturday) with fixed lesson times.
- The AI assistant (SiriUs, Gemini-backed) answers only from the asking user's own data.

## Capabilities and Constraints

- **Language:** the entire UI is Azerbaijani. Every font must contain ə Ə ğ ı İ ş ç ö ü.
- **Grading model:** activity scores max 10 each; final exam max 50; entry score = attendance (max 10) + activities, capped at 50; pass needs total ≥ 51 and final ≥ 17; letters A ≥ 91, B ≥ 81, C ≥ 71, D ≥ 61, E ≥ 51, otherwise F.
- **Roles:** Student is view-only and sees only their own records; Teacher only their own course offerings; Admin everything.
- **Stack:** Next.js 16 frontend (BFF cookie auth) in front of a .NET 10 API; routes and API contracts are preserved across redesigns.
- **AI assistant entry point:** a floating chat launcher in the bottom-right corner on every app page; the full `/assistant` page remains reachable from the launcher but is no longer in the sidebar (confirmed).

## Evidence on Hand

- Development seed data only (demo students, teachers, courses). No real institution names, logos, testimonials or statistics exist; do not invent them.

## Product Principles

1. Own data first: every screen answers the signed-in person's question about their own lessons, records or courses before anything else.
2. One product, three roles: student, teacher and admin screens share one language and component set; density changes, the identity does not.
3. Native Azerbaijani, not translated: copy, dates, day names and typography are correct for Azerbaijani from the start.
4. Institution-neutral: nothing hard-codes a specific university's identity.

## Accessibility & Inclusion

No product-specific requirement established beyond WCAG 2.1 AA as a working baseline.
