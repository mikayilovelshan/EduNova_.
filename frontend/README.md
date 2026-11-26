# UniLMS — Frontend

Next.js 16 (App Router) client for the UniLMS .NET API. UI language: Azerbaijani.

## Running locally

1. Start the API (from the repository root):

   ```bash
   dotnet dev-certs https --trust                                            # once per machine
   dotnet run --project Presentation/UniLMS.WebApi --launch-profile https  # https://localhost:7123
   ```

   On startup the API applies pending migrations, seeds the roles, creates the first administrator
   (`Seed:Admin` in `appsettings.Development.json`) and, in Development with an empty student table,
   seeds demo data.

2. Start the frontend:

   ```bash
   cd frontend
   npm install
   npm run dev                                                          # http://localhost:3000
   ```

   Set `BACKEND_URL` (see `.env.example`) if the API does not run on `https://localhost:7123`.
   `npm run dev` (`scripts/dev.mjs`) makes Node trust the OS certificate store so the trusted
   ASP.NET Core dev certificate is accepted.

### Demo accounts (Development seed)

| Role     | Email               | Password      |
| -------- | ------------------- | ------------- |
| Student  | student@unilms.az   | `Student123!` |
| Teacher  | teacher@unilms.az   | `Teacher123!` |
| Teacher  | l.huseynova@unilms.az | `Teacher123!` |
| Admin    | admin@unilms.az     | `Admin123!`   |

The AI assistant (SiriUs) runs on **OpenRouter** free models. Store the key with user-secrets, never
in `appsettings.json`:

```bash
dotnet user-secrets set "OpenRouter:ApiKey" "sk-or-v1-..." --project Presentation/UniLMS.WebApi
```

`OpenRouter:Model` (default `google/gemma-4-31b-it:free`) and `OpenRouter:FallbackModels`
(default `nvidia/nemotron-3-ultra-550b-a55b:free`) live in `appsettings.json`; when the first model is
rate-limited or down, the next one is tried. Answers are grounded in the user's own records and in
passages retrieved from their course materials (PDF, DOCX, PPTX, text) with a local BM25 search —
no embedding service, so it stays free.

## Architecture

- **Auth (BFF)** — `src/app/api/auth/*` logs in against the API and stores the access and refresh
  tokens in httpOnly cookies. `src/app/api/backend/[...path]` proxies every API call, attaches the
  bearer token and refreshes an expired access token transparently. Tokens never reach browser JS
  and no CORS is needed. `src/proxy.ts` redirects signed-out users to `/login`.
- **Data** — TanStack Query hooks in `src/lib/queries.ts`; `src/lib/api.ts` unwraps the API's
  `{ success, message, data }` envelope and surfaces its (Azerbaijani) messages.
- **Tables** — TanStack Table via `src/components/shared/data-table.tsx` (search, sort, paging).
- **UI** — shadcn/ui (Radix), Tailwind CSS v4, Recharts. Theme tokens in `src/app/globals.css`:
  cool grey ground, white panels, one orange accent, pastel course tints (mint, butter, lavender,
  sky, peach, rose). Light and dark themes.
- **Typography** — Poppins (UI and headings), JetBrains Mono (codes, times).
  Both were verified to contain the full Azerbaijani alphabet (ə Ə ğ ı İ ş ç ö ü).
- **AI assistant** — the orange SiriUs blob in the bottom-right corner of every app page opens a chat
  panel (`src/components/assistant/`); the conversation is shared with the full `/assistant` page.

| Route | Student | Teacher | Admin |
| --- | --- | --- | --- |
| `/` | personal dashboard | today's lessons, attendance overview | institution overview |
| `/schedule` | group timetable | own lessons | all lessons |
| `/attendance` | own attendance | take / edit attendance, journal | same, all courses |
| `/grades` | grade cards and report | gradebook for own courses | gradebook, all courses |
| `/materials` | download | upload / delete for own courses | all courses |
| `/assistant` | AI assistant (SiriUs) | ✓ | ✓ |
| `/admin/*` | — | — | CRUD for the academic structure and people |
