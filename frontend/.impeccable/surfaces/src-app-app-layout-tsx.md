---
version: 1
slug: "src-app-app-layout-tsx"
primary_target: "src/app/(app)/layout.tsx"
related_targets: ["src/app/(auth)/login/page.tsx","src/app/globals.css"]
---

# App shell and dashboards (all signed-in routes)

Scope: the signed-in app — shell (sidebar, header, footer), dashboards for student/teacher/admin, schedule, attendance, grades, materials, profile, admin CRUD, login, and the floating AI assistant. Mode: Operate.

Audience/job: students check their own schedule, attendance and grades; teachers take attendance and grade; admins maintain the academic structure. All roles weighted equally.

Constraints: keep every route, data flow and role rule; Azerbaijani copy; Poppins (verified ə Ə); dark mode kept; AI assistant becomes a bottom-right floating launcher, `/assistant` page stays reachable from it but leaves the sidebar.

## Direction contract

THESIS: A calm, friendly campus planner — the user's pinned reference ("Lecture" LMS dashboard): soft gray-lavender ground, white working panels, one orange accent. Refuses the navy-sidebar, blue-gradient-hero admin template the old UI shipped.

OWN-WORLD: Ground #F5F6FA-ish cool gray; white cards with hairline borders and very soft shadows; orange accent (~#F26B3A) for primary actions, active nav, selection and the heading dot; pastel course tints mint / butter / lavender / rose, each paired with a saturated icon colour inside a hexagon badge; Poppins 400/500/600; pill buttons; navy-ink text.

STORY: The user lands on "their day": classes as tinted cards, today's lessons/tasks as a list with clear actions, a calendar and an Upcoming timeline at the right. They act (open a course, take attendance, read a grade) without hunting.

FIRST VIEWPORT: Left: light sidebar with wordmark + orange dot, institution/role chip, grouped nav with orange-tinted active pill, logout at bottom. Centre: page title with orange dot, tinted course/stat cards row, then the primary list. Right (dashboards, ≥xl): search/user, month calendar with today in orange, Upcoming timeline. Bottom-right: orange AI blob with idle speech bubble "Sizə necə kömək edə bilərəm?".

FORM: Pinned whole by the user, no roll. seed: none (pinned) — "redesign the website using the current structure… Similar design system, coloring and typography." + "Orange, like reference".

Signature move: the orange full-stop after every section heading, and the breathing AI blob in the corner.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
