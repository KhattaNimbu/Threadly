# Threadly

Threadly is a Next.js 16 application that turns raw meeting transcripts into structured summaries, action items, pattern insights, and searchable meeting history. The repository currently contains a working MVP with authentication, transcript ingestion, AI analysis, persistence, task management, insights, chat, and export flows.

## What is implemented in this repo

- Clerk-based authentication and protected app routes
- Transcript upload and processing flow for pasted text and .txt/.vtt files
- Gemini-powered analysis for summaries, decisions, topics, participants, sentiment, and action items
- Supabase-backed storage for meetings and action items
- Dashboard, meeting detail, task board, insights, ask/chat, and export experiences
- API routes for meeting processing, insights generation, chat over recent meeting history, task updates, and meeting export

## Current status

- The core product flow is built and wired together end to end.
- Recent upgrades now include automated route/parsing tests, semantic meeting retrieval for `/ask`, Clerk-to-Supabase profile syncing, and email export via Resend.
- A few cleanup items remain: one known lint warning around the deprecated `middleware` file convention, a small number of encoding artifacts in UI copy, and manual setup steps for semantic-search/export infrastructure in Supabase and env files.
- The project is ready for local development once the required environment variables are configured.

## Quick start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a local environment file with the required variables:
   ```bash
   copy .env.local.example .env.local
   ```
   If you do not have an example file, create .env.local manually with the variables listed below.
3. Apply the Supabase schema from `supabase/schema.sql`.
4. Start the app:
   ```bash
   npm run dev
   ```

## Initial Git setup and first commit

If this folder is not yet a Git repository, initialize it with:

```bash
git init
```

Then add the project files and create your first commit:

```bash
git add .
git commit -m "Initial commit"
```

If you want to connect it to a remote repository:

```bash
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

## Tech Stack

- Framework: Next.js `16.2.9` with App Router
- Language: TypeScript
- UI: React `19.2.4`
- Styling: Tailwind CSS v4 plus custom CSS variables
- Auth: Clerk
- Database: Supabase PostgreSQL
- AI: Google Gemini via `@google/generative-ai`

## Environment Variables

Required variables used by the app:

- `GEMINI_API_KEY`
- `GEMINI_EMBEDDING_MODEL` (optional, defaults to `gemini-embedding-001`)
- `GEMINI_EMBEDDING_API_VERSION` (optional, defaults to `v1`)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `EXPORT_FROM_EMAIL`
- `EXPORT_REPLY_TO_EMAIL` (optional)

Security note:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are intended for browser-safe usage.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and is now isolated in `lib/supabase/server.ts`.

## High-Level Product Flow

1. A signed-in user opens `/meeting/new`.
2. They paste a transcript or upload a `.txt` or `.vtt` file.
3. `POST /api/process-meeting` sends the transcript to Gemini.
4. Gemini returns structured JSON with summary, decisions, topics, participants, sentiment, and action items.
5. The app stores the meeting and action items in Supabase.
6. The app also generates a Gemini embedding for the meeting and stores it for semantic retrieval.
7. The user is redirected to `/meeting/[id]` to review the result.
8. From there they can:
   - mark action items complete
   - copy a formatted export
   - send the meeting export by email
   - review the raw transcript
9. Other pages reuse the same stored meeting data:
   - `/dashboard` for stats and recent meetings
   - `/tasks` for cross-meeting action items
   - `/insights` for AI pattern detection
   - `/ask` for chat over semantically retrieved meetings

## Route Map

### Public routes

- `/`
  - Landing page
  - Redirects signed-in users to `/dashboard`
- `/sign-in/[[...sign-in]]`
  - Clerk sign-in page
- `/sign-up/[[...sign-up]]`
  - Clerk sign-up page

### Protected app routes

Protected by Clerk middleware and the `(app)` layout.

- `/dashboard`
  - Monthly and weekly meeting stats
  - Open/completed task stats
  - Recent meetings list
- `/meeting/new`
  - Transcript input page
  - Supports pasted text and `.txt` / `.vtt` upload
- `/meeting/[id]`
  - Meeting summary view
  - Action item list
  - Export dropdown with copy and email actions
  - Raw transcript disclosure section
- `/tasks`
  - Consolidated action-item board across meetings
  - Filter by priority, status, assignee
  - Sort by due date, priority, or meeting date
- `/insights`
  - Client-rendered AI insights page
  - Fetches generated patterns from `/api/insights`
- `/ask`
  - Streaming chat UI for questions about recent meetings

## API Route Map

### `POST /api/process-meeting`

Purpose:

- Analyze a transcript with Gemini
- Save meeting data and action items to Supabase

What it does:

- Authenticates the user with Clerk
- Validates transcript input
- Calls `analyseMeeting()` from `lib/gemini.ts`
- Syncs the authenticated Clerk user into Supabase
- Inserts a meeting row
- Inserts action items linked to the meeting
- Generates and stores a semantic-search embedding for the meeting
- Returns `{ meeting_id, analysis }`

### `POST /api/export`

Purpose:

- Generate a formatted export for one meeting and optionally deliver it by email

What it does:

- Authenticates the user
- Validates `meeting_id`, `format`, and `destination`
- Loads the meeting plus action items from Supabase
- Calls `formatMeetingExport()`
- Returns `{ content }` for clipboard exports
- Sends email through Resend when `destination: "email"`
- Logs email delivery attempts in `export_logs`

Supported destinations:

- `clipboard`
- `email`

### `GET /api/insights`

Purpose:

- Generate cross-meeting insights

What it does:

- Authenticates the user
- Loads up to the last 20 meetings
- Returns `[]` if fewer than 2 meetings exist
- Calls `generateInsights()`
- Returns `{ insights }`

### `POST /api/ask`

Purpose:

- Answer natural-language questions about recent meeting history

What it does:

- Authenticates the user
- Validates the question
- Embeds the question and looks up the most relevant meetings with `match_meetings_by_embedding(...)`
- Falls back to recent meetings if embeddings or vector lookup are unavailable
- Calls `streamAskHistory()`
- Streams plain text back to the client
- Includes an `X-Meetings-Used` response header for UI context

Current limitation:

- Semantic retrieval depends on the updated `supabase/schema.sql` being applied successfully

### `GET /api/tasks`

Purpose:

- Fetch action items across meetings with query filters

Supported filters:

- `priority`
- `status`
- `assignee`
- `sort`

What it returns:

- Flattened task objects including meeting title

### `PATCH /api/tasks/[id]`

Purpose:

- Toggle action item completion

What it does:

- Authenticates the user
- Validates `completed`
- Updates the task only if `user_id` matches
- Returns the updated task

## Shared Library Map

### `lib/gemini.ts`

Central wrapper for Gemini usage.

Implemented functions:

- `analyseMeeting(transcript)`
- `generateInsights(meetings)`
- `streamAskHistory(question, meetings)`
- `formatMeetingExport(meeting, format)`
- `embedText(text, options)`

Notes:

- Uses Gemini `gemini-2.5-flash` by default, with optional `GEMINI_MODEL` override
- Uses `gemini-embedding-001` on API version `v1` by default for embeddings
- Parses JSON responses for structured tasks
- Strips markdown fences before `JSON.parse`
- Validates parsed meeting-analysis and insight payload shapes before using them
- Streams text for the ask/chat flow

### `lib/meeting-search.ts`

Semantic retrieval utilities.

Implemented functions:

- `buildMeetingSearchDocument(...)`
- `generateMeetingSearchEmbedding(...)`
- `findRelevantMeetingsForQuestion(...)`

Notes:

- Builds searchable meeting documents from title, summary, decisions, participants, action items, and transcript
- Uses Supabase `pgvector` lookup through `match_meetings_by_embedding(...)`
- Falls back to recent meetings if semantic search is unavailable

### `lib/user-sync.ts`

Authenticated-user sync helper.

What it does:

- Reads the active Clerk user
- Extracts primary email and display name
- Upserts the matching user profile into Supabase

### `lib/export/`

Export transport layer.

Implemented modules:

- `lib/export/index.ts`
- `lib/export/email.ts`

What it does:

- Keeps `formatMeetingExport()` focused on content generation
- Sends email exports through Resend
- Builds both text and HTML email payloads

### `lib/prompts.ts`

Holds all AI prompt templates.

Implemented prompts:

- transcript-to-JSON extraction
- cross-meeting insight generation
- meeting-history Q&A
- export formatting for multiple targets

### `lib/types.ts`

Defines shared domain and API types:

- meetings
- action items
- AI analysis payloads
- insights
- task filters
- chat messages
- API response shapes

### `lib/supabase.ts`

Browser-safe Supabase client using:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### `lib/supabase/server.ts`

Server-only Supabase client using:

- `SUPABASE_SERVICE_ROLE_KEY`

Notes:

- Uses `import 'server-only'`
- Intended for routes and server components only
- Bypasses RLS, so ownership checks are enforced in application code

## Component Map

### Layout components

- `components/layout/Sidebar.tsx`
  - Main app navigation
- `components/layout/TopBar.tsx`
  - Top bar for protected pages

### Meeting components

- `TranscriptUploader.tsx`
  - Paste transcript
  - Drag/drop file upload
  - Sample transcript shortcut
  - Calls `/api/process-meeting`
- `MeetingCard.tsx`
  - Meeting preview card for dashboard lists
- `MeetingSummaryCard.tsx`
  - Displays title, summary, decisions, metadata
- `ActionItemList.tsx`
  - Splits open vs completed items
  - Calls `PATCH /api/tasks/[id]`
- `ActionItemCard.tsx`
  - Individual action item presentation
- `ExportButton.tsx`
  - Calls `/api/export`
  - Supports clipboard export
  - Supports send-by-email export
  - Shows loading, success, error, and manual-copy fallback states

### Task components

- `TaskBoard.tsx`
  - Local filtering, sorting, and completion state
- `TaskFilters.tsx`
  - Priority/status/sort/assignee controls

### Insights components

- `InsightCard.tsx`
  - Displays one generated pattern insight

### Ask/chat components

- `ChatInterface.tsx`
  - Starter prompts
  - Message history
  - Streaming response rendering
  - Shows which meetings were used as context

### UI primitives

- `Button.tsx`
- `Card.tsx`
- `Input.tsx`
- `Textarea.tsx`
- `Badge.tsx`
- `EmptyState.tsx`
- `Spinner.tsx`

## Data Model

The schema is defined in `supabase/schema.sql`.

### `users`

Fields:

- `id`
- `email`
- `name`
- `created_at`
- `updated_at`

Purpose:

- Stores Clerk-linked user records

### `meetings`

Fields include:

- `id`
- `user_id`
- `title`
- `raw_transcript`
- `summary`
- `decisions`
- `topics`
- `participants`
- `sentiment`
- `follow_up_needed`
- `duration_estimate`
- `content_embedding`
- `met_at`
- `created_at`

### `action_items`

Fields include:

- `id`
- `meeting_id`
- `user_id`
- `title`
- `assignee`
- `due_date`
- `priority`
- `completed`
- `created_at`

### `export_logs`

Fields include:

- `id`
- `user_id`
- `meeting_id`
- `destination_type`
- `recipient`
- `status`
- `provider`
- `error_message`
- `created_at`

## Security Model

### Clerk

- Middleware protects `/dashboard`, `/meeting`, `/tasks`, `/insights`, and `/ask`
- Protected routes also guard at the layout/page/API level

### Supabase

- RLS remains enabled on `users`, `meetings`, and `action_items`
- Server-side code currently uses the service role client for convenience
- The schema explicitly grants table access to `service_role`
- Because service role bypasses RLS, route handlers manually scope queries by `user_id`

### Current security posture

Built and good:

- server-only Supabase service-role separation
- per-user filtering in data access
- protected app routes and APIs

Worth improving later:

- move more reads to anon/RLS-safe server patterns where practical
- add richer delivery observability or export-history UI on top of `export_logs`

## Files and Folders

```text
app/
  (app)/
    ask/page.tsx
    dashboard/page.tsx
    insights/page.tsx
    meeting/new/page.tsx
    meeting/[id]/page.tsx
    tasks/page.tsx
    layout.tsx
  (auth)/
    sign-in/[[...sign-in]]/page.tsx
    sign-up/[[...sign-up]]/page.tsx
  api/
    ask/route.ts
    export/route.ts
    insights/route.ts
    process-meeting/route.ts
    tasks/route.ts
    tasks/[id]/route.ts
  globals.css
  layout.tsx
  page.tsx

components/
  ask/
  insights/
  layout/
  meeting/
  tasks/
  ui/

lib/
  export/
    email.ts
    index.ts
  gemini.ts
  meeting-search.ts
  prompts.ts
  supabase.ts
  supabase/server.ts
  types.ts
  user-sync.ts

supabase/
  schema.sql
```

## Known Gaps and Risks

- `app/(app)/insights/page.tsx` currently fails lint because of a React effect pattern.
- Clipboard access can still be blocked by some browser contexts; the UI now falls back to a manual copy panel in that case.
- Semantic retrieval depends on the vector schema/RPC being applied in Supabase and may fall back to recent meetings if that setup is missing or if embedding calls fail.
- Email export depends on valid Resend credentials and a working sender address.
- Some UI strings still contain encoding artifacts.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create `.env.local` with the required variables listed above.

### 3. Create the database schema

Run the SQL in:

- `supabase/schema.sql`

### 4. Start the app

```bash
npm run dev
```

### 5. Optional checks

```bash
npm run lint
npm test
```
