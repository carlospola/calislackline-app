# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An AI calisthenics/gym coaching web app ("AIlistenics"), in Italian. Athletes run guided
training sessions in a chat UI driven by Claude; a coach/admin assigns programs and reviews
logs. There is **no build step and no package.json** — it's a static frontend plus three Vercel
serverless functions. Deployed on Vercel at `ailistenics.com` (hardcoded in OAuth/reset redirect URLs).

## Architecture

Three layers, no framework:

- **`index.html`** (~2480 lines) — the *entire* SPA: markup, CSS, and all JS in one file. Plain
  ES5-style `var`/`function`, no modules, no bundler. UI is a set of `.screen` divs toggled by
  `showScreen(id)`; only one is `.active` at a time (login, dash, profile, session, progress,
  admin, onboard). Global mutable state lives at the top of the `<script>` block
  (`currentUser`, `currentProfile`, `sessionHistory`, `sessionLog`, `currentSessionId`,
  `currentSetNum`, etc., starting ~line 842).
- **`reset.html`** — standalone password-reset page (served at `/reset` via `vercel.json` rewrite).
- **`api/*.js`** — Vercel serverless functions (Node, `export default async function handler`).

Data and auth go through **Supabase** directly from the browser using the anon key
(`SUPABASE_ANON_KEY` in `index.html`, line ~842). **PKCE OAuth flow**: the Supabase client is
created with `detectSessionInUrl:false` (both `index.html` ~line 847 and `reset.html`), so the
`?code` returned to `/` (and `/reset`) is exchanged **once, manually**, via `exchangeCodeForSession`
in `init()`. Leaving auto-detect on caused a double-exchange race against the single-use PKCE code
that failed the first load ("Errore autenticazione. Riprova.") — **do not set it back to `true`.**
The browser talks to Supabase
for all reads and athlete-scoped writes; privileged operations go through `/api/admin`.
**RLS is enabled on every table** (see the table list below), so those browser-side reads/writes are
constrained by per-row policies — the anon key alone grants nothing beyond what a policy allows.

### The serverless functions

- **`api/chat.js`** — proxies to the Anthropic Messages API (`claude-sonnet-4-5`, max_tokens 1000).
  Keeps `ANTHROPIC_API_KEY` server-side. Frontend posts `{system, messages}`; this is the only
  thing standing between the browser and the model. Protected by an **auth gate**: before forwarding
  to Anthropic, the handler reads the caller's Supabase JWT from the `Authorization: Bearer <token>`
  header and verifies it via `GET /auth/v1/user` (same logic and `apikey`/header as `api/admin.js`,
  but **without** the role check). It returns `401` if the token is missing or invalid. **On top of
  the JWT gate there is now a pending-gate**: the handler reads `profiles.status` with the service
  role (same fetch pattern as `api/admin.js`, reading `status` instead of `role`) and requires
  `status === 'active'` — otherwise it returns `403 { error: 'account_not_active' }`. (`inactive`
  accounts are already blocked at login by the frontend; `pending` accounts can log in but cannot use
  the chat.) CORS is still wide open (`*`), but `Allow-Headers` now
  includes `Authorization` and a valid **logged-in user token is required**. The frontend attaches
  the token in `aiSend()` (it pulls the current session's `access_token` from `sb.auth.getSession()`,
  same source as `adminFetch()`); on a `401` it shows a visible "Sessione scaduta" message, and on a
  `403` a dedicated "account non attivo" bubble, to the athlete. This closes the previously-open
  proxy; **per-user rate-limiting remains as a phase-2 follow-up.**

  **Coach prompt engine (motore-prompt, ACTIVE).** After the auth/status gates and **before**
  forwarding to Anthropic, the handler reads two rows from the new `settings` table (key/value)
  with the service role: `coach_prompt_global` (the **common** coaching behavior shared by every
  session) plus a per-type **delta** chosen by `body.session_type` — `coach_prompt_bodyweight`
  or `coach_prompt_gym`. The `typeKey` is **hardcoded** to those two keys (never interpolated from
  user input → **no injection**). It joins them (`motor = [global, delta].filter(p=>p).join('\n\n')`)
  and **prepends** the result to `body.system` (`finalSystem = motor ? motor + '\n\n' + body.system
  : body.system`), so the assembled order is **common → delta → program system**. The read is a
  **non-blocking fallback**: if the query fails or both values are empty, `motor=''` and behavior is
  unchanged (`finalSystem === body.system`). The frontend sends `session_type` in the POST body from
  `aiSend()` (defaults to `'bodyweight'`). **When editing this file, keep the motor block intact and
  keep the common→delta order.** The motor *text* is edited in `settings` (Supabase **Table Editor**),
  **not in code**; the per-program **RIR target belongs in the program's `coach_rules`, not in the
  motor** (the motor is shared across athletes/programs). Landed in commits `ab18084`, `f1d4245`.
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

### Supabase tables (inferred from queries — there are no migration files in the repo)

- `profiles` — one per user. `role` (`admin`/`athlete`), `status` (`pending`/`active`),
  plus a large set of athlete fields (`eta`, `peso`, `altezza`, `livello`, `obiettivo`,
  `discipline`, `infortuni`, etc.). Admin identified by `email === ADMIN_EMAIL` (line ~843).
- `programs` — many per user. Key fields: `coach_rules` (the AI system prompt for the program —
  **now reduced to program-specific rules only**, since the common coaching behavior lives in the
  `settings` motor; the per-program **RIR target stays here**), `workout_csv`, `ai_prompt` (extra
  coach notes), `session_type` (`bodyweight` | `gym`). A placeholder is kept when there's nothing
  specific, because the admin form currently **blocks saving an empty `coach_rules`** (a validation
  worth removing — see open items). Migrated to the motor: **BBR, Petra, Cate**; **not** migrated:
  **Muscle-Up Pro** (mixed + isometrics) and **New Workout** (max-out).
- `sessions` — one row per training session, written **incrementally during the session** (not at
  the end — there is no "fine"). `log_data` (structured JSON `{workout, programId, chosenWorkout,
  exercises:[{name, sets:[{reps,rir,rpe,weight,note,setNum}]}]}`) is the source of truth and drives
  all the progress charts; `programId`/`chosenWorkout` also make the session resumable. `log_text`
  (human-readable summary) is **legacy/unused in the current flow** — the log modal renders its
  summary from `log_data` via `buildLogSummary()`.
- `session_drafts` — **legacy/abandoned.** The table still exists in the DB but the app no longer
  reads or writes it (the `saveDraftSession`/`checkDraftSession`/`resumeDraftSession`/`clearDraftSession`
  functions were removed). Resume now runs off the most recent `sessions` row (see the session flow below).
- `exercises` — exercise library managed in the admin screen. `owner_id` (nullable) scopes ownership;
  **global** exercises have `owner_id is null` (readable by all, writable only by admins).
- `settings` — key/value table backing the **coach prompt engine**, **read only server-side** by
  `api/chat.js` with the service role (there is no browser query and no admin UI for it). Rows:
  `coach_prompt_global` (common behavior) + `coach_prompt_bodyweight` / `coach_prompt_gym` (per-type
  deltas). Edited via the Supabase **Table Editor**.

**Row-Level Security is enabled on all of these tables.** Policies scope rows to their owner via
`auth.uid()`, with an `is_admin()` `SECURITY DEFINER` function granting admins full access (the
`SECURITY DEFINER` wrapper avoids the infinite recursion you'd hit querying `profiles` from inside a
`profiles` policy). **`api/admin.js` and `api/chat.js` use the service-role key and bypass RLS
entirely — their JWT/role/status gates are the only protection on those endpoints and must stay
intact.** The migration lives in the **Supabase SQL editor, not in this repo** (hence "no migration
files" above: none are version-controlled here).

## The AI session flow (most important to understand)

**Pre-chat workout picker.** Before the session opens, `startSessionWithPrompt()` (~line 1083)
parses the program's `workout_csv` with `parseWorkoutCsv()` (~line 1640, groups rows by the
`workout` column). If the CSV defines **≥2 workouts**, it shows a picker overlay
(`#workoutPickerOverlay` / `showWorkoutPicker`) so the athlete chooses which one to run; with
0–1 workouts it skips straight to `beginSession()`. `beginSession()` (~line 1117) calls
`buildFilteredCsv()` (~line 1679) to rebuild the CSV with only the chosen workout's block
(header + its rows; falls back to the full CSV if the workout isn't found), so the system prompt
carries just that one workout instead of the whole program (**API-cost reduction**). It sets
`sessionWorkout = "Programma — Workout"` (display name) and initializes the in-memory
`sessionLog = {workout, programId, chosenWorkout, exercises:[]}` with `currentSessionId = null`
— the `programId`/`chosenWorkout` are what make the session resumable later.

**The chat loop.** In `aiSend()` (~line 1284):

1. The **system prompt** is assembled per-message from `coach_rules`/`ai_prompt` + the (already
   **filtered**) `workout_csv` + athlete context (`buildAthleteContext`, ~line 2360, only on the
   first message of a session). This `body.system` is then **prefixed server-side** by the
   `settings` motor (common → per-type delta) in `api/chat.js` — see the `api/chat.js` entry above.
2. History is **always** trimmed to `MAX_HISTORY = 12` messages (~line 1296). The old "keep full
   history on `fine`/`recap`" exception is gone (those buttons were removed).
3. The model drives the UI through **bracket tags in its replies**:
   - `[SET:ExerciseName]` / `[SUPERSET:A, B]` → `detectAndRenderInput()` (~line 1195) renders the
     reps/RIR input fields, and `updateSetInfo()` (~line 1433) updates the set-info box. The
     displayed `Set N/TOT` is now **frontend-owned**: `N` comes from `nextSetNum()` (deterministic,
     see below), **not** parsed from the AI's tag; only `TOT` is read from the CSV (with the AI tag's
     `/TOT` as fallback). `currentSetNum` (used for dedup on write) is set from `nextSetNum`, never
     from the model's number.
   - **Target box per session type:** in both `updateSetInfo()` (the `[SET:]` path) and
     `selectExercise()` (the tap path), **gym** programs (`currentProfile.session_type==='gym'`)
     show the target **weight** (CSV **Note** column) in the box under the reps **instead of the
     Tempo**; bodyweight is unchanged. No per-row label, no element-ID change.
   - **Inline input row (reps · RIR · weight).** The single-mode `renderInputFields()` output and the
     `#weightRow` block live in **one flex wrapper** (`gap:8px`, `align-items:flex-end`), so the row
     reads **[ Reps ] [ RIR ] [ Peso ]** with widths **1:1:1** (`#inputContainer` `flex:2` wrapping an
     inner `1fr 1fr` grid for reps/RIR, + `#weightRow` `flex:1`). The weight (`#weightRow`) is
     **appended on the right** and shown **only when `session_type==='gym'`** — keeping it last means
     reps/RIR stay in a **fixed position in both modes** (**do not move the weight to the left** — it
     breaks the bodyweight/gym consistency). The JS show/hide of the weight is **unchanged**
     (`wrow.style.display = 'block'/'none'`; the inline `flex:1` survives because the JS only touches
     `.display`). Each of the 3 box labels carries `min-height:30px` + `display:flex;
     align-items:flex-end;justify-content:center;text-align:center;` so the 1- and 2-line labels
     (e.g. "RIPETIZIONI" vs "RIPETIZIONI IN RISERVA") bottom-align and center over their box.
     **Keyboards & anti-zoom:** reps/RIR (`#reps_a/b`, `#rir_a/b`) use
     `inputmode="numeric" pattern="[0-9]*"`, the weight (`#weightInput`) uses `inputmode="decimal"`;
     and a CSS rule **`#sessionScreen input, #sessionScreen textarea { font-size:16px !important; }`**
     keeps every session input at 16px so iOS/Android don't zoom on tap (**don't drop session inputs
     below 16px**).

**Tappable exercise list (free order).** The session topbar has two buttons — **← Torna** and
**lista**. **lista** (`showWorkoutList()`, ~line 1733) opens an overlay listing every exercise from
the program CSV (grouped by workout). Tapping a row calls `selectExercise(name)` (~line 1704), which
prepares the single-exercise input **as if the AI had emitted `[SET:name]`** — without calling the
model: it sets `currentExercises=[name]`, fills the set-info box (target reps/tempo from the CSV),
calls `setInputLocked(false)`, and sets `currentSetNum = nextSetNum(name)`. This lets the athlete log
exercises in **any order** instead of following the AI's sequence. **Warm-up rows are not tappable**:
a row is treated as warm-up when its CSV **Note** field matches `/riscald|warm/i` — it renders with
the `.wlist-ex-warmup` class and **no `onclick`**. (The old **skip** button and its
`qSend`/`buildSkipMessage` helpers were removed — `lista` covers free-order navigation.)

**Per-set persistence (no "fine" button).** There is no explicit "end session" action — every
logged set is written to `sessions` immediately:

- `sendMsg()` (~line 1202) builds the set(s) for the current input (both exercises for a superset)
  for any field with `reps > 0`. In the **single-exercise branch** it prepends `Esercizio: <name>`
  to the chat message so the model knows which exercise was logged (needed now that order is free).
  Each set is stamped with `setNum: currentSetNum`, the **deterministic** number from `nextSetNum()`
  (= sets already logged for that name + 1), owned by the frontend on **both** paths (tap and AI
  `[SET:]` tag). **RIR is `null` when the field is blank; RPE/Fatica is `null` when
  no fatigue button is selected** — a *declared* `0` stays `0`. Charts treat `null` as "not declared"
  and exclude it, while `0` is a real value (see `getExSets` / `buildLogSummary` and the chart code).
- It calls `queueAutosave()` → `persistSets()` (~line 1335), serialized through a promise chain so
  rapid sets never race. On the **first** set, `persistSets` **INSERTs** a new `sessions` row
  (`{user_id, workout_name, log_data: sessionLog}`) and stores its id in `currentSessionId`; on every
  later set it **UPDATEs** the full `log_data`, **overwriting the set with the same exercise name +
  `setNum`** instead of appending (so re-sending a set — e.g. when the AI asks for a missing RIR —
  does not duplicate it). **Demo sessions are not persisted.**
- The athlete leaves with **← Torna** (`showDash`), which also stops the recovery timer. `log_text`
  is never written here. `COACH_LOG_FORMAT` and `saveSessionLog()` still exist in the file but are
  **dead/unused** — the old `WORKOUT LOG` + `[LOG_DATA:{…}]` end-of-session mechanism was removed.

**Explicit resume.** Resuming is a dashboard action anchored on `sessions`/`log_data` (not on a chat
transcript). `showDash()` (~line 1011) shows a **"Riprendi"** panel at the top of the dashboard when
the most recent `sessions` row is **within 24h**, carries a `programId`, and that program still
exists; the panel shows the workout name and how many sets were logged. **"Riprendi"** calls
`resumeSession()` (~line 1143): it reattaches `currentSessionId` to that row, hydrates `sessionLog`
from its `log_data`, rebuilds `currentProfile` from the program (re-filtering the CSV by the stored
`chosenWorkout`), starts a **clean chat** with a "Bentornato" note plus a re-brief built from
`buildLogSummary()` (it does **not** replay the old chat), and keeps logging into the **same** row —
so a resumed session stays one `sessions` row. **"Inizia"** always starts a brand-new session.

When changing prompt assembly, the bracket-tag contract, the `log_data` shape, or the RIR/RPE `null`
semantics, keep `detectAndRenderInput`/`updateSetInfo` and `selectExercise` (the two paths that
prepare an input), `nextSetNum` (which owns the deterministic `currentSetNum`), `persistSets`
(which writes `log_data`), `buildLogSummary`, and the chart code (which reads
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
  by `api/chat.js`** (for its JWT auth gate and pending-gate; reused, not new).
- The frontend Supabase URL and anon key are hardcoded in `index.html` / `reset.html`.

## Item aperti (TODO)

- **Timer recupero in background:** the recovery timer stops when the tab is backgrounded
  (interval throttling). Fix by computing elapsed time from a stored **timestamp** instead of
  counting ticks.
- **Validazione `coach_rules` non vuoto:** the admin form blocks saving an empty `coach_rules`.
  Now that common behavior lives in the motor, this validation should be **removed** so a program
  can carry only its specifics (or nothing).
- **Leva 2 — prompt caching:** now enableable. The `settings` motor is a **static prefix** of the
  system prompt, so it's a natural `cache_control` breakpoint to cut `api/chat.js` API cost.

## Regole di lavoro

These are mandatory working rules for this repository. Follow them on every change.

1. **Never rewrite `index.html` wholesale for small changes.** It is a single ~2480-line file;
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
   ~line 1212) — do not add placeholder hint text.
6. **Never disable Supabase RLS.** RLS is enabled on every table and is the real boundary for all
   browser-side reads/writes (the anon key is public). Any new table — or any new browser query
   against an existing one — must ship with its own policy. `api/admin.js` and `api/chat.js` use the
   service-role key and bypass RLS, so their auth gates are not optional.
7. **Do not reintroduce removed/regressed behaviors.** Specifically: (a) the **skip** button is
   gone — don't add it back (`qSend`/`buildSkipMessage` were removed; the tappable **lista** covers
   free-order navigation); (b) never derive a set's `setNum` from the AI's `Set N/TOT` for logging —
   `setNum` is frontend-owned via `nextSetNum` (the AI number is display-only); (c) never set the
   Supabase client's `detectSessionInUrl` back to `true` (see the PKCE note above); (d) **the AI must
   not police exercise order** — free order is enforced by the frontend (the athlete picks from
   `lista`), not by `coach_rules`.

## Conventions

- All user-facing copy is **Italian** — match it when adding UI text.
- Frontend code is ES5-flavored (`var`, function declarations, string concatenation for HTML,
  inline `onclick=` handlers). Match the surrounding style rather than introducing modern syntax
  or a framework.
- User input rendered into HTML must go through `esc()` (~line 862) to avoid XSS.
