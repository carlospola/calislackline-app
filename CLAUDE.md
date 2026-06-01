# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An AI calisthenics/gym coaching web app ("AIlistenics"), in Italian. Athletes run guided
training sessions in a chat UI driven by Claude; a coach/admin assigns programs and reviews
logs. There is **no build step and no package.json** — it's a static frontend plus three Vercel
serverless functions. Deployed on Vercel at `ailistenics.com` (hardcoded in OAuth/reset redirect URLs).

## Architecture

Three layers, no framework:

- **`index.html`** (~2350 lines) — the *entire* SPA: markup, CSS, and all JS in one file. Plain
  ES5-style `var`/`function`, no modules, no bundler. UI is a set of `.screen` divs toggled by
  `showScreen(id)`; only one is `.active` at a time (login, dash, profile, session, progress,
  admin, onboard). Global mutable state lives at the top of the `<script>` block
  (`currentUser`, `currentProfile`, `sessionHistory`, etc., starting ~line 825).
- **`reset.html`** — standalone password-reset page (served at `/reset` via `vercel.json` rewrite).
- **`api/*.js`** — Vercel serverless functions (Node, `export default async function handler`).

Data and auth go through **Supabase** directly from the browser using the anon key
(`SUPABASE_ANON_KEY` in `index.html`, line ~824). PKCE OAuth flow. The browser talks to Supabase
for all reads and athlete-scoped writes; privileged operations go through `/api/admin`.

### The serverless functions

- **`api/chat.js`** — proxies to the Anthropic Messages API (`claude-sonnet-4-5`, max_tokens 1000).
  Keeps `ANTHROPIC_API_KEY` server-side. Frontend posts `{system, messages}`; this is the only
  thing standing between the browser and the model. Protected by an **auth gate**: before forwarding
  to Anthropic, the handler reads the caller's Supabase JWT from the `Authorization: Bearer <token>`
  header and verifies it via `GET /auth/v1/user` (same logic and `apikey`/header as `api/admin.js`,
  but **without** the role check — any authenticated Supabase user is allowed; no `403`). It returns
  `401` if the token is missing or invalid. CORS is still wide open (`*`), but `Allow-Headers` now
  includes `Authorization` and a valid **logged-in user token is required**. The frontend attaches
  the token in `aiSend()` (it pulls the current session's `access_token` from `sb.auth.getSession()`,
  same source as `adminFetch()`); on a `401` it shows a visible "Sessione scaduta" message to the
  athlete. This closes the previously-open proxy; **rate-limiting remains as a phase-2 follow-up.**
  Reuses the existing `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` env vars — no new
  variable.
- **`api/admin.js`** — privileged Supabase operations using the **service-role key** (bypasses RLS).
  Single endpoint dispatched by `req.body.action`: `createUser`, `deleteUser`, `updateProfile`,
  `updateStatus`, `addProgram`/`editProgram`/`removeProgram`, `updateProgram`, `resetProgram`.
  Protected by an **auth gate**: the handler reads the caller's Supabase JWT from the
  `Authorization: Bearer <token>` header, verifies it via `GET /auth/v1/user`, then checks that the
  user's `profiles.role === 'admin'` — otherwise it returns `401` (missing/invalid token) or `403`
  (authenticated but not an admin). CORS is still wide open (`*`), but a valid **admin token is now
  required**. The frontend never calls this endpoint with a bare `fetch`: it uses the `adminFetch()`
  helper in `index.html`, which attaches the current session's access token and wraps every
  `/api/admin` call. The service-role key still bypasses RLS, so keep this gate intact when editing.
- **`api/callback.js`** — OAuth/recovery redirect handler; routes `type=recovery` to `/reset`.

### Supabase tables (inferred from queries — there are no migration files)

- `profiles` — one per user. `role` (`admin`/`athlete`), `status` (`pending`/`active`),
  plus a large set of athlete fields (`eta`, `peso`, `altezza`, `livello`, `obiettivo`,
  `discipline`, `infortuni`, etc.). Admin identified by `email === ADMIN_EMAIL` (line ~825).
- `programs` — many per user. Key fields: `coach_rules` (the AI system prompt for the program),
  `workout_csv`, `ai_prompt` (extra coach notes), `session_type` (`bodyweight` | `gym`).
- `sessions` — completed workout logs. `log_text` (human-readable) + `log_data` (structured JSON;
  drives all the progress charts).
- `session_drafts` — one in-progress session per user (resume-after-leaving).
- `exercises` — exercise library managed in the admin screen.

## The AI session flow (most important to understand)

**Pre-chat workout picker.** Before the session opens, `startSessionWithPrompt()` (~line 1050)
parses the program's `workout_csv` with `parseWorkoutCsv()` (~line 1539, groups rows by the
`workout` column). If the CSV defines **≥2 workouts**, it shows a picker overlay
(`#workoutPickerOverlay` / `showWorkoutPicker`) so the athlete chooses which one to run; with
0–1 workouts it skips straight to `beginSession()`. On confirm, `beginSession()` (~line 1094)
calls `buildFilteredCsv()` (~line 1578) to rebuild the CSV with only the chosen workout's block
(header + its rows; falls back to the full CSV if the workout isn't found), so the system prompt
carries just that one workout instead of the whole program (**API-cost reduction**). It also sets
`sessionWorkout = "Programma — Workout"` (the display name shown in the session title and saved
with the log).

This is the core loop and the trickiest part. In `aiSend()` (~line 1168):

1. The **system prompt** is assembled per-message from `coach_rules`/`ai_prompt` + `workout_csv` +
   athlete context (`buildAthleteContext`, ~line 2233, only on the first message of a session).
   Note that `workout_csv` here is already the **filtered** block for the chosen workout (see the
   pre-chat picker above), not necessarily the program's full CSV.
2. History is trimmed to `MAX_HISTORY = 12` messages, except when the user sends `fine` or `recap`
   (then full history is kept).
3. The model communicates back to the UI through **bracket tags embedded in its replies**:
   - `[SET:ExerciseName]` and `[SUPERSET:A, B]` → `detectAndRenderInput()` renders the rep/RIR
     input fields for that set.
   - When the user types `fine` (end session), `COACH_LOG_FORMAT` (~line 837) is appended to the
     system prompt, instructing the model to emit a `WORKOUT LOG` plus a single-line
     `[LOG_DATA:{...}]` JSON blob. `saveSessionLog()` (~line 1214) parses that JSON with a
     brace-depth scanner, strips the tag from the visible text, and inserts the row into `sessions`.

When changing prompt assembly, the bracket-tag contract, or `LOG_DATA` shape, keep
`COACH_LOG_FORMAT`, `detectAndRenderInput`, `saveSessionLog`, and the chart code (which reads
`log_data.exercises[].sets[]`) in sync — they form one implicit protocol.

## Running and deploying

- **Local preview:** open `index.html` directly, but the `/api/*` functions won't run. Use
  `vercel dev` (Vercel CLI) to exercise the serverless endpoints locally.
- **Deploy:** push to the Vercel-connected branch (`main`). Recent history shows the workflow is
  committing edits straight to `index.html`.
- There are **no tests, no linter, no build**. "Verifying a change" means running the app.

### Required environment variables (Vercel project settings)

- `ANTHROPIC_API_KEY` — used by `api/chat.js`.
- `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` — used by `api/admin.js` **and now also
  by `api/chat.js`** (for its JWT auth gate; reused, not new).
- The frontend Supabase URL and anon key are hardcoded in `index.html` / `reset.html`.

## Regole di lavoro

These are mandatory working rules for this repository. Follow them on every change.

1. **Never rewrite `index.html` wholesale for small changes.** It is a single ~2350-line file;
   always make targeted, surgical edits to the specific block involved. Do not regenerate or
   re-emit the whole file to change a few lines.
2. **Show the plan before writing code.** Present the intended approach and the exact spots you'll
   touch, then implement only after that's laid out.
3. **Do not modify `api/chat.js`, the database schema, or anything auth-related without first
   showing the diff and asking for confirmation.** This covers the Anthropic proxy, Supabase
   table shapes/queries that change structure, and the login/OAuth/reset/PKCE flow. Propose the
   change as a diff and wait for explicit approval before applying it.
4. **Dark theme is mandatory.** Keep accent `#c8f060` (`--accent`), fonts **Syne** (display,
   `--display`) and **DM Mono** (body/mono, `--mono`). Use the existing CSS variables in
   `:root` (line ~12) rather than hardcoding colors or fonts.
5. **Session-screen input fields keep empty placeholders.** The reps/RIR/weight inputs on the
   session screen must have blank `placeholder` values (see `renderInputFields` / `inputFieldHTML`,
   ~line 1106) — do not add placeholder hint text.

## Conventions

- All user-facing copy is **Italian** — match it when adding UI text.
- Frontend code is ES5-flavored (`var`, function declarations, string concatenation for HTML,
  inline `onclick=` handlers). Match the surrounding style rather than introducing modern syntax
  or a framework.
- User input rendered into HTML must go through `esc()` (~line 841) to avoid XSS.
