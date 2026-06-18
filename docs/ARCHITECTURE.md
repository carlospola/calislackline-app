\# Architecture

&#x20;

\## Frontend

\- \*\*Framework:\*\* Nessuno — HTML/CSS/JS vanilla. \*\*MULTI-FILE dal refactor fase 1 (giugno 2026):\*\*

&#x20; - `index.html` (\~1787 righe; pre-refactor 2757) — markup + core JS: auth/init, dashboard, sessione AI (avvio/chat/aiSend/sendMsg), parsing CSV + picker + lista, setNum + persistenza `log\_data`, timer, chat rendering, onboarding, utility comuni (`esc`/`showScreen`/`closeModal`), client `sb`, var globali in testa allo `<script>`. NB: il MARKUP della libreria esercizi (toolbar + modale `exerciseModal`) e del modale log (`#logModal`) — con i rispettivi onclick — resta qui; le funzioni sono in `admin-ui.js` / `log.js`. **`buildLogSummary` RESTA nel core** (helper puro di riassunto log, usato da `resumeSession` e `openLogModal`)

&#x20; - `styles.css` — tutto il CSS (ex blocco `<style>`), `<link>` nel `<head>`

&#x20; - `progress.js` — schermata Progressi/grafici: stato co-locato + 10 funzioni (switchProgressTab, showProgress, destroyChart, numOrNull, getExSets, makeBarOpts, renderProgressCharts, calNavMonth, renderOverviewCharts, renderHeatmapMonth)

&#x20; - `admin-ui.js` — admin panel (19 funzioni showAdmin…removeProgram) + template (renderTemplates…applyToAll + `editingTemplateId`/`assigningTemplateId`) + `startTestSession` + libreria esercizi (5 funzioni loadLibrary/filterLibrary/openExerciseModal/saveExercise/deleteExercise + var `allExercises`, spostate da `index.html` il 15/06; markup/onclick restano in `index.html`). \*\*⚠️ NON confondere con `api/admin.js` (serverless)\*\*

&#x20; - `log.js` — modale log: var `currentLogSession` + 4 funzioni (openLogModal/toggleLogEdit/saveLogEdit/deleteLog), estratte da `index.html` il 15/06; il markup `#logModal` e gli onclick restano in `index.html`. **`buildLogSummary` NON è qui** (resta nel core di `index.html`)

\- \*\*Ordine di caricamento (NON cambiare):\*\* `<link styles.css>` nel `<head>`; in coda al `<body>`: `<script>` inline → `<script src="progress.js">` → `<script src="admin-ui.js">` → `<script src="log.js">`. Script \*\*CLASSICI non-module\*\*: funzioni e var restano GLOBALI — gli onclick/onchange inline e le chiamate cross-file ci contano. NON convertire in ES modules. (L'ordine non è vincolante per la correttezza — tutte le call cross-file sono post-load via global scope — ma è la convenzione attuale.)

\- \*\*Punti di contatto cross-file (via global scope):\*\* `handleSession→showAdmin`; `showDash→renderTemplates` (ritorno test session, tab `atabTemplates`); `admin-ui.js` → `esc`/`showScreen`/`closeModal`/`sb`/`startSessionWithPrompt` + R/W su `currentProfile`/`testSession`; `progress.js` → `esc`/`showScreen`/`sb`/`Chart`. \*\*log.js\*\* ↔ resto: core→log.js (`showDash→openLogModal`, via onclick del log-item in dashboard); log.js→core (`openLogModal→buildLogSummary`; `saveLogEdit`/`deleteLog`→`showDash`, con guard `typeof`); log.js→admin-ui.js (`deleteLog→renderLogTable`, con guard `typeof`); admin-ui.js→log.js (`openLogModalById→openLogModal`). Il ramo `role` di `deleteLog` (admin→`renderLogTable`, atleta→`showDash`) è invariato.

\- \*\*Il CORE SESSIONE AI resta in `index.html` DI PROPOSITO\*\* (protocollo implicito sendMsg→nextSetNum→persistSets→reader): non estrarlo.

\- \*\*Styling:\*\* CSS custom in `styles.css` (variabili CSS, dark theme, mobile-first)

\- \*\*Font:\*\* DM Mono + Syne (Google Fonts)

\- \*\*Routing:\*\* nessuno — single-page app con `showScreen(id)` che mostra/nasconde div

\- \*\*Stato globale:\*\* variabili mutabili in cima allo `<script>` (`currentUser`, `currentProfile`, `sessionHistory`, `sessionLog`, `currentSessionId`, `currentSetNum`, `currentSetMode`, `currentExercises`, `currentSetState`, `assigningTemplateId`, `testSession`, ecc.)

\- \*\*Supabase SDK:\*\* `@supabase/supabase-js@2` via CDN

\- \*\*Chart.js:\*\* `chart.js@4.4.0` via CDN (grafici progressi)

\## Backend

\- \*\*Runtime:\*\* Vercel Serverless Functions (Node.js)

\- \*\*`/api/chat.js`\*\* — proxy verso Anthropic (`claude-sonnet-4-5`, max\_tokens 1000). Riceve `{system, messages, session\_type}`, restituisce la risposta AI completa (la `usage` torna al frontend → utile per i token di cache in Network). \*\*Auth gate\*\*: verifica il JWT Supabase (`GET /auth/v1/user`), altrimenti 401. \*\*Gate status (ATTIVO, 12/06):\*\* dopo il JWT, legge `profiles.status` con la service role → `active` passa; `pending` = TRIALIST → passa per le prime `TRIAL\_SESSIONS=3` sessioni (count via GET `sessions?user\_id=eq.{u.id}&select=created\_at&order=created\_at.desc` per `u.id` del JWT, service role; se la sessione più recente è < 24h non conta — finestra "Riprendi"; commit `21b25ff`), oltre → 403 `{ error: 'trial\_exhausted' }` (fail-closed: count indeterminato → trial\_exhausted; la count include le sessioni "Allenamento libero", semplificazione MVP); `inactive`/sconosciuto/assente → 403 `{ error: 'account\_not\_active' }` invariato. \*\*Hardening verificato:\*\* la decisione si basa solo su `u.id` del JWT + profilo via service role, nessun campo del body la influenza. CORS aperto (`\*`) ma token + status obbligatori. Frontend: `aiSend` allega l'access token; su 401 tenta `sb.auth.refreshSession()` e ritenta la fetch UNA volta (stesso `chatBody`), bubble "Sessione scaduta" solo se anche il retry fallisce (commit `d87ecfe`); su 403 bubble "account non ancora attivo". Manca ancora il rate-limit per-utente (Fase 2).

&#x20; - \*\*⚠️ PREREQUISITO ADMIN:\*\* il pending-gate vale ANCHE per l'admin. La test session "Prova" parte dall'account admin, quindi l'admin DEVE avere `profiles.status='active'` (sennò 403). Risolto via `update profiles set status='active' where role='admin'`. Hardening opzionale ANCORA APERTO (TASKS 🟢): gate = `status==='active' || role==='admin'` (il gate trial 1A è ora implementato — vedi sotto; questo bypass admin resta separato e non urgente, il fix dati basta).

&#x20; - \*\*✅ MOTORE-PROMPT (ATTIVO — COMPLETO, giugno 2026):\*\* `chat.js`, DOPO i gate e PRIMA di Anthropic, legge da `settings` (service role): comune `coach\_prompt\_global` + delta per tipo (`coach\_prompt\_gym` | `coach\_prompt\_bodyweight`) scelto da `body.session\_type` (typeKey HARDCODED -> no injection). `motor = \[global, delta].filter(p=>p).join('\\n\\n')`. Fallback non bloccante (`motor=''`). Il MOTORE include: il \*\*WARM-UP OBBLIGATORIO\*\*, il blocco \*\*"PRECEDENZA — FILOSOFIA DI PROGRAMMA"\*\* (i coach\_rules che dichiarano una filosofia propria — maxout, mista — prevalgono sui punti in conflitto; il resto resta regolato dal motore) e il blocco \*\*"VALUTAZIONE DEL RANGE"\*\* + anti-fotocopia (estremi inclusi; tetto del range = SUCCESSO; "sopra" = solo oltre il tetto; gli schemi feedback sono esempi di contenuto, vietata la frase identica su esercizi/set diversi). \*\*NOTA (correzione doc):\*\* la regola "autoregolazione reattiva sì / progressione proattiva no" NON è un blocco dedicato — è espressa NEGLI SCHEMI FEEDBACK (global + delta). TUTTI i 9 programmi girano sul motore; New Workout (maxout) e Muscle-Up Pro (misto) hanno coach\_rules snelli con override di filosofia (vedi AI\_RULES).

&#x20; - \*\*✅ LEVA 2 — PROMPT CACHING (ATTIVO):\*\* `system` = ARRAY di blocchi quando `motor` non vuoto:

&#x20;   ```js

&#x20;   { type: 'text', text: motor, cache\_control: { type: 'ephemeral' } } // motore cachato

&#x20;   { type: 'text', text: body.system }                                  // solo se presente

&#x20;   ```

&#x20;   Se `motor` vuoto, `system` = stringa `body.system` (fallback). Motore \~1.900 token > minimo 1.024 (cresciuto di \~250 con precedenza + valutazione range, ma nel blocco CACHATO \~10% del prezzo). \~90% di taglio sulla porzione statica. Commit `ee173c7`.

&#x20; - \*\*Composizione finale:\*\* `\[ motor (cached) , system\_del\_frontend ]`, dove `system\_del\_frontend` = `coach\_rules`/`ai\_prompt` + `workout\_csv` (filtrato) + `athleteContext` (SOLO primo turno). NON rompere ordine/struttura.

\- \*\*`/api/admin.js`\*\* — operazioni protette DB (service role, bypassa RLS). \*\*Auth gate\*\*: JWT + `profiles.role === 'admin'`, altrimenti 401/403. Frontend via `adminFetch()` (`{action, ...}`). \*\*`adminFetch` su `401` (token scaduto da tab in background) fa `sb.auth.refreshSession()` + 1 retry della stessa fetch col token nuovo\*\* (retry isolato nella helper → tutti i ~12 call-site invariati; cfr aiSend `d87ecfe` / persistSets `3088677`; commit `adfe5cc`).

&#x20; - \*\*Action atleti/programmi:\*\* updateProfile, updateStatus, addProgram, editProgram, removeProgram, deleteUser, createUser.

&#x20; - \*\*✅ Action template:\*\* `addTemplate`, `editTemplate`, `removeTemplate`, `assignTemplate`, `repushTemplate` ("Applica a tutti" — riscrive SOLO `program\_name`/`coach\_rules`/`workout\_csv`/`ai\_prompt`/`session\_type`; `workouts` RIMOSSO, `74b72bd`). Le LETTURE le fa il frontend via SDK.

&#x20; - \*\*Futuro — apply periodizzazione:\*\* l'apply dei carichi suggeriti dall'AI passa da `editProgram` sulla riga `programs` del SINGOLO atleta (NON dal template). Vedi sezione Periodizzazione.

\- \*\*`/api/callback.js`\*\* — redirect OAuth (PKCE): `type=recovery` → `/reset?code=`, altrimenti `/?code=`.

\## Auth (OAuth PKCE)

\- Client Supabase: `{ auth: { flowType:'pkce', autoRefreshToken:true, detectSessionInUrl:false, persistSession:true } }` (index.html \~848, reset.html \~74).

\- \*\*`detectSessionInUrl: false` è CRITICO:\*\* il codice PKCE è MONOUSO; con `true` race tra lo scambio in background e `exchangeCodeForSession(code)` manuale → "Errore autenticazione". NON rimettere `true`.

\- `callback.js`: login `?code` -> `/?code=`; recovery -> `/reset?code=`.

\- \*\*⚠️ EMAIL/PASSWORD NON ATTIVO — intero path (correzione di stato, giugno 2026):\*\* funziona SOLO Google OAuth (PKCE). NON è solo il reset rotto: anche login/signup via email+password non funziona.

\- \*\*✅ PIANO (16/06) — ACCESSO EMAIL via OTP A CODICE (sostituisce email/password, TASKS 🟡 1B):\*\* anziché riparare il magic-link/PKCE, si passa a un \*\*OTP a 6 cifre Supabase\*\*. Flusso: form signup `nickname + email` → `signInWithOtp` (template email col \*\*token\*\*, SENZA `emailRedirectTo`) → `verifyOtp({ type:'email' })` → `updateUser({ password })`. Unifica \*\*signup, login e reset\*\* in UN solo meccanismo a codice e \*\*SCAVALCA\*\* la macchina `/reset` rotta (il codice si digita IN-APP, nessun callback → non si tocca PKCE/`detectSessionInUrl`). Le password restano (login durevole); il reset = di nuovo OTP. \*\*DIPENDENZA HARD: SMTP custom / provider transazionale\*\* (il mailer Supabase di default è \~2 mail/ora best-effort, inutilizzabile in produzione) → \*\*Resend\*\* raccomandato (SMTP custom, tier gratuito, SPF/DKIM sul dominio), CONDIVISO con la mail resoconto e il dominio custom. Config NON-repo: template email Supabase col token + SMTP custom. \*\*NON rimettere `detectSessionInUrl: true`.\*\*

\## Database

\- \*\*Tipo:\*\* Supabase PostgreSQL · \*\*URL:\*\* `https://efziohgwsvplqandzawz.supabase.co`

\- \*\*RLS:\*\* ABILITATO su tutte le tabelle. Policy owner via `auth.uid()` + `is\_admin()` (SECURITY DEFINER). `admin.js`/`chat.js` (service role) BYPASSANO la RLS.

\### Tabelle principali:

```

profiles

&#x20; id uuid (FK auth.users), email, name, role ('athlete'|'admin'),

&#x20; status ('active'|'pending'|'inactive')  <-- l'ADMIN deve essere 'active' (pending-gate chat.js)

&#x20;                                         <-- trial funnel 1A (12/06): 'pending' = TRIALIST

&#x20;                                              (logga + chatta fino a N=3); conversione admin

&#x20;                                              -> 'active'. NESSUN valore nuovo. status/role

&#x20;                                              READ-ONLY ai non-admin via trigger

&#x20;                                              trg_protect_profile_fields (vedi RLS sotto).

&#x20; eta, sesso, peso, altezza, livello, frequenza, discipline, skill,

&#x20; obiettivo, obiettivo3m, disponibilita, luogo, attrezzatura,

&#x20; infortuni, limitazioni, stile, sonno, motivazione, note\_libere, created\_at

&#x20;

programs

&#x20; id uuid, user\_id uuid (FK profiles)  <-- SINGOLO atleta

&#x20; template\_id uuid (FK program\_templates, ON DELETE SET NULL)  <-- aggancio al template

&#x20; program\_name text, ai\_prompt text,   <-- (colonna `workouts` RIMOSSA 14/06: codice commit `2618335` + DROP DB nel SQL Editor)

&#x20; coach\_rules text (solo gli specifici per-programma; qui anche il RIR target e gli

&#x20;   override di FILOSOFIA — maxout/misto — che il motore rispetta via blocco PRECEDENZA),

&#x20; workout\_csv text, session\_type text ('bodyweight'|'gym'), created\_at

&#x20;   <-- session\_type ora RISTRETTO al motore (delta coach\_prompt) + DB; NON pilota più la UI peso

&#x20;       (visibilità #weightRow + box ora PER-ESERCIZIO via colonna CSV `peso`, vedi Descrittore)

&#x20;   <-- workout\_csv: colonne workout, esercizio/nome, reps, tempo, recupero, peso (alias carico), note

&#x20;

program\_templates   <-- SOURCE OF TRUTH (libreria template riassegnabili)

&#x20; id uuid, program\_name text NOT NULL,   <-- (colonna `workouts` jsonb RIMOSSA 14/06: codice commit `2618335` + DROP DB nel SQL Editor)

&#x20; coach\_rules, workout\_csv, ai\_prompt, session\_type (default 'bodyweight'), created\_at

&#x20;

sessions

&#x20; id uuid, user\_id uuid (FK profiles), workout\_name text,

&#x20; log\_text text (LEGACY), 

&#x20; log\_data jsonb  SOURCE OF TRUTH, scritta INCREMENTALMENTE:

&#x20;   { workout, programId, chosenWorkout,

&#x20;     exercises:\[{ name, sets:\[{reps,rir,rpe,weight,note,setNum}] }] }

&#x20; created\_at

&#x20;

exercises

&#x20; id, name, category, muscles, equipment, level, progressions, cue,

&#x20; default\_rest, notes, owner\_id (null = globale), created\_at

&#x20;

settings

&#x20; key text (PK): 'coach\_prompt\_global' | 'coach\_prompt\_bodyweight' | 'coach\_prompt\_gym'

&#x20; value text  testo del MOTORE; '' = riga vuota

&#x20; -- letta SOLO dal backend (chat.js, service role); si modifica dal Table Editor, NON dal codice

&#x20; -- 'coach\_prompt\_global' contiene ora: warm-up OBBLIGATORIO (+ eccezione ripresa),

&#x20; --  blocco PRECEDENZA — FILOSOFIA DI PROGRAMMA, blocco VALUTAZIONE DEL RANGE + anti-fotocopia.

&#x20; --  La regola reattiva/proattiva vive NEGLI SCHEMI FEEDBACK (global + delta), non come blocco.

```

> session\_drafts: tabella RIMOSSA — non reintrodurla.

> \*\*✅ Profilo SLIM self-serve (DECISO 16/06):\*\* la UI self-serve in-app raccoglie SOLO `nickname`
> (→ `name`). Gli altri campi profilo (biometrie, `infortuni`, salute, obiettivi…) restano colonne
> NULLABLE nel DB ma NON sono chiesti nel self-serve: si popolano SOLO dal questionario di CONVERSIONE
> "Richiedi il coaching" (con consenso salute esplicito). \*\*Semplificazione SOLO-UI → NESSUNA
> migration\*\* (le colonne non si toccano). Conseguenza coaching: `athleteContext` resta snello/vuoto
> nel self-serve (la test session prova già che il motore gira su profilo neutro) → la rete di
> sicurezza infortuni si sposta su contenuto di prova a basso rischio + segnalazione dolore in chat +
> disclaimer medico nei Termini. Vedi AI_RULES ("athleteContext") e la sezione Privacy sotto.

&#x20;

\## Sessione demo / non-persistita (VIVA — base della test session admin)

> NB: la sessione demo NON è stata rimossa. È VIVA e ci si appoggia la test session admin.

> ⚠️ Il FUTURO trial funnel NON la usa: le sessioni trial PERSISTONO (vedi sezione dedicata).

```

Flag:    currentProfile.\_isDemo (bool) + currentProfile.\_orig (deep copy del profilo da ripristinare)

Attivata da:

&#x20; - startDemoSession()  -> onboarding / dashboard atleta ("prova")

&#x20; - startTestSession(templateId)  -> test session admin (vedi sotto)

Non-persistenza:  persistSets() ha la guardia  if(currentProfile \&\& currentProfile.\_isDemo) return;

&#x20;                 -> nessun INSERT/UPDATE su sessions, currentSessionId resta null.

&#x20;                 queueAutosave chiama comunque persistSets, che esce subito.

Ripristino:       showDash() -> if(\_isDemo \&\& \_orig) currentProfile = \_orig;

```

> La test session si aggancia alla PRIMITIVA (`\_isDemo` + restore), NON al flow onboarding: anche

> rimuovendo l'ingresso demo dell'onboarding, la test session sopravvive finché resta la guardia.

&#x20;

\## Sistema template (libreria programmi) — modello

```

Modello: SNAPSHOT + REPUSH. Il template = source of truth. Le copie (programs.template\_id) sono

snapshot; il contenuto si riallinea SOLO con un "Applica a tutti" deliberato.

&#x20;

CREA   -> addTemplate          EDITA -> editTemplate          ELIMINA -> removeTemplate (FK SET NULL)

ASSEGNA-> assignTemplate (INSERT programs con template\_id + user\_id; status=active)

APPLICA A TUTTI -> repushTemplate (PATCH programs?template\_id=eq.{id}, SOLI campi contenuto)

LISTA  -> frontend diretto via SDK (RLS admin)

&#x20;

REGOLE CHIAVE

\- Collegare (set template\_id) NON cambia il contenuto.

\- "Applica a tutti" sovrascrive program\_name + tutti i campi contenuto di OGNI copia (incl. nome) ->

&#x20; sotto UN template solo programmi che devono diventare lo STESSO programma.

\- workouts NON propagato. Migrazione FATTA (9 template; amici + copie agganciati).

\- ⚠️ Carichi/progressioni PER-ATLETA vivono sulla COPIA (editProgram), NON sul template -> dopo

&#x20; una personalizzazione quel programma DIVERGE dal template (fork aperto, vedi Periodizzazione).

&#x20;

UI (tab "Template" admin)

\- #tab-templates + #templateList (renderTemplates via SDK)

\- modal #templateFormModal (tplName/tplType/tplRules/tplCsv/tplPrompt)

\- per card: "Modifica" / "Elimina" / "Assegna" (#assignModal + #assignAthleteSelect -> confirmAssign)

&#x20; / "Prova" (test session, vedi sotto) / "Applica a tutti" (applyToAll -> repushTemplate)

\- riga "Assegnato a: X, Y"; hook switchTab: if(tab==='templates') renderTemplates();

\- bottone tab: id "atabTemplates" (usato dal ritorno della test session)

```

&#x20;

\## ✅ Test sessione admin ("Prova") — flusso

```

Card template -> "Prova" -> startTestSession(templateId):

&#x20; t = window.\_templates.find(id)

&#x20; guard: se !t.workout\_csv -> alert("Template senza esercizi (workout\_csv vuoto)"); return

&#x20; orig = deep copy di currentProfile

&#x20; currentProfile = { \_isDemo:true, \_orig:orig }   <-- profilo NEUTRO (athleteContext vuoto -> no leak)

&#x20; testSession = true

&#x20; startSessionWithPrompt(t.program\_name, t.coach\_rules, t.workout\_csv, t.ai\_prompt, t.session\_type, null)

&#x20;

\-> da qui è una sessione AI REALE (picker multi-workout, chat, box, timer, RIR/RPE, peso se gym,

&#x20;  warm-up obbligatorio) ma NON persistita (\_isDemo -> persistSets esce -> niente sessions/log\_data;

&#x20;  niente INSERT programs; currentSessionId null).

"← Torna" -> showDash:

&#x20; ripristina \_orig (profilo admin) e, se testSession, -> showScreen('adminScreen') + attiva tab

&#x20; Template (atabTemplates / #tab-templates) + renderTemplates(); return (NON la dashboard atleta).

```

> Niente nuovo endpoint/DB. Solo `index.html`/`admin-ui.js`. ID/VAR: `atabTemplates`, `testSession`.

&#x20;

\## Funnel trial self-serve (Google) — accesso + conversione (✅ LIVE 13/06 — completo, verificato Test C)

> Voce TASKS 🔴 (1A). DECISIONE: ibrido — entrata self-serve, approvazione admin alla CONVERSIONE

> (richiesta di coaching). Lancio SOLO-GOOGLE (email verificata; niente mail di conferma/password).

```

(1) PERSISTENZA: le sessioni trial scrivono normalmente su sessions/log\_data — NON usano \_isDemo

&#x20;   (i Progressi popolati = parte del wow + dati che l'admin vede all'approvazione).

&#x20;   Stato trial = RIUSO di 'pending' (DECISO 12/06, nessun valore nuovo): pending = trialist (logga+chatta fino a N), conversione admin -> active.

(2) GATE N SERVER-SIDE nel gate di chat.js — ✅ FATTO (12/06, raffinato 13/06 commit 21b25ff): TRIAL_SESSIONS=3.

&#x20;   active -> passa; pending -> entra nel gate. Count: GET su

&#x20;   sessions?user_id=eq.{u.id}&select=created_at&order=created_at.desc (service role, u.id dal JWT,

&#x20;   mai dal body). used = rows.length; se la sessione piu recente e < 24h -> used -= 1 (e "in corso",

&#x20;   finestra "Riprendi": non consuma il trial). Passa se Number.isFinite(used) && used < 3, altrimenti

&#x20;   403 {"error":"trial_exhausted"}; fail-closed (fetch non-ok / non-array -> NaN -> 403). La count

&#x20;   include le sessioni "Allenamento libero" (MVP). Hardening verificato (decisione solo su u.id del

&#x20;   JWT + profilo service role). CTA "Richiedi il coaching" sul 403 = FATTA lato frontend (commit 5323bd3).

(3) TEMPLATE DI PROVA = template NORMALE della libreria "Prova — Full Body" (corpo libero, 1 workout

&#x20;   -> niente picker), auto-assegnato al primo login da TRIGGER DB (trg_assign_trial_program, vedi

&#x20;   sezione dedicata sotto), NON dal frontend. Contenuto creato e collaudato (autoreg. RIR bidirezionale).

FORK CHIUSI (12/06): N=3 (TRIAL_SESSIONS); "sessione consumata" = riga in sessions (nasce al primo

&#x20;   persistSets; chat senza log non consuma, edge MVP); stato trial = riuso 'pending'. Variante

&#x20;   "completata" resta gated dietro "Fine sessione chiara". ✅ TUTTO CHIUSO (13/06): template +

&#x20;   frontend (CTA) + auto-assegnazione (trigger) + Test C live PASSATO (account Google nuovo).

```

> \*\*✅ POSIZIONAMENTO "Richiedi il coaching" (DECISO 16/06):\*\* su landing FREDDA è un \*\*link
> secondario\*\* (l'ingresso di prova resta primario — il fossato si capisce provandolo); IN-APP la CTA
> vive sul `403 trial_exhausted` (già esistente) + eventuale link discreto in dashboard. \*\*NON\*\* va
> nella mail del codice OTP (mono-scopo per deliverability).

> \*\*✅ CONVERSIONE = MANUALE all'inizio (DECISO 16/06):\*\* i primi 1-3 trialist si convertono a mano
> (mailto → admin `pending`→`active` + incasso manuale). \*\*Stripe è GATED dietro la prima conversione
> manuale\*\* — vedi PROJECT_OVERVIEW + TASKS.

&#x20;

\## Auto-assegnazione template trial (trigger DB)

Al primo login la riga `profiles` nasce dal frontend (`loadProfile()`, `index.html` \~821: INSERT con `status:'pending'` se il profilo non esiste — NON è un upsert, NON c'è trigger applicativo su `auth.users`).

Su questo INSERT scatta `trg\_assign\_trial\_program` (AFTER INSERT su `public.profiles`) → function `assign\_trial\_program` (SECURITY DEFINER, `search\_path=public`):

\- Guardia: agisce SOLO se `new.role = 'athlete' AND new.status = 'pending'` → admin e inserimenti manuali con altro status non ricevono il trial; gli atleti esistenti hanno già la riga `profiles`, quindi l'AFTER INSERT non scatta mai per loro.

\- Lookup template per UUID hardcoded `193af02e-faaf-4f36-bf79-2110e5a886a0` ("Prova — Full Body"). Rinominare il template non rompe nulla; se eliminato → `found=false` → nessun programma, login intatto.

\- Copia in `programs`: `program\_name, coach\_rules, workout\_csv, ai\_prompt, session\_type` (NON copia `workouts`, vestigiale). `id`/`created\_at` via default DB.

\- `exception when others then return new`: il trigger non blocca MAI la creazione del profilo (trade-off MVP: un errore resta silenzioso — meglio un trialist senza programma, recuperabile a mano, che un signup fallito).

\- Applicato via SQL Editor + verificato (Test C, 13/06). NON rimuovere. Migration nel SQL editor, non nel repo. Coesiste con `trg\_protect\_profile\_fields` (BEFORE UPDATE, status/role read-only ai non-admin).

\## (PIANIFICATO) Mail resoconto AI settimanale + scheduler unico

> Voce TASKS 🟡. Retention: l'AI legge i log e manda un recap in linguaggio coach.

```

SCHEDULER: VERCEL CRON su nuovo endpoint api/ (gratuito) — UNICO, CONDIVISO col reminder

&#x20; allenamento (🔴): per ogni atleta decide -> allenato = candidato resoconto; fermo da X giorni =

&#x20; candidato reminder. Due mail, una infrastruttura.

DATI: AGGREGATORE JS deterministico (1 riga/esercizio: miglior set, RIR medio/trend, volume vs

&#x20; settimana prima) — CONDIVISO con "Analisi AI progressioni" (si costruisce UNA volta). La mail è

&#x20; il banco di prova a basso rischio della periodizzazione: l'AI COMUNICA soltanto, niente apply,

&#x20; niente coach-in-the-loop obbligatorio, niente editor tabellare come prerequisito.

GRAFICI: Chart.js NON gira nelle email. MVP = NIENTE immagini: resoconto testuale (3-4 frasi) +

&#x20; numeri chiave + LINK "Vedi i grafici" -> schermata Progressi (riporta l'atleta in app).

&#x20; Avanzato: PNG via QuickChart (renderizza config Chart.js via URL — i config sono in progress.js).

CANALE: provider transazionale futuro (vedi "Dominio email", gated rebranding) — NON Apps Script

&#x20; (in smontaggio). Costo: \~1-2 cent/atleta/settimana.

```

&#x20;

\## (PIANIFICATO) Logo/icona home screen — PASSO 1 della PWA

> Voce TASKS 🟡. Indipendente dal service worker (che resta PASSO 2, prerequisito store).

```

manifest.json minimo (nome, icone 192/512px, theme scuro, display:standalone)  -> Android/Chrome

<link rel="apple-touch-icon">                                                   -> iOS/Safari

favicon.ico                                                                     -> chiude il 404 noto

= TRE file statici + due righe nel <head> di index.html. Zero JS, zero rischio sintassi.

Prerequisito: asset logo quadrato \~1024px. Rebranding NON bloccante (rifare 3 icone è irrisorio).

```

&#x20;

\## RLS (Row Level Security)

Abilitata su tutte le tabelle. Browser (anon key + JWT) filtrato dalle policy; service role bypassa.

```sql

create function public.is\_admin() returns boolean

&#x20; language sql stable security definer set search\_path = public

as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'); $$;

```

\- `profiles` — select/update: `auth.uid()=id OR is\_admin()`; insert: `auth.uid()=id` (role='athlete', status='pending'); update atleta vincolato a role='athlete'.

\- `sessions` — select/insert/update/delete owner-or-admin. (Le "Allenamento libero" usano lo stesso insert owner.)

\- `programs` — select owner-or-admin; write `is\_admin()`.

\- `exercises` — select `owner\_id is null OR owner\_id=auth.uid() OR is\_admin()`; write `is\_admin()`.

\- `program\_templates` — SELECT/INSERT/UPDATE/DELETE tutte `is\_admin()`.

> Migration nel SQL editor, NON nel repo. \*\*✅ Self-activation gap CHIUSA (12/06):\*\* trigger `trg\_protect\_profile\_fields` + function `protect\_profile\_fields` (SECURITY DEFINER, search\_path=public) su `public.profiles`, BEFORE UPDATE: `status`/`role` READ-ONLY ai non-admin (`is distinct from` → `raise exception`); service role/SQL Editor (`auth.uid()` null) e admin da browser passano. Applicato + verificato in produzione (P0001 da atleta; update normale OK; cambio status da admin OK). `policies.sql` (riga 33) documenta ancora solo lo snapshot 2026-06-02.

&#x20;

\## Picker workout + filtro CSV (Leva 1)

```

parseWorkoutCsv(csv)        -> { headerLine, orderedWorkouts, rowsByWorkout, fieldsByWorkout }

&#x20; fieldsByWorkout\[] include ora il campo `peso` (header CSV `peso`, alias `carico`); retrocompat:

&#x20; CSV senza colonna peso -> field.peso vuoto. Colonne CSV: workout, esercizio/nome, reps, tempo, recupero, peso (alias carico), note.

buildFilteredCsv(csv, nome) -> header + righe del solo workout scelto (fallback: CSV intero)

startSessionWithPrompt(...): se orderedWorkouts.length >= 2 -> showWorkoutPicker, altrimenti beginSession

beginSession(..., chosenWorkout):

&#x20; csvToUse -> currentProfile.workout\_csv (solo questo nel system)

&#x20; sessionLog = { workout, programId, chosenWorkout, exercises:\[] }; currentSessionId = null

&#x20; aiSend('Inizia sessione: '+displayName, isFirst=true)

```

> `orderedWorkouts` (l'ORDINE dei workout nel CSV) è la base di "Progressione programma" (sotto).

&#x20;

\## Lista tappabile + setNum deterministico (Stage 2)

```

nextSetNum(name): conta i set già loggati per `name` in sessionLog.exercises + 1.

&#x20; IL FRONTEND POSSIEDE IL setNum su tap E tag AI. NON parsare la "Set N/TOT" dell'AI per il LOGGING.

selectExercise(name): chiude overlay; currentSetNum=nextSetNum; mode='single'; renderInputFields;

&#x20; setInputLocked(false); popola i 4 box dal CSV. TARGET BOX PER ESERCIZIO (weighted = colonna peso non vuota -> Peso, altrimenti Tempo); currentWeighted = field.peso non vuoto.

updateSetInfo(text): currentSetNum=nextSetNum(logName); N da nextSetNum + TOT dal CSV.

sendMsg (single): antepone "Esercizio: <nome>".

Warm-up non-tappabile: /riscald|warm/i sulla Note -> .wlist-ex-warmup (no onclick).

```

&#x20;

\## Session Screen — Architettura UI

```

TOPBAR: <- Torna | Titolo | LIVE | lista

INFO BOX (3): \[Esercizio / Set N/TOT] | \[Target reps / PESO se weighted (colonna peso) altrimenti TEMPO — es. "12-15 per lato"] | \[RECUPERO / Timer / Start]

CHAT: bubble AI (solo feedback testuale)

OVERLAY #workoutPickerOverlay (scelta workout pre-chat) / #workoutListOverlay (esercizi tappabili)

INPUT: \[#inputContainer 1fr 1fr: Reps | RIR] \[#weightRow: Peso kg, solo se weighted (per-esercizio, colonna peso), a destra]

&#x20;      \[RPE/Fatica 1-10 opzionali] \[note + send]

ANTI-ZOOM: #sessionScreen input,textarea { font-size:16px !important; }

```

> Topbar SOLO "Torna" + "lista". Chiusura con "Torna".

> ✅ SHIPPED: la visibilità del peso (#weightRow) e il tipo di box sono PER-ESERCIZIO, pilotati da `currentWeighted` (colonna CSV `peso`), NON da `session_type`. `session_type` resta solo per il motore (delta coach_prompt) e per il DB (vedi sezione "Descrittore per-esercizio").

> Il vecchio quirk "New Workout Note = varianti" è RISOLTO: la Note NON pilota più il box peso (ora dalla colonna `peso` dedicata).

&#x20;

\## Session Data Flow

```

Atleta -> Dashboard -> "Inizia" -> startSessionWithPrompt() (picker se multi-workout) -> beginSession

Atleta -> "Riprendi" (sessione < 24h, programId) -> resumeSession(sessionRow, program)

Admin  -> tab Template -> "Prova" -> startTestSession (demo non-persist)

&#x20;

aiSend (per messaggio):

&#x20; system\_frontend = coach\_rules/ai\_prompt + workout\_csv (filtrato) + athleteContext (SOLO 1° turno)

&#x20; body.session\_type (per il motore); chat.js antepone il MOTORE come BLOCCO CACHATO (Leva 2)

&#x20; messages = history troncata a 12; allega access token

&#x20; updateSetInfo -> 3 box + currentSetNum; fmtText rimuove tag; addBubble (quick-options, \[PRONTO], set)

&#x20;

Logging PER-SERIE (niente "fine"):

&#x20; sendMsg costruisce i set con reps>0; RIR/RPE null se non dichiarati; setNum=currentSetNum

&#x20; queueAutosave -> persistSets (merge in sessionLog, fuori da try/catch) -> persistSetsWrite (INSERT 1ª serie -> currentSessionId; poi UPDATE con dedup nome+setNum; ritorna true se ok)

&#x20; persistSetsWrite fallita (error sull'UPDATE / throw di .single() sull'INSERT) -> sb.auth.refreshSession() + 1 retry della scrittura (token scaduto da tab in background su mobile, cfr aiSend d87ecfe; commit 3088677)

&#x20; SESSIONI DEMO/TEST NON persistite (guardia \_isDemo)

&#x20;

Chiusura "← Torna" -> showDash: ferma timer; ripristina \_orig se demo; se testSession -> torna ad admin.

deleteLog (fix 7f8315d): role==='admin' -> solo renderLogTable() (resta su adminScreen);

&#x20; atleta -> showDash().

```

&#x20;

\## Descrittore per-esercizio — peso ✅ SHIPPED (colonna CSV), isometrici PIANIFICATI

> Voce TASKS "Peso per-esercizio" = ✅ SHIPPED via colonna CSV dedicata `peso`. "Logging isometrici"

> (metric=time) resta PIANIFICATO. Frontend-only, no migration.

> Il lato PROMPT del misto è GIÀ coperto (coach\_rules MUP).

```

✅ PESO PER-ESERCIZIO (SHIPPED). La visibilità del peso (#weightRow) e il tipo di box NON dipendono

più da session\_type: dipendono da currentWeighted, calcolato PER-ESERCIZIO dalla colonna CSV `peso`.

&#x20; exIsWeighted(peso): true se la cella `peso` non è vuota; il valore del peso è anche il TARGET nel box.

&#x20; parseWorkoutCsv riconosce l'header `peso` (alias `carico`) -> field.peso (retrocompat: CSV senza

&#x20;   colonna -> field.peso vuoto -> esercizio a corpo libero).

&#x20; currentWeighted (NUOVA var globale): impostata in updateSetInfo (da csvPeso del set-line AI; per i

&#x20;   superset = esercizio PRIMARIO) e in selectExercise (da field.peso). Pilota show/hide #weightRow e

&#x20;   il tipo di box; LETTA da sendMsg per il GATING del peso loggato.

&#x20; beginSession e resumeSession resettano #weightRow a display:none all'avvio (visibilità ora

&#x20;   PER-ESERCIZIO, non per-sessione).

&#x20; Box: weighted -> mostra il PESO (= valore colonna peso); altrimenti Tempo (updateSetInfo dal

&#x20;   set-line AI; selectExercise da field.tempo).

SUPERATO l'approccio Note (regex kg + fallback session\_type==='gym' + gym->Note-come-peso): la Note

&#x20; NON pilota più il box peso. Quirk New Workout (Note=varianti) RISOLTO.

session\_type RISTRETTO al motore (delta coach\_prompt in chat.js) e al DB; non pilota più la UI peso.

ISOMETRICI (metric=time) — ANCORA PIANIFICATO:

&#x20; metric = /\\d+\\s\*(sec|min)/i sulle Reps ? 'time' : 'reps'

&#x20; metric='time': label "Secondi", NIENTE RIR, RPE opzionale, peso se weighted.

&#x20; MVP: secondi nel campo `reps` (+ relabel Progressi). Avanzato: campo `seconds` (jsonb).

Il MOTORE resta separato (stile di coaching della sessione, non tipo del singolo esercizio).

NON introdurre session\_type 'mixed'.

(FUTURO 💡 elastici: estensione con load:'kg'|'band'|none — parcheggiata in TASKS.)

```

&#x20;

## Progressione programma — modello a FASI + vista dettaglio (SHIPPED giugno 2026)

> Frontend-only (index.html), no migration. Deterministico. Sostituisce il vecchio modello ROTAZIONE (programProgress, rimosso).

```
Modello: un programma periodizzato multi-fase vive in UN template/CSV; i nomi workout sono PREFISSATI "Fase N - <sessione>". Il prefisso rende i nomi unici (evita il collasso del parser su nomi uguali) e codifica la fase. Retrocompat: nomi SENZA prefisso -> nessuna fase -> rotazione piatta.
phaseOf(name): /Fase\s*(\d+)/i -> numero | null.
stripPhase(name): rimuove "Fase N - " per il display.
programDayStates(program, sessions): per la FASE CORRENTE (= phaseOf dell'ultima sessione del programma; altrimenti la fase piu' bassa) calcola i giorni della fase e il loro stato. "Completato nel ciclo corrente" e' DETERMINISTICO via min-count:
  count[giorno] = n. sessioni con quel chosenWorkout nella fase corrente
  min  = minimo dei count
  done = count > min            (smorzato, tag "fatto")
  continua = primo giorno (ordine CSV) con count == min   (anello accent, label "Continua")
Day-0 e fine-ciclo: tutti i count a zero o tutti pari -> niente giorni smorzati, continua = primo giorno.
Vista dettaglio (screen programDetailScreen):
  openProgram(prog) e' chiamata dal tap sul programma in showDash:
    < 2 workout  -> beginSession diretto
    >= 2 workout -> openProgramDetail(prog) (async: ri-query sessions, render giorni)
  Giorno fatto: opacity 0.45 + tag "fatto". Giorno "continua": boxShadow anello accent + "Continua".
  Tap su un giorno -> beginSession col nome COMPLETO (prefisso "Fase N - " incluso).
  Topbar replicata da profileScreen; back -> showDash().
  Fasi superiori non ancora raggiunte: solo una riga muta "Fase N bloccata" (AVANZAMENTO DI FASE NON ANCORA IMPLEMENTATO - gap noto).
Rimosso: pannello dashboard "Prossimo allenamento" (HTML #programProgressPanel + popolamento in showDash), ridondante con la vista dettaglio. Rimossa la funzione programProgress (vecchia rotazione "dopo l'ultimo", dead code, zero chiamanti).
PICKER NON E' MORTO (nota anti-regressione): showWorkoutPicker / closeWorkoutPicker / startSessionWithPrompt / overlay #workoutPickerOverlay (#wpickTitle/#wpickBody) NON sono orfani. Il flusso PROGRAMMA non li usa piu' (ora passa da openProgramDetail), MA restano vivi tramite la test session admin "Prova": admin-ui.js -> startSessionWithPrompt -> showWorkoutPicker. NON rimuoverli. Le classi CSS .wpick-btn / .wpick-sub sono riusate da openProgramDetail: NON rimuoverle da styles.css.
```

&#x20;

\## (PIANIFICATO) Periodizzazione attiva — Analisi AI progressioni + deload (GATED)

> Voce TASKS (Avanzato/GATED). Tocca chat.js + editProgram + semantica template.

```

L'AI legge i risultati loggati e SUGGERISCE progressione carichi + deload. ON-DEMAND (fine

settimana/mesociclo), NON real-time -> centesimi.

Design: core DETERMINISTICO in JS a ZERO token (double progression: top range + RIR≥target -> +carico;

deload se RIR crolla/reps calano a parità di carico; deload ogni N settimane) + AI SOTTILE solo per

giudizio/comunicazione (trend rumorosi, "perché" in linguaggio coach).

Leva dati: input COMPATTI pre-aggregati (1 riga/esercizio: miglior set, RIR medio/trend, volume vs

settimana prima), NON log\_data grezzo (-5/10×). Cache prompt-template (stile Leva 2).

L'AGGREGATORE è CONDIVISO con la "Mail resoconto AI settimanale" (che ne è il banco di prova).

APPLY (semi-automatico DI PROPOSITO):

&#x20; AI propone cambi ASTRATTI ("+2,5kg"/"tieni"/"deload -10%" + motivo), NON CSV

&#x20; -> MAPPER deterministico -> numeri formattati secondo le regole CSV

&#x20; -> TABELLA (editor tabellare) come DIFF -> coach approva -> SERIALIZER riscrive workout\_csv -> editProgram

&#x20; Il CSV cambia SOLO all'approvazione.

DIPENDENZA: il round-trip parse<->serialize dell'EDITOR TABELLARE è la superficie di apply sicura.

TARGET DI APPLY = PER-ATLETA (editProgram sulla riga programs della copia), NON sul template.

&#x20; FORK APERTO: il programma DIVERGE dal template -> "Applica a tutti" sovrascriverebbe i carichi

&#x20; personalizzati. Regola futura: template tiene la STRUTTURA, carichi personalizzati sulla COPIA.

⚠️ SICUREZZA: coach-in-the-loop OBBLIGATORIO (mai salti di carico automatici). MVP = tutto approvato.

TIE-IN: estende il fossato dal "durante" al "tra" le sessioni (RIR/RPE già raccolti real-time).

GATED dietro: Progressione sequenziale (MVP) + "Fine sessione chiara" + dati + paganti.

```

&#x20;

\## (PIANIFICATO) Editor tabellare programmi (admin, CSV↔tabella)

> Voce TASKS (ALZATA: prereq dell'apply periodizzazione). Frontend-only.

```

Due viste dello STESSO dato: textarea CSV (RESTA, per incollare da Claude) + tabella editabile.

parse: parseWorkoutCsv -> 1 riga/esercizio (raggruppate per workout, 1 cella = 1 input)

salva: ricostruisci CSV -> editProgram (adminFetch)

MVP: toggle "CSV grezzo ↔ Tabella"; editing celle; serializzatore conforme alle regole CSV.

Dopo: aggiungi/elimina/riordina righe; dropdown nome dalla LIBRERIA (risolve naming-match).

RISCHIO CHIAVE: round-trip LOSSLESS (parse -> tabella -> CSV deve ridare lo STESSO CSV: virgole nelle

&#x20; Note, celle vuote, warm-up, multi-workout). Test: ri-serializzare un CSV non modificato = identico.

```

&#x20;

\## (PIANIFICATO) Allenamento libero (log manuale, no AI)

> Voce TASKS. Frontend-only. ≠ Opzione 4 "Workout improvvisato" (lì l'AI GENERA).

```

Sessione SENZA programma: l'atleta scrive il nome esercizio e logga sets/reps/RIR/peso/RPE.

Riuso: persistSets/log\_data/nextSetNum/riga input. Come selectExercise ma nome da CAMPO TESTO

(autocomplete LIBRERIA + fallback testo libero -> grafici Progressi coerenti). INSERT sessions via

client + RLS owner. Niente picker/lista CSV, niente \[SET:] dall'AI. Senza programId -> NON riprendibile.

```

&#x20;

\## (PIANIFICATO) Landing + hero (riscrittura IT)

> Voce TASKS 🟡. Frontend-only (markup + copy in `index.html`). Decisione 16/06.

```

Hero IT — headline: "Il coach AI che adatta ogni serie alla tua fatica"

&#x20; sub: "Calisthenics e palestra. Dichiari quanto è dura una serie e l'AI ricalibra carico, ripetizioni

&#x20;       e recupero in tempo reale, durante l'allenamento non dopo."

&#x20; riga offerta: "Prova gratis: 3 allenamenti reali con il coach AI."

AZIONI: [Accedi con Google] (primaria) + [Crea account con email] (primaria, flusso OTP) +

&#x20;       "Richiedi il coaching" (link SECONDARIO).

FOOTER: link Privacy + Termini + nota consenso al login.

CLAIM: ancorati a ciò che il coach FA davvero (autoregolazione REATTIVA per centrare il target) —

&#x20;      NIENTE promesse su forma o progressione automatica nel durante-sessione.

⚠️ Il bottone "Crea account con email" resta NASCOSTO/disabilitato finché l'OTP (1B) non è pronto

&#x20;   (solo-Google nel frattempo) → non reintrodurre una porta morta.

```

\## (PIANIFICATO) Privacy + analytics (layer minimo)

> Voci TASKS 🟡. Decisione 16/06. Pagine statiche + metriche dai dati esistenti.

```

PRIVACY: pagine statiche Informativa privacy + Termini (link nel footer) + canale cancellazione.

&#x20; Col PROFILO SLIM (solo nickname) NIENTE dati Art. 9 (salute) nel funnel self-serve → niente consenso

&#x20; salute nel funnel, probabilmente NIENTE cookie banner (solo cookie di sessione). Il consenso salute

&#x20; è confinato al questionario di CONVERSIONE. Disclosure responsabili: Google, Supabase, Vercel,

&#x20; Anthropic (incl. trasferimento extra-UE USA + SCC/DPF; nota: l'API Anthropic ELABORA ma non ADDESTRA

&#x20; sui dati — da confermare nel DPA). Età minima 16. Disclaimer medico nei Termini. Testo da

&#x20; redigere/verificare (Iubenda o legale) — ⚠️ NON è consulenza legale.

ANALYTICS: due livelli.

&#x20; L1 (subito, costo privacy ZERO): metriche FUNNEL dai dati Supabase già presenti — signup Google vs

&#x20;    email, sessioni di prova, trial_exhausted, click "Richiedi il coaching", conversioni. Estende la

&#x20;    voce "Admin dashboard metrics".

&#x20; L2 (dopo): analytics di pagina COOKIELESS per comportamento/drop-off — Umami (self-host su Vercel +

&#x20;    Postgres Supabase) o Plausible hosted. EVITARE Google Analytics (cookie + banner). Privacy-first

&#x20;    per preservare il no-banner.

```

&#x20;

\## Hosting \& distribuzione

\- \*\*Frontend + API:\*\* Vercel (deploy automatico da GitHub, branch main)

\- \*\*Repo:\*\* `carlospola/calislackline-app` · \*\*Dominio:\*\* `ailistenics.com` (reset: `/reset` -> `reset.html`)

\- \*\*⚠️ Lezione OPS DNS (10-11/06):\*\* le mail Namecheap di verifica ICANN hanno deadline reale (sospensione → parking). A riattivazione avvenuta, la cache DNS del resolver locale può servire ancora l'IP di parking (198.54.117.x) fino a scadenza TTL → `ERR\_CONNECTION\_REFUSED` a dominio sano. Diagnosi: doppio `nslookup` (locale vs `8.8.8.8`). Bypass sempre disponibile: URL `\*.vercel.app`.

\- \*\*(PIANIFICATO) App store (GATED):\*\* impacchettare l'app web in un guscio nativo.

&#x20; - \*\*PASSO 1 (anticipato, 🟡):\*\* manifest + icone + favicon (vedi sezione Logo/icona). \*\*PASSO 2:\*\* PWA completa (service worker, installabilità, Lighthouse) = prerequisito store.

&#x20; - Google Play: TWA (PWABuilder/Bubblewrap), requisiti = manifest + service worker + HTTPS + Lighthouse ≥80 + Digital Asset Links; \~25$ una tantum; da Windows.

&#x20; - App Store: serve Mac/cloud-build + valore nativo (Guideline 4.2; un wrapper nudo viene rifiutato) → le NOTIFICHE PUSH del reminder sono il biglietto d'ingresso. \~99$/anno.

&#x20; - ⚠️ IAP Apple (3.1.1): sub in-app iOS via in-app purchase (15-30%); Stripe libero su web/Android → impatta il flusso pagamenti.

\## Ottimizzazioni costi API (attive)

\- Filtro CSV (Leva 1); troncamento history a 12; niente storico; athleteContext solo primo turno. \*\*Revisione 16/06 (profilo SLIM):\*\* nel self-serve l'athleteContext è snello/vuoto (solo nickname) → la vecchia nota "incl. infortuni — sicurezza" NON vale più per il self-serve; gli infortuni si raccolgono solo nel questionario di conversione. La rete di sicurezza self-serve = contenuto di prova a basso rischio + dolore segnalato in chat + disclaimer medico.

\- \*\*✅ Leva 2 — Prompt caching:\*\* `cache\_control: ephemeral` sul blocco motore in `chat.js` (\~90% taglio). Il motore è cresciuto di \~250 token (precedenza + valutazione range) ma nel blocco cachato; i coach\_rules MUP/NW dimagriti riducono il blocco NON cachato → sessioni più economiche.

\## Tag AI riconosciuti dal parser

```

\[SET:NomeEsercizio]     -> updateSetInfo + detectAndRenderInput, timer recupero

\[SUPERSET:Nome1,Nome2]  -> superset (per due esercizi DIVERSI; i monolaterali NON sono superset)

\[PRONTO]                -> fine warm-up: checklist come testo + bottone "Pronto" (warm-up OBBLIGATORIO)

```

> \[CUE:] RIMOSSO come feature, ma `fmtText` (~riga 1525) ne mantiene la strip DIFENSIVA (intenzionale, lasciarla). \[LOG\_DATA:] NON generato dall'AI. extractOptions ignora \[SET:]/\[SUPERSET:]/\[PRONTO].

&#x20;

\## COACH\_LOG\_FORMAT — RIMOSSO (15/06)

`COACH\_LOG\_FORMAT` e `saveSessionLog()` sono stati RIMOSSI da `index.html` (15/06; erano morti, zero chiamanti). Non reintrodurli.

> I protocolli "REGOLA FINE"/"WORKOUT LOG" sono stati RIMOSSI anche dai coach\_rules (zombie) — non reintrodurli.

&#x20;

\## Progressi — tracking peso

`renderProgressCharts` rileva set con `weight > 0`:

\- Con peso: PESO MAX / MEDIO / VOLUME; grafico "Peso massimo (kg)" (pLblPR/pLblAvg/pLblTot/pChartRepsTitle)

\- A corpo libero: MASSIMALE / MEDIA / TOT REPS; grafico "Media reps per set"

\- RIR/RPE `null` esclusi (`numOrNull`); 0 dichiarato valido.

> (FUTURO) per gli isometrici (secondi in `reps`): relabel per-esercizio della stat/grafico.

&#x20;

\## log\_data — due formati (backward compatible)

```

Nuovo: exercises\[].sets = \[{reps, rir, rpe, weight, note, setNum}]

Vecchio: exercises\[].reps/rir/sets (number)

Isometrici (MVP): secondi nel campo reps (+ relabel Progressi); avanzato: campo seconds dedicato.

```

&#x20;

\## (PIANIFICATO) Timer unico a timestamp

> Il fix del "timer recupero in background" (da `setInterval` decrementale a `Date.now()`) diventa il

> MOTORE-TIMER unico, base sia del recupero sia del timer-esercizio a tempo (plank ecc.), anche in

> background. INCATENATO a "Logging isometrici" (stessa regex, secondi -> reps). Stessa lezione del

> timer della Breathwork.

&#x20;

\## (PIANIFICATO) Breathwork — Respirazione a cicli (frontend-only)

> Nuovo screen full-screen via `showScreen(id)`, ingresso da una card. NIENTE backend/DB/API/token.

> Bolla (scale + transition ease-in-out della durata della fase), timer ritenzione con `Date.now()`.

> Protocollo come oggetto-dati ("descrittore": fasi/durate/hold/cue) per aggiungere tecniche senza

> riscrivere il player. Disclaimer di sicurezza al primo uso. v2 (salvataggio tempi) = migration dopo.

&#x20;

\## Sviluppo (workflow)

\- Repo: `\~/Desktop/calislackline-app` (Windows `C:\\Users\\39327\\Desktop\\calislackline-app`)

\- Windows PowerShell — NIENTE `\&\&` (un comando per riga). \*\*Node.js `v24.16.0` installato in locale (13/06)\*\* → `vercel dev` ora ATTIVO (preview locale, vedi sotto "Preview locale (vercel dev)"; TASKS ✅). Il vecchio "node non installato" è SUPERATO.

\- \*\*GATE DI SINTASSI PRE-DEPLOY (dettagli in CLAUDE.md):\*\* prima di OGNI push frontend, aprire `index.html` locale in Chrome INCOGNITO con console (F12): nessun `Uncaught SyntaxError`, nessun 404 su `styles.css`/`progress.js`/`admin-ui.js`, login visibile → safe to push. Poi verifica finale in produzione (Ctrl+F5; rollback Vercel 1-click se serve). Copre i syntax error (causa #1 pagina bianca) + errori runtime al load; i flussi specifici si verificano in produzione.

\- \*\*CLAUDE.md\*\* nel repo guida Claude Code — tienilo allineato.

\- Ciclo: descrivi -> piano/diff -> edit chirurgici -> GATE -> commit + push -> verifica produzione.

\- Backend (`api/\*.js`) e doc su `main`. Frontend (`index.html`/`styles.css`/`progress.js`/`admin-ui.js`) anche su `main` col gate prima e verifica Ctrl+F5 dopo.

\- I 4 .md (PROJECT\_OVERVIEW/ARCHITECTURE/TASKS/AI\_RULES) vivono nel Project (Claude.ai); CLAUDE.md li sostituisce per Claude Code.

\- I prompt (coach\_rules dei template) e il MOTORE (`settings`) vivono in Supabase: modificarli NON richiede commit/deploy.

\## Preview locale (vercel dev)

\- \*\*Avvio:\*\* `.\dev.ps1` dalla root — carica `.env.local` nella shell, poi lancia `vercel dev --listen 3000`. Frontend + serverless `api/\*.js` su `http://localhost:3000`. Validato end-to-end, inclusa una SESSIONE AI completa in locale.

\- \*\*GOTCHA — `vercel dev` NON inietta `.env.local` nelle serverless:\*\* le env vanno messe nell'AMBIENTE DELLA SHELL prima di lanciare. `dev.ps1` fa esattamente questo: `Get-Content .env.local` → `Set-Item Env:`. Senza, le funzioni partono con env vuote.

\- \*\*`.env.local` (gitignorato via `.env\*`) va POPOLATO A MANO coi valori veri:\*\* le variabili Vercel marcate \*\*Sensitive\*\* NON si scaricano con `vercel env pull` (arrivano vuote). Il \*\*service-role\*\* = la \*\*Secret key\*\* nuova di Supabase (`sb_secret_...`, Project Settings → API Keys). L'\*\*anon NON serve\*\* al backend (`chat.js` usa solo `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`).

\- \*\*⚠️ Env tirate da PRODUCTION → la preview tocca il DB Supabase REALE + token Anthropic reali\*\* (niente staging). Per i token è stata creata una \*\*API key Anthropic dedicata locale\*\* (`calislackline-local-dev`).

\- \*\*Debug `chat.js`:\*\* il `catch` del gate JWT INGOIA l'eccezione e ritorna `401 "Autenticazione fallita"`; in locale quel 401 ≈ "le env non sono caricate" → controllare che `.env.local` sia popolato e che `dev.ps1` l'abbia caricato nella shell.

\- \*\*File tooling (root):\*\* `dev.ps1` (launcher preview) + `.gitignore` (tracciato: ignora `.vercel`, `.env\*`).

\## (HARNESS) E2E Playwright — funnel trial

\- \*\*Struttura `e2e/`\*\* (cartella ISOLATA, `package.json` proprio — il repo resta no-build):

&#x20; - `lib/db.js` — seed/teardown via \*\*service-role\*\* (`createTrialist`, `getAssignedProgram`, `seedExhaustedSessions`, `countSessions`, `teardown`, `preSweep`, `signInAsUser`).

&#x20; - `specs/trial-funnel.spec.js` — la spec del gate trial (vedi sotto).

&#x20; - `scripts/` — `probe-auth.js` (verifica login programmatico) e `validate-seed.js` (smoke seed/teardown).

&#x20; - `playwright.config.js` — un project chromium, `baseURL http://localhost:3000`, \*\*senza `webServer`\*\* (dev server avviato a mano).

\- \*\*Isolamento (la sicurezza è TUTTA nelle guardie + teardown):\*\* tutte le operazioni passano dalla \*\*service-role\*\* e sono vincolate a email riservate `e2e+<ts>@ailistenics.test` (`RESERVED_RE`); \*\*`assertTestEmail` su OGNI delete\*\*; `preSweep` ripulisce residui di run crashati.

\- \*\*⚠️ Gira sul DB Supabase REALE\*\* (env da `vercel dev`/`.env.local`) → \*\*NON è uno staging isolato\*\*: niente DB separato, la protezione è solo le guardie email + il teardown in `afterAll` (eseguito anche su fallimento).

\- \*\*Spec trial:\*\* trialist con \*\*3 sessioni retrodatate 25h\*\* (oltre la finestra 24h → `used=3`, determinismo) → 4o avvio dal dashboard → \*\*POST `/api/chat` 403 `trial_exhausted`\*\* → CTA "Richiedi il coaching". Sessione iniettata via `signInAsUser` + `window.sb.auth.setSession` (no UI Google). \*\*403 PRIMA di Anthropic → zero token consumati.\*\*

\- \*\*Come si lancia:\*\* `.\dev.ps1` dalla root (dev server su :3000), poi da dentro `e2e/`: `npx playwright test`. Prereq: `NEXT_PUBLIC_SUPABASE_ANON_KEY` valorizzata in `.env.local` (publishable key). `e2e` è in `.vercelignore` → fuori dal deploy. Commit `7239400` (scaffold) + `14ed1d7` (spec).

\## Syntax-check pre-commit (commit `d258d6d`)

`scripts/syntax-check.js` (solo built-in `fs/os/path/child\_process`): estrae via regex i blocchi `<script>` SENZA `src` da `index.html`, li scrive in temp `.js` in `os.tmpdir()`, lancia `node --check`; poi `node --check` diretto su `progress.js`, `admin-ui.js` e `log.js`. Stampa `Syntax OK` (exit 0) o file+riga+errore (exit 1).

`.githooks/pre-commit` (sh, gira con Git Bash su Windows) invoca lo script e blocca il commit su exit≠0. Attivato con `git config core.hooksPath .githooks` (locale al repo). Escape d'emergenza: `git commit --no-verify`.

Copre il rischio CRITICO (syntax error = pagina bianca). Il gate manuale Chrome incognito resta utile per il VISIVO/runtime, ma la sintassi è ora coperta in automatico.

\## External Services

\- \*\*Supabase\*\* — Auth (SOLO Google OAuth PKCE attivo; email/password NON attivo — intero path), PostgreSQL

\- \*\*Anthropic API\*\* — Claude (`claude-sonnet-4-5`) via `/api/chat.js`

\- \*\*Google Apps Script\*\* — email conferma onboarding + mail richiesta coaching. \*\*⚠️ Usa la GEMINI API per generare il messaggio\*\* (dipendenza prima NON documentata). Sistema in OVERHAUL (vedi TASKS 🟡): non costruirci sopra; candidato sostituzione Gemini → Anthropic (un vendor, una chiave); parti del flusso spariranno se l'accesso passa dalle mail Supabase (1A/1B)

\- \*\*Google Fonts\*\* — DM Mono, Syne | \*\*Chart.js\*\* — grafici (CDN)

\- \*\*(PROSSIMO — non più gated dal rebranding, chiuso 16/06)\*\* Provider email transazionale: \*\*Resend raccomandato\*\* (SMTP custom su Supabase, tier gratuito, SPF/DKIM sul dominio). \*\*DIPENDENZA HARD del flusso OTP (1B)\*\* — il mailer Supabase di default (\~2 mail/ora) non basta in produzione. CONDIVISO tra: mail auth Supabase (OTP/SMTP custom) + mail resoconto/reminder + dominio email custom. \*\*QuickChart\*\* — eventuali grafici PNG nelle email (avanzato)

\## Variabili d'ambiente (Vercel)

```

ANTHROPIC\_API\_KEY            = sk-ant-...

NEXT\_PUBLIC\_SUPABASE\_URL     = https://efziohgwsvplqandzawz.supabase.co

SUPABASE\_SERVICE\_ROLE\_KEY    = eyJ...  (service role — solo backend)

```

&#x20;

\## Costanti / config frontend (pubbliche)

```

SUPABASE client auth opts = { flowType:'pkce', autoRefreshToken:true, detectSessionInUrl:false, persistSession:true }

SUPABASE\_ANON\_KEY = sb\_publishable\_...   (index.html \~842 — pubblica per design, protetta da RLS)

ADMIN\_EMAIL       = calislackline@gmail.com   (index.html \~843)

APPS\_URL          = https://script.google.com/macros/s/.../exec

```

&#x20;

