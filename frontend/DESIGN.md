---
name: UniLMS
description: A calm, friendly campus planner for students, teachers and administrators, in Azerbaijani.
colors:
  ground: "oklch(0.972 0.006 275)"
  surface: "oklch(1 0 0)"
  ink: "oklch(0.24 0.025 270)"
  ink-muted: "oklch(0.53 0.03 270)"
  sidebar-ink: "oklch(0.42 0.025 270)"
  hairline: "oklch(0.925 0.008 275)"
  field-stroke: "oklch(0.9 0.01 275)"
  muted-wash: "oklch(0.966 0.006 275)"
  ember-orange: "oklch(0.645 0.19 40)"
  ember-ink: "oklch(0.55 0.17 40)"
  ember-wash: "oklch(0.965 0.03 45)"
  destructive: "oklch(0.58 0.21 22)"
  success: "oklch(0.6 0.13 165)"
  warning: "oklch(0.78 0.15 80)"
  info: "oklch(0.64 0.12 240)"
  mint: "oklch(0.958 0.038 172)"
  mint-mark: "oklch(0.66 0.12 172)"
  mint-ink: "oklch(0.4 0.08 172)"
  butter: "oklch(0.972 0.05 95)"
  butter-mark: "oklch(0.8 0.15 82)"
  butter-ink: "oklch(0.46 0.09 70)"
  lavender: "oklch(0.955 0.03 285)"
  lavender-mark: "oklch(0.6 0.16 285)"
  lavender-ink: "oklch(0.42 0.13 285)"
  peach: "oklch(0.962 0.03 45)"
  peach-mark: "oklch(0.68 0.17 42)"
  peach-ink: "oklch(0.48 0.13 40)"
  sky: "oklch(0.958 0.03 235)"
  sky-mark: "oklch(0.64 0.13 238)"
  sky-ink: "oklch(0.42 0.1 240)"
  rose: "oklch(0.962 0.025 5)"
  rose-mark: "oklch(0.64 0.17 8)"
  rose-ink: "oklch(0.46 0.14 8)"
typography:
  display:
    fontFamily: "Poppins, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.6rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Poppins, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.85rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Poppins, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.2rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title-sm:
    fontFamily: "Poppins, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.92rem"
    fontWeight: 600
    lineHeight: 1.375
  body:
    fontFamily: "Poppins, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Poppins, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.35
  code:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.82rem"
    fontWeight: 400
    fontFeature: "\"tnum\""
rounded:
  sm: "0.45rem"
  md: "0.6rem"
  lg: "0.75rem"
  xl: "1.05rem"
  2xl: "1.35rem"
  3xl: "1.65rem"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "20px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.ember-orange}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "0 16px"
    height: "36px"
  button-soft:
    backgroundColor: "{colors.ember-wash}"
    textColor: "{colors.ember-ink}"
    rounded: "{rounded.full}"
    padding: "0 16px"
    height: "36px"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "0 16px"
    height: "36px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.2xl}"
    padding: "20px"
  course-card:
    backgroundColor: "{colors.mint}"
    textColor: "{colors.mint-ink}"
    rounded: "{rounded.2xl}"
    padding: "20px 16px 16px"
  stat-card:
    backgroundColor: "{colors.peach}"
    textColor: "{colors.peach-ink}"
    rounded: "{rounded.2xl}"
    padding: "16px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "4px 12px"
    height: "36px"
  nav-item:
    textColor: "{colors.sidebar-ink}"
    rounded: "{rounded.xl}"
    padding: "0 12px"
    height: "36px"
  nav-item-active:
    backgroundColor: "{colors.ember-wash}"
    textColor: "{colors.ember-ink}"
    rounded: "{rounded.xl}"
  status-pill-live:
    backgroundColor: "{colors.ember-orange}"
    textColor: "{colors.surface}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  status-pill-upcoming:
    backgroundColor: "{colors.ember-wash}"
    textColor: "{colors.ember-ink}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
---

# Design System: UniLMS

## Overview

**Creative North Star: "The Calm Campus Planner"**

UniLMS reads like a well-kept paper planner laid on a cool desk. A soft grey-lavender ground holds one white working panel inset beside a light sidebar; inside the panel, pale pastel tiles carry each course, and a single ember-orange accent marks the one thing that matters on the screen: the primary action, the active place, today's date, and the full stop after every title. Nothing shouts. Density is moderate: dashboards breathe, while gradebooks and admin tables tighten without changing identity.

The world is friendly rather than institutional. Rounded geometry (pill buttons, generously rounded cards, soft hexagon badges), Poppins throughout, navy-ink text instead of black, and shadows so diffuse they read as air rather than elevation. It deliberately refuses the navy-sidebar, blue-gradient-hero admin template the product shipped before. The same language serves students, teachers and administrators; only density changes. Everything is written in Azerbaijani, and every face carries ə Ə ğ ı İ ş ç ö ü.

Two signatures make it recognisable: the orange full stop that closes every page and section title, and SiriUs, a slowly breathing orange blob with two blinking eyes that floats in the bottom-right corner of every signed-in page.

**Key Characteristics:**
- Cool grey-lavender ground, white inset panel, hairline rings, near-invisible shadows.
- One ember-orange accent, used sparingly for action, place and punctuation.
- Six pastel course tints, each a pale field + saturated mark + readable ink triple.
- Poppins for everything; JetBrains Mono only for codes and tabular figures in dense data cells.
- Pills and soft corners everywhere; hexagon badges as the category mark.
- Full light and dark themes from the same token names.

## Colors

A cool neutral field with one warm voice and a pastel chorus that belongs to the courses.

### Primary
- **Ember Orange** (`ember-orange`): primary buttons, the live-lesson pill, today in the calendar, the semester dot, the caret, focus rings, selection tint, the logo tile, and the title full stop. In dark mode it lifts to a lighter, slightly yellower orange (oklch(0.71 0.17 45)).
- **Ember Ink** (`ember-ink`): orange as text: active nav label, soft-button label, "Sabah" day labels, links inside chat. Darker than the accent so it holds contrast on white and on Ember Wash.
- **Ember Wash** (`ember-wash`): the tinted ground under the active nav item, soft buttons, the upcoming-status pill, the semester chip and the assistant panel header. In dark mode it is the accent at 14% alpha.

### Tertiary: Course Tints
Six pastel families, each a triple: a pale **field** (tile background), a saturated **mark** (hexagon badge, dots, timeline nodes) and a darker **ink** (meta text on the field).
- **Mint** (`mint` / `mint-mark` / `mint-ink`): course tint; grade A; teacher role chip.
- **Butter** (`butter` / `butter-mark` / `butter-ink`): course tint; grade D; admin role chip; avatar fallback.
- **Lavender** (`lavender` / `lavender-mark` / `lavender-ink`): course tint; grade C; student role chip.
- **Sky** (`sky` / `sky-mark` / `sky-ink`): course tint; grade B.
- **Rose** (`rose` / `rose-mark` / `rose-ink`): course tint; grade F.
- **Peach** (`peach` / `peach-mark` / `peach-ink`): stat tiles and grade E only, never a course.

### Neutral
- **Lavender Ground** (`ground`): the page and sidebar background behind the inset panel.
- **Paper White** (`surface`): the inset working panel, cards, popovers, inputs.
- **Navy Ink** (`ink`): all primary text and big numbers.
- **Slate Muted** (`ink-muted`): descriptions, meta lines, table headers, the footer.
- **Sidebar Ink** (`sidebar-ink`): resting nav labels, softer than body ink.
- **Hairline** (`hairline`): card rings, dividers, table rules. Dark mode uses white at 8%.
- **Field Stroke** (`field-stroke`): input borders. Dark mode uses white at 13%.
- **Muted Wash** (`muted-wash`): hover fills, the "done" status pill, default tab track.

### Status
- **Destructive** (`destructive`), **Success** (`success`), **Warning** (`warning`), **Info** (`info`): feedback only. Destructive buttons are a 10% wash with destructive text, never a solid red block.

### Named Rules
**The One Ember Rule.** Orange is the only saturated non-course colour on a screen. It marks action, place, today, and punctuation; it never fills a card or a header band.

**The Dealt Tint Rule.** Courses are dealt tints in alphabetical order (Azerbaijani collation) from mint, butter, lavender, rose, sky, so neighbouring courses never repeat and a course keeps its colour across cards, timetable blocks and list marks. Peach is never dealt to a course because it competes with the orange accent.

**The Triple Rule.** A tint is always used as its triple: field behind, mark for the badge, ink for text on the field. Never put body text in a mark colour or a mark on a different family's field.

## Typography

**Display Font:** Poppins 400/500/600/700 (with ui-sans-serif, system-ui)
**Body Font:** Poppins (same family)
**Label/Mono Font:** JetBrains Mono (with ui-monospace)

**Character:** One geometric, round-shouldered sans carries every role, so hierarchy comes from size and weight (600 for titles, 500 for labels, 400 for prose) rather than a second face. Titles tighten to -0.02em; numbers use tabular figures.

### Hierarchy
- **Display** (600, 2.6rem, 1.1, -0.03em): the login hero line only.
- **Headline** (600, 1.6rem mobile / 1.85rem from sm, leading-tight, -0.02em): page titles and the greeting, always with the orange full stop.
- **Title** (600, 1.2rem, leading-tight, -0.02em): section titles inside a page ("Fənlərim.", "Yaxınlaşan."); calendar month at 1.15rem.
- **Card title** (600, 1rem, -0.01em) and **Title small** (600, 0.92rem): card headers, course names on tiles.
- **Stat figure** (600, 1.6rem, leading-none, tabular): numbers on stat tiles and header figures.
- **Body** (400, 0.875rem, 1.5): default UI text; dense list rows run 0.84 to 0.88rem; page descriptions cap at max-w-2xl.
- **Label** (500, 0.72 to 0.8rem): meta lines, chips, status pills (600), sidebar group labels (600, 0.8rem, with the full stop).
- **Code** (JetBrains Mono, 0.82rem or smaller, tabular): course codes, student numbers, file names, and score/time cells in dense tables.

### Named Rules
**The Full Stop Rule.** Every page title, section title, sidebar group label and the wordmark ends in an orange full stop (the `title-dot` treatment: a "." in the primary colour, 0.06em gap). It is punctuation, not decoration, so it never appears on body text, buttons or card titles.

**The One Family Rule.** Poppins is the only display and text face. Mono is reserved for machine values (codes, IDs, numeric cells); never for headings or prose.

## Layout

An app shell on the ground colour: a light sidebar on the left (collapsible to icons; an off-canvas sheet on mobile) and a white inset panel to its right with 2xl corners and the soft shadow. Inside the panel a sticky 64px header (translucent white with backdrop blur) carries the sidebar toggle, a breadcrumb, search (Ctrl K), the active-semester chip, the date, a theme toggle and the account avatar.

Content sits in a centred column up to 90rem wide, with 16px gutters on mobile and 32px from md, and 112px bottom clearance so the floating assistant never covers the last row. Dashboards add a right rail from xl: separated by a hairline and 32px of padding, it holds a month calendar and the "Yaxınlaşan" timeline, with 32px gaps between blocks. Course tiles flow in a three-column grid on desktop with 16px gaps; lists use divider rules with 14px row padding.

Rhythm: 4/8/16/20/32px. Cards pad 20px (16px in the small size); stat tiles pad 16px; section titles sit 16px above their content.

The login page splits in two on desktop: a left story column on the ground (wordmark, display headline, a fanned row of sample course tiles, three feature lines) and a right white panel with 3xl corners holding the form. On mobile the panel stacks below.

## Elevation & Depth

Depth is mostly tonal: white panels on a lavender ground, outlined by 1px hairline rings. Shadows exist but stay ambient: navy-tinted, low opacity, long negative-spread blurs that read as air under a sheet of paper. Coloured glows appear only under orange things (the primary button, the assistant blob) and under hexagon badges, in their own hue.

### Shadow Vocabulary
- **Soft** (`box-shadow: 0 1px 2px oklch(0.3 0.03 270 / 4%), 0 8px 24px -12px oklch(0.3 0.03 270 / 12%)`): resting cards, the inset panel, white pills on tinted tiles, the profile chip.
- **Lift** (`box-shadow: 0 2px 4px oklch(0.3 0.03 270 / 5%), 0 18px 40px -18px oklch(0.3 0.03 270 / 22%)`): popovers, the assistant panel and idle bubble, the profile chip on hover.
- **Ember glow** (`box-shadow: 0 6px 16px -8px var(--primary)`): primary buttons only; the launcher uses a larger `0 10px 24px -8px` version plus a blurred orange halo.
- **Badge drop** (`drop-shadow: 0 6px 8px` of the mark colour at 35%): under hexagon badges.

### Named Rules
**The Air, Not Weight Rule.** Shadows are soft, wide and low-opacity, always navy- or hue-tinted, never black and never hard-offset. A surface that needs more separation gets a hairline ring, not a darker shadow.

## Shapes

Everything is soft. The base radius is 0.75rem; cards, tiles and the inset panel use the 2xl step (1.35rem); the login panel, the assistant panel and the full chat surface use 3xl (1.65rem); inputs and nav items use xl (1.05rem). Buttons, chips, status pills, the avatar, the semester chip and lesson marks are full pills or circles. Category marks are soft hexagons (a rounded-vertex hexagon path, 36/48/64px) filled with the tint's mark colour and a white 2px-stroke Lucide icon. Letter-grade badges are rounded squares (lg to 2xl by size) on their tint field with a faint mark-coloured ring. The assistant is the one organic shape: a blob whose border-radius morphs.

## Components

### Buttons
Round, friendly and quietly confident.
- **Shape:** full pill (9999px); heights 24 / 32 / 36 / 44px for xs / sm / default / lg.
- **Primary:** ember-orange fill, white 600 label, ember glow; hover darkens the fill by 7% toward black. Press nudges down 1px.
- **Soft:** ember-wash fill with ember-ink 600 label; the secondary action of choice (journal links, attendance after a lesson).
- **Outline / Secondary / Ghost:** white with hairline, lavender-grey fill, or transparent with muted hover. Icon buttons are 32 to 36px circles.
- **On a tint:** a white pill with the soft shadow sits on pastel tiles ("Qiymətlər", "Ətraflı").
- **Destructive:** 10% red wash with red text.
- **Focus:** a 3px ring in the accent at 50%.

### Chips and Status Pills
- **Status:** pill, 0.72rem 600, fixed 96px width so a column aligns: live = orange fill ("İndi gedir"), upcoming = ember wash ("Gözlənilir"), done = muted wash ("Bitib").
- **Semester chip:** ember wash pill with a 6px orange dot and ember-ink label in the header.

### Cards / Containers
- **Corner Style:** 2xl (1.35rem).
- **Background:** white (`surface`); dark mode a lifted navy-grey.
- **Shadow Strategy:** Soft, plus a 1px hairline ring.
- **Internal Padding:** 20px, 16px in the small size. Footers sit on a 50% muted wash with a top rule.

### Course Card (signature)
A pastel tile on the course's dealt tint: centred hexagon badge with a subject icon picked from the course name, the course name (0.92rem 600, navy ink, two lines max), one meta line in the tint's ink, and a row of white pill actions. No border, no shadow; the field colour is the container.

### Stat Card
A pastel tile (peach by default) laid out horizontally: hexagon badge, a 1.6rem tabular figure, a 0.8rem label and an optional hint. Header figures on the dashboard use a lighter variant: label over number on a muted wash.

### Inputs / Fields
- **Style:** 36px high, xl corners, 1px field-stroke border, transparent fill (white panel shows through); leading icons in muted ink; login fields are taller.
- **Focus:** border turns orange plus a 3px orange ring at 50%.
- **Error / Disabled:** destructive border with a 20% destructive ring; disabled at 50% opacity.

### Tabs
Two treatments: a muted track with a white active segment (default), and a line variant whose active trigger gets a 2px orange underline (used on dashboards for "Dərslər / Son qiymətlər").

### Navigation
The sidebar sits on the ground colour. Top: the wordmark (orange rounded-square logo tile with a white mortarboard, "UniLMS." in 1.3rem 600), then a white profile chip (hexagon in the role's tint, name, group or department). Groups carry a 0.8rem 600 label with the orange full stop. Items are 36px rows with xl corners, 0.84rem 500 sidebar-ink labels and 1.9-stroke Lucide icons; hover fills white; the active item gets an ember-wash fill with an ember-ink 600 label. Logout sits alone at the bottom and turns red on hover. The nav list fades out at its bottom edge with a mask.

### Lesson Timeline and Upcoming Rail
Lesson rows: a 44px circle in the course's tint field with the subject icon, course name 0.88rem 600, a meta line separated by orange bullets, the time range in tabular figures, then a status pill or a soft/primary action. The rail's "Yaxınlaşan" timeline links 12px nodes with a 1px hairline spine; the next lesson's node is solid orange, later ones are hollow; day labels ("Sabah", "26 Noy") are ember-ink 600.

### Calendar
Month grid in muted 0.68rem weekday heads and 0.8rem dates; the current week sits in an ember-wash band, today is a solid orange circle with white text, and lesson days carry a small orange dot below the number.

### SiriUs Assistant (signature)
A 60px orange blob (radial gradient from a light apricot highlight through the accent to a deep red-orange) with two white pill eyes, fixed 16 to 24px from the bottom-right corner, over a blurred orange halo. It morphs its border-radius over 9s and blinks every 5.5s; hover scales to 1.06 on an expo-out curve. After 7s of stillness a white speech bubble (2xl corners with a tighter bottom-right corner, Lift shadow) slides in over 320ms: "Sizə necə kömək edə bilərəm?". Clicking opens a 25rem-wide, 3xl-cornered panel with an ember-wash header. All three animations are removed under reduced motion.

## Do's and Don'ts

### Do:
- **Do** end every page title, section title and sidebar group label with the orange full stop.
- **Do** deal course tints through the shared tint provider so a course keeps one colour everywhere, using the full triple (field, mark, ink).
- **Do** keep orange to action, place, today and punctuation; use ember wash and ember ink for the quieter states.
- **Do** use pill shapes for every button, chip and status, and 2xl corners for cards and tiles.
- **Do** keep shadows to Soft and Lift; separate surfaces with a hairline ring first.
- **Do** write all copy in Azerbaijani and check any new face for ə Ə ğ ı İ ş ç ö ü.
- **Do** keep 112px of bottom clearance on app pages so SiriUs never covers content, and drop all looping motion under reduced motion.
- **Do** define every colour in both light and dark themes under the same token name.

### Don't:
- **Don't** bring back the navy sidebar, blue gradients or a gradient hero band.
- **Don't** deal peach to a course; it is reserved for stat tiles and grade E.
- **Don't** add a second accent hue or fill a whole card or header with orange.
- **Don't** use black or hard-offset shadows.
- **Don't** set headings or prose in JetBrains Mono, or introduce a second display face.
- **Don't** add small uppercase eyebrow labels above titles; hierarchy comes from size, weight and the full stop.
- **Don't** put the full stop on buttons, card titles or body text.
