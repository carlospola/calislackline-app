\# AI Rules — AILISTENICS

&#x20;

\## General Rules

\- Leggi sempre PROJECT\_OVERVIEW, ARCHITECTURE e TASKS prima di proporre modifiche

\- Non rompere codice esistente — ogni modifica deve essere chirurgica

\- Modifica solo i file esplicitamente richiesti nel task

\- Prima di implementare: mostra il piano/diff, poi chiedi conferma

\- Se una modifica tocca auth o DB schema, chiedi sempre conferma esplicita

\- Mantieni naming conventions esistenti (camelCase JS, kebab-case CSS IDs)

\- \*\*Frontend MULTI-FILE (refactor fase 1, giugno 2026):\*\* `index.html` + `styles.css` + `progress.js` + `admin-ui.js`, script CLASSICI non-module → funzioni e var GLOBALI (gli onclick inline e le chiamate cross-file ci contano). TUTTE le Frontend Rules valgono per TUTTI i .js frontend. NON convertire in ES modules; NON cambiare l'ordine dei tag (inline → progress.js → admin-ui.js); NON estrarre il CORE SESSIONE AI da `index.html` (decisione di fase 1). `admin-ui.js` (frontend, root) ≠ `api/admin.js` (serverless). Eventuali nuove estrazioni (log modal, onboarding, libreria): SOLO su richiesta, col metodo recon dipendenze read-only → diff → gate → test funzionale

\## Sviluppo via Claude Code (repo locale)

\- Lo sviluppo del codice avviene via Claude Code sul repo `\~/Desktop/calislackline-app` (Windows: `C:\\Users\\39327\\Desktop\\calislackline-app`)

\- \*\*Ambiente Windows PowerShell:\*\* NIENTE `\&\&` (token non valido) — un comando per riga. \*\*Node.js `v24.16.0` installato in locale (13/06)\*\* (il vecchio "node non installato" è SUPERATO) → `vercel dev` ora possibile. \*\*GATE DI SINTASSI PRE-DEPLOY\*\* ora in DUE livelli: (a) AUTOMATICO — pre-commit hook (`core.hooksPath .githooks` → `scripts/syntax-check.js`, `node --check`) blocca il commit su `SyntaxError`; (b) MANUALE/VISIVO — `index.html` locale in Chrome INCOGNITO + console (F12), nessun `Uncaught SyntaxError` né 404 sui file esterni → safe to push; verifica finale in produzione (Ctrl+F5 su ailistenics.com; pochi utenti; rollback Vercel 1-click se serve)

\- \*\*Dare sempre o un prompt pronto da incollare in Claude Code, o step numerati\*\* — mai indicazioni vaghe

\- Il repo ha un \*\*CLAUDE.md\*\* che guida Claude Code (architettura + regole di lavoro) — tienilo allineato dopo modifiche importanti

\- Ciclo: descrivi modifica -> piano/diff -> approvi edit chirurgici -> GATE di sintassi -> commit + push -> verifica in produzione -> Vercel deploya da main

\- Backend (`api/\*.js`) e documentazione vanno dritti su `main`. Il frontend (`index.html`, `styles.css`, `progress.js`, `admin-ui.js`) va su `main` col GATE prima del push e verifica immediata Ctrl+F5 dopo (rollback pronto); l'anteprima Vercel resta non usabile (login -> produzione)

\- Git NON consuma usage di Claude: commit/push a mano sempre possibili

\- I prompt dei programmi/template (coach\_rules) E il testo del MOTORE (`settings`) vivono in Supabase (pannello admin / tab Template / Table Editor), NON nel codice: modificarli NON richiede commit/push

\## Frontend Rules

\- Mobile-first — testare mentalmente su schermo 375px

\- Dark theme obbligatorio — usare sempre le variabili CSS (`--bg`, `--accent`, `--text`, ecc.)

\- NO framework (no React, no Vue) — vanilla JS con `var`

\- NO backtick template literals nel JS — concatenazione stringa `'...' + var + '...'`

\- NO localStorage/sessionStorage

\- Onclick dentro stringhe HTML richiedono escape corretto: `\\\\'` per singole quotes

\- Input utente reso in HTML deve passare per `esc()` (XSS)

\- CSS inline accettato nei componenti dinamici (tabelle admin, chat bubbles, picker, lista, card template)

\- Font display Syne, font mono DM Mono — non cambiare

\- Accent `#c8f060` (verde lime) — non cambiare senza richiesta

\- Campi input session screen con placeholder VUOTO

\- \*\*Anti-zoom iOS/Android:\*\* input/textarea della session screen a `font-size:16px` — non abbassare

\- \*\*inputmode tastiere:\*\* reps/RIR = `inputmode="numeric" pattern="\[0-9]\*"`; peso = `inputmode="decimal"`

\## Backend Rules

\- Non modificare `/api/chat.js` senza mostrare prima il diff completo

\- Non modificare schema Supabase DB direttamente — proporre la migration SQL e attendere conferma

\- Non cambiare le action di `/api/admin.js` senza aggiornare anche il frontend

\- `SUPABASE\_SERVICE\_ROLE\_KEY` non va mai esposta nel frontend

\- Il modello AI e' `claude-sonnet-4-5` — non cambiare senza richiesta

\- Env vars backend: `ANTHROPIC\_API\_KEY`, `NEXT\_PUBLIC\_SUPABASE\_URL`, `SUPABASE\_SERVICE\_ROLE\_KEY`

\- `/api/admin.js` ha un \*\*auth gate\*\*: JWT + `profiles.role === 'admin'` — 401/403 altrimenti. Ogni chiamata frontend passa per `adminFetch`. Mantieni il gate (la service-role bypassa RLS)

\- `/api/chat.js` ha un \*\*auth gate\*\* (JWT -> 401) + un \*\*gate status\*\*. \*\*✅ Gate trial ATTIVO (12/06):\*\* `TRIAL\_SESSIONS=3` in cima al file; `active` → passa; `pending` = TRIALIST → passa se count(`sessions` per `u.id` del JWT, service role, `HEAD` + `Prefer count=exact`) < 3, altrimenti 403 `trial\_exhausted`; fail-closed (count indeterminato → trial\_exhausted; la count include le sessioni "Allenamento libero", MVP); `inactive`/sconosciuto → 403 `account\_not\_active`. \*\*Hardening verificato:\*\* decisione solo su `u.id` del JWT + profilo via service role, nessun campo del body. Frontend: `aiSend` allega l'access token; gestisce 401 e 403 (sul 403 mostra ancora il messaggio generico — CTA `trial\_exhausted` dedicata = prossimo intervento frontend 1A). Rate-limit per-utente ancora da fare (Fase 2). \*\*Modello `claude-sonnet-4-5` invariato; non rimuovere il gate trial.\*\*

\- \*\*⚠️ PREREQUISITO ADMIN per `/api/chat.js`:\*\* il pending-gate vale ANCHE per l'admin. L'admin deve avere `profiles.status='active'` o le sue chiamate (es. la test session "Prova") prendono 403 `account\_not\_active`. Risolto con `update profiles set status='active' where role='admin'`. \*\*Hardening opzionale (task 🟢):\*\* gate = `status==='active' || role==='admin'` (tocca `chat.js` → diff + conferma + deploy).

\- \*\*MOTORE-PROMPT in `/api/chat.js`:\*\* dopo i gate, legge dalla tabella `settings` (service role) il comune `coach\_prompt\_global` + il delta per tipo (`coach\_prompt\_gym`|`coach\_prompt\_bodyweight`) scelto da `body.session\_type` — \*\*typeKey HARDCODED\*\* (no injection). Unisce comune -> delta (`motor`). Fallback NON bloccante (`motor=''`). Il TESTO del motore si edita in `settings` (Table Editor), NON nel codice. `aiSend` deve continuare a inviare `session\_type`.

\- \*\*✅ LEVA 2 — PROMPT CACHING in `/api/chat.js`:\*\* il `system` mandato ad Anthropic è un \*\*ARRAY di blocchi\*\* quando `motor` è non vuoto: blocco 1 = `{ type:'text', text:motor, cache\_control:{ type:'ephemeral' } }`, blocco 2 = `{ type:'text', text:body.system }` (solo se presente). Se `motor` è vuoto, `system` resta la STRINGA `body.system` (fallback). NON rompere questa struttura, NON togliere il `cache\_control`, NON invertire l'ordine. Il motore deve restare ≥ 1.024 token o la cache non si attiva.

\## Sistema Template (libreria programmi) — regole

\- \*\*Tabella `program\_templates`\*\* = SOURCE OF TRUTH dei programmi. `programs.template\_id` (FK ON DELETE SET NULL) aggancia ogni copia al suo template.

\- \*\*Modello snapshot + repush:\*\* collegare (set `template\_id`) NON cambia il contenuto; lo riallinea SOLO un "Applica a tutti" (`repushTemplate`) deliberato.

\- \*\*`repushTemplate` ("Applica a tutti")\*\* riscrive SOLO i campi contenuto delle righe con quel `template\_id`: `program\_name`, `coach\_rules`, `workout\_csv`, `ai\_prompt`, `session\_type`. Lascia intatti `user\_id`/`template\_id`/`id`/`created\_at`. \*\*NON reintrodurre `workouts`\*\* (rimosso, vestigiale, mismatch jsonb/text). Conseguenza: dopo l'apply tutte le copie sotto un template diventano identiche (incl. il nome) → sotto UN template solo i programmi che devono essere lo STESSO programma.

\- \*\*`assignTemplate`\*\* crea un nuovo `programs` con `template\_id` + `user\_id` + i campi contenuto del template, e PATCH `profiles.status='active'`. (È anche il riuso candidato per l'auto-assegnazione del template di prova del trial funnel.)

\- \*\*`addTemplate`/`editTemplate`/`removeTemplate`\*\* action admin (gate admin). Le LETTURE le fa il frontend diretto via SDK (RLS admin).

\- \*\*RLS `program\_templates`:\*\* 4 policy admin-only (`is\_admin()`).

\- \*\*Il RIR target per-programma\*\* va nei `coach\_rules` del TEMPLATE (poi "Applica a tutti"), NON nel motore (dipende dalla filosofia: gym/ipertrofia \~3, BBR fascia 0-3, maxout 0-1).

\- \*\*Gli OVERRIDE DI FILOSOFIA (maxout/misto)\*\* vanno nei `coach\_rules` del TEMPLATE: il motore li rispetta via blocco PRECEDENZA (vedi sotto). NON duplicare nel coach\_rules le regole già nel motore (inizio sessione, formato output, RIR opzionale, warm-up): coach\_rules = SOLO gli specifici.

\- \*\*⚠️ PER-ATLETA vs TEMPLATE (rilevante per la futura periodizzazione AI):\*\* progressioni/carichi personalizzati di un SINGOLO atleta vanno applicati sulla sua COPIA (`editProgram` sulla riga `programs`), NON sul template, sennò "Applica a tutti" li spinge a tutti. Dopo una personalizzazione quel programma DIVERGE dal template → fork aperto (template-tiene-struttura vs carichi-su-copia, vedi TASKS).

\- \*\*UI tab Template:\*\* id NUOVI `tplName/tplType/tplRules/tplCsv/tplPrompt`, modal `#templateFormModal`, `#assignModal`/`#assignAthleteSelect`, funzioni renderTemplates/openTemplateForm/saveTemplate/deleteTemplate/openAssignModal/confirmAssign/applyToAll, var `assigningTemplateId`. Tab Template SEPARATO dal tab "Libreria".

\- \*\*✅ Test sessione admin ("Prova"):\*\* bottone "Prova" sulla card template → `startTestSession(templateId)`. Costruisce un profilo NEUTRO `{ \_isDemo:true, \_orig:<admin profile> }` (deep copy) e chiama `startSessionWithPrompt(t.program\_name, t.coach\_rules, t.workout\_csv, t.ai\_prompt, t.session\_type, null)`. Riusa la PRIMITIVA demo (`\_isDemo` → `persistSets` esce subito → niente `sessions`/`log\_data`/INSERT programs; `currentSessionId` resta null). Guard su `workout\_csv` (NON sui coach\_rules → si testano i template motore-only). `showDash`, se `testSession`, ripristina `\_orig` e torna ad `adminScreen` tab Template. \*\*ID/VAR NUOVI da non cambiare:\*\* `atabTemplates` (id del bottone tab), `testSession` (var globale in cima allo `<script>`).

\- \*\*⚠️ Il FUTURO trial funnel (TASKS 1A) NON usa `\_isDemo`:\*\* le sessioni trial PERSISTONO normalmente su `sessions`/`log\_data`. La primitiva demo resta per onboarding e test session admin.

\## Auth Rules (OAuth PKCE)

\- Client Supabase: `{ auth: { flowType:'pkce', autoRefreshToken:true, detectSessionInUrl:false, persistSession:true } }`

\- \*\*NON rimettere `detectSessionInUrl: true`\*\* (index.html \~848 e reset.html \~74): riapre il doppio scambio del codice PKCE monouso (race) → "Errore autenticazione". Lo scambio manuale `exchangeCodeForSession(code)` in `init()` deve restare l'unico consumer

\- `reset.html` deve mantenere lo stesso fix

\- `callback.js`: login `?code` -> `/?code=`; recovery (`type=recovery`) -> `/reset?code=`

\- \*\*⚠️ RESET PASSWORD ROTTO (correzione di stato, giugno 2026):\*\* il flusso recovery oggi NON funziona — i doc lo davano erroneamente ok. Il fix è legato al percorso email/password (TASKS 🟡 1B): `inviteUserByEmail` (invito → set password) e recovery sono LO STESSO MECCANISMO → un solo lavoro.

\## AI Coach Prompt Rules

> ✅ NOTA: le regole COMUNI sono CENTRALIZZATE nel MOTORE (tabella `settings`), anteposte da `/api/chat.js` al system in base a `session\_type` (e cachate via Leva 2). I `coach\_rules` per-programma/per-template tengono SOLO gli specifici (incl. RIR target e override di filosofia). \*\*TUTTI i 9 programmi sono migrati (giugno 2026)\*\*, inclusi Muscle-Up Pro (misto) e New Workout (maxout) via blocco PRECEDENZA + coach\_rules snelli.

\- Formato set: `\[SET:NomeEsercizio]\\nNome — Set N/TOT | X-Y reps | Tempo: 30X1 | Recupero: mm:ss`

\- Formato superset: `\[SUPERSET:Nome1,Nome2]`

\- \*\*✅ PRECEDENZA — FILOSOFIA DI PROGRAMMA (motore, `coach\_prompt\_global`):\*\* i `coach\_rules` possono dichiarare una FILOSOFIA propria (es. maxout, mista); sui punti in conflitto PREVALGONO le regole del programma; tutto il resto resta regolato dal motore. È il meccanismo di override per-programma (usato da New Workout e Muscle-Up Pro) e il punto di aggancio futuro per la filosofia del descrittore per-esercizio e degli elastici (💡).

\- \*\*✅ VALUTAZIONE DEL RANGE (motore, `coach\_prompt\_global`):\*\* reps dentro il range, ESTREMI INCLUSI, = target rispettato; il TETTO del range (es. 12 su 8-12) è un SUCCESSO, non uno sforamento; "sopra il range" = SOLO oltre il tetto. Gli schemi di feedback sono esempi di CONTENUTO, non frasi da copiare alla lettera: VIETATA la frase identica su esercizi/set diversi (anti-fotocopia).

\- \*\*✅ WARM-UP OBBLIGATORIO (motore, `coach\_prompt\_global`):\*\* a OGNI avvio sessione ("Inizia sessione: …") la PRIMA risposta è SEMPRE un riscaldamento. Se la prima riga del CSV è un warm-up (Note "riscaldamento"/"warm", o Reps "10 min") presentala (nome + durata + 1-2 punti dalla Note); altrimenti GENERA un warm-up di 3-4 frasi adatto al lavoro. Chiudi SEMPRE col tag `\[PRONTO]` su riga dedicata; NON trattare il warm-up come un set; NON emettere `\[SET:]` finché l'atleta non scrive "pronto". \*\*ECCEZIONE — ripresa:\*\* su "Bentornato"/sessione già iniziata NON rifare il riscaldamento. (I coach\_rules possono fornire il CONTENUTO del warm-up — es. checklist New Workout — la MECCANICA `\[PRONTO]` resta del motore.)

\- \*\*Il workout e' scelto dal picker pre-chat:\*\* il prompt NON deve far scegliere il workout. L'AI parte col warm-up poi col primo esercizio.

\- \*\*Ordine libero:\*\* l'atleta può cambiare esercizio tappando la lista; il messaggio arriva prefissato "Esercizio: <nome>". L'AI NON deve fare la guardia all'ordine.

\- \*\*RIR e Fatica (RPE) sono OPZIONALI:\*\* se l'atleta indica solo le ripetizioni, registra e prosegui. NON bloccare; al massimo chiedi UNA volta per esercizio.

\- \*\*✅ AUTOREGOLAZIONE REATTIVA SÌ / PROGRESSIONE PROATTIVA NO — correzione doc (giugno 2026):\*\* la regola NON è un blocco dedicato del motore; è espressa NEGLI SCHEMI FEEDBACK (global + delta gym/bodyweight): i suggerimenti "sali/scendi di peso" o "variante più facile/difficile" servono a CENTRARE il target RIR/range del set corrente (autoregolazione REATTIVA — il differenziatore "fai con me"). La progressione della prescrizione TRA le sessioni resta compito della periodizzazione (TASKS). L'override per i programmi a filosofia diversa passa dal blocco PRECEDENZA:

&#x20; - \*\*New Workout (maxout):\*\* cedimento sempre; RIR 0 = obiettivo (mai "fermati prima"); RIR ≥2 → richiamo al maxout; SCHEMA PESO Set1 (ced.\~10, il peso lo TROVA l'atleta) / Set2 (−20/25%).

&#x20; - \*\*Muscle-Up Pro (misto):\*\* vedi regole dedicate sotto.

&#x20; - Ramp/serie prescritte (OK): aumento scritto nel CSV (warm-up, piramidi) = prescrizione, non progressione.

\- \*\*✅ Regole MUSCLE-UP PRO (coach\_rules del template, filosofia MISTA):\*\* (a) "con peso" PER-ESERCIZIO: promemoria zavorra nell'intro dell'esercizio + peso accettato nel feedback; (b) ISOMETRICI: prescrizione "tieni Ns", NIENTE RIR sulle tenute, \*\*conteggio set esplicito\*\* (se Set N < TOT → STESSO esercizio Set N+1, non avanzare); (c) LEVE DI DIFFICOLTÀ skill, in ordine: riduci assistenza → eccentrica 3-4s → variante più dura; scopo = CENTRARE il target del set (la progressione tra sessioni la decide il coach); sostituzioni improvvisate accettate senza pignolerie.

\- \*\*✅ Quirk NEW WORKOUT (documentato, accettato):\*\* la colonna Note contiene VARIANTI/schema ("Maxout / Set1 ced.\~10 / …"), NON il peso → ECCEZIONE alla regola gym "Note = peso" (il box target mostra quel testo; ok perché il peso lo trova l'atleta). Reps "10 / 13-15" = target Set1 / Set2.

\- Niente incoraggiamenti generici nel prompt

\- \*\*Niente bottone "fine" / niente log generato dall'AI:\*\* chiusura con "Torna", log per-serie automatico. L'AI NON genera `WORKOUT LOG` ne' `\[LOG\_DATA:]`. \*\*I protocolli zombie "REGOLA FINE"/"WORKOUT LOG" sono stati RIMOSSI dai coach\_rules (giugno 2026) — NON reintrodurli in alcun programma.\*\*

\- CUE tecnica RIMOSSA (feature) — non aggiungere `\[CUE:]` tag. MA la strip difensiva di `\[CUE:]` in `fmtText` (~riga 1525) è INTENZIONALE: lasciarla (protegge da un tag legacy residuo).

\- Generatore prompt AI RIMOSSO — non aggiungere questa feature

\## CSV programmi — convenzioni (CRITICHE per il matching e i box)

\- I nomi esercizio nel CSV devono coincidere ESATTAMENTE col tag `\[SET:]` dell'AI (lookup name-based per popolare il box target). Mismatch → box vuoto silenzioso. Stesso nome = chiave del futuro video tutorial e (futuro) dropdown libreria.

\- Le Note NON devono usare " / " con spazi; usare "o" o virgole. Decimali col PUNTO, non virgola (es. `12.5 kg`). Recupero `mm:ss`.

\- \*\*In sessione gym la colonna Note = PESO\*\* (la legge il box target). Quindi NON mettere altre indicazioni nelle Note dei gym. \*\*ECCEZIONE documentata: New Workout\*\* (Note = varianti/schema maxout, il peso lo trova l'atleta — quirk accettato).

\- \*\*✅ ESERCIZI MONOLATERALI (dx/sx):\*\* sono UN esercizio, NON un superset (il superset è per due esercizi DIVERSI). Ogni set = un lato poi l'altro senza pausa; il recupero parte DOPO entrambi i lati (è UNA serie, non serve riga "0 rest" tra i lati). Si scrive `N per lato` nella \*\*colonna Reps\*\* (es. `12-15 per lato`) — NON nelle Note (in gym sono il peso). Reso correttamente nel box target (verificato). Se mai il box tagliasse il testo: spostare il cue nei `coach\_rules` (NON nel nome esercizio, per non spezzare lo storico Progressi che aggrega per nome).

\- \*\*✅ REP RANGE (non numeri fissi) per i programmi a ipertrofia:\*\* preferire range che spaziano \~3 (es. `10-13`, `12-15`) invece di un numero secco. Motivo TECNICO: il feedback del coach ragiona su "reps nel range / sopra / sotto" → con un numero fisso quel range è degenere. Schema usato su 741: compound 10-13, isolamenti 12-15, core 15-18 / 17-20, cardio invariato (es. `10 min`). I numeri restano una scelta del coach per-programma. (La valutazione "tetto = successo" è ora codificata nel motore — VALUTAZIONE DEL RANGE.)

\## Descrittore per-esercizio (futuro — voci "Peso per-esercizio" e "Logging isometrici")

\- Introdurre un descrittore calcolato DAL CSV: `{ metric:'reps'|'time', weighted:bool, tempo, recupero, target }`, letto da `renderInputFields`, dai box e dal logging AL POSTO del session-wide `session\_type`. Rilevamento DETERMINISTICO (niente colonna/migration): peso se `session\_type==='gym'` o token "N kg" nella Note; metric=time se Reps matcha `/\\d+\\s\*(sec|min)/i`.

\- \*\*Isometrici (metric=time):\*\* label "Secondi" al posto di "Reps"; NIENTE RIR; RPE/Fatica opzionale; peso opzionale se zavorrato. MVP: salva i secondi nel campo `reps` esistente (+ relabel Progressi). Avanzato: campo `seconds` dedicato (jsonb, niente migration, ma aggiornare tutti i reader). (Il lato PROMPT degli isometrici è GIÀ coperto nei coach\_rules MUP.)

\- Il MOTORE resta separato dal descrittore (il motore è lo STILE di coaching della sessione, non il tipo del singolo esercizio). Estensione futura 💡: `load:'kg'|'band'|none` per gli elastici (parcheggiata in TASKS).

\## Periodizzazione attiva (futuro — "Analisi AI progressioni + deload", GATED)

\- L'AI \*\*PROPONE\*\*, non scrive: output = cambi ASTRATTI strutturati (per esercizio: "+2,5kg" / "tieni" / "deload −10%" + motivo), NON CSV grezzo.

\- Un \*\*MAPPER DETERMINISTICO\*\* converte i cambi astratti in numeri formattati secondo le regole CSV. La TABELLA (editor tabellare) li mostra come DIFF. Il coach approva → il SERIALIZER riscrive `workout\_csv` → `editProgram`. Il CSV NON cambia da solo.

\- Core DETERMINISTICO in JS a ZERO token (double progression + deload) + strato AI SOTTILE solo per giudizio/comunicazione. Dati COMPATTI pre-aggregati (1 riga/esercizio), NON `log\_data` grezzo. Cache del prompt-template (stile Leva 2). \*\*L'aggregatore è CONDIVISO con la "Mail resoconto AI settimanale" (🟡), che ne è il banco di prova a basso rischio (lì l'AI comunica soltanto).\*\*

\- Gira ON-DEMAND (fine settimana/mesociclo), NON per-serie. Apply PER-ATLETA (sulla copia). \*\*⚠️ coach-in-the-loop OBBLIGATORIO\*\* (sicurezza: mai salti di carico automatici). Tocca `chat.js` + `editProgram` → diff + conferma. Dipende dall'editor tabellare (superficie di apply).

\## Picker workout + filtro CSV (Leva 1) — regole

\- `parseWorkoutCsv(csv)` e `buildFilteredCsv(csv, nome)` sono il parser/filtro condiviso

\- `startSessionWithPrompt`: se il CSV ha >=2 workout apre `showWorkoutPicker`, altrimenti `beginSession`

\- `beginSession` applica `buildFilteredCsv`, imposta `sessionWorkout` e inizializza `sessionLog = {workout, programId, chosenWorkout, exercises:\[]}` con `currentSessionId = null`

\- `showWorkoutList` usa lo stesso `parseWorkoutCsv` — non duplicare logica

\- Non modificare il punto di iniezione del CSV in aiSend: legge gia' `currentProfile.workout\_csv` (filtrato)

\- \*\*`parseWorkoutCsv.orderedWorkouts` è la base di "Progressione programma"\*\* (la sequenza È l'ordine dei workout nel CSV) — vedi ARCHITECTURE.

\## Lista tappabile + setNum (Stage 2) — regole

\- `nextSetNum(name)` = (set già loggati per quel nome in `sessionLog.exercises`, guardia `Array.isArray`) + 1. \*\*IL FRONTEND POSSIEDE IL setNum\*\* su tap E tag AI. Non parsare il numero dalla "Set N/TOT" dell'AI.

\- `selectExercise(name)`: chiude l'overlay, `currentSetNum = nextSetNum(name)`, imposta mode/exercises/state, `renderInputFields('single',\[name])`, `setInputLocked(false)`, popola i 4 box dal CSV.

\- `updateSetInfo(text)`: `currentSetNum = nextSetNum(logName)`; N da `nextSetNum` + TOT dal CSV (fallback al TOT del tag).

\- `sendMsg` (single): antepone "Esercizio: <nome>". Superset: singolo `currentSetNum` su `ssNames\[0]`.

\- Warm-up non-tappabile: righe con `/riscald|warm/i` nella `Note` → `class="wlist-ex wlist-ex-warmup"` (NESSUN onclick). CSS `.wlist-ex-warmup{cursor:default;opacity:.55;}`.

\## Session Screen Rules

\- `updateSetInfo(text)` popola 3 box e salva `currentSetNum` (= `nextSetNum`). \*\*TARGET BOX PER TIPO:\*\* setTempoBox = Tempo per i bodyweight; = PESO (col Note) per i gym. Stessa logica in `selectExercise`. Niente label per-riga, nessun cambio di ID. (Futuro: passare a un descrittore PER-ESERCIZIO per gestire le sessioni miste — vedi sopra.)

\- `fmtText(text)` rimuove tag \[SET:]/\[SUPERSET:]/\[CUE:]/\[PRONTO]/\[LOG\_DATA:] e righe set-info (la strip di `\[CUE:]` è DIFENSIVA: feature rimossa, strip intenzionale → lasciarla); se ritorna null/vuoto -> bubble NON renderizzato. `extractOptions(text)` ritorna \[] se il testo contiene \[SET:]/\[SUPERSET:]/\[PRONTO].

\- \*\*Salvataggio PER-SERIE:\*\* `sendMsg` costruisce i set con `reps > 0` (RIR `null` se vuoto, RPE/Fatica `null` se nessun bottone, uno 0 dichiarato resta 0), `setNum = currentSetNum` -> `queueAutosave` -> `persistSets` (INSERT prima serie, UPDATE con dedup nome+setNum). \*\*Sessioni demo NON persistite\*\* (`if(currentProfile.\_isDemo) return;` in `persistSets`) — usate dall'onboarding E dalla test session admin. \*\*Le FUTURE sessioni trial (1A) invece PERSISTONO: niente `\_isDemo`.\*\*

\- \*\*Chiusura con "Torna":\*\* `showDash` ferma il timer recupero, ripristina `\_orig` se demo, e — se `testSession` — torna ad `adminScreen` tab Template (non alla dashboard atleta). \*\*Topbar: SOLO "Torna" + "lista".\*\*

\- \*\*`deleteLog` (fix `7f8315d`):\*\* ramifica su `currentProfile.role==='admin'` → admin: solo `renderLogTable()` (resta su `adminScreen`); atleta: `showDash()`. NON reintrodurre la `showDash()` incondizionata.

\- \*\*Ripresa:\*\* `resumeSession(sessionRow, program)` riaggancia `currentSessionId`, idrata `sessionLog` da `log\_data`, ricostruisce `currentProfile`, chat pulita + "Bentornato" + re-brief. NON creare una seconda riga sessions. NON mostrabile per le sessioni "Allenamento libero" (niente `programId`).

\- \*\*Riga input inline:\*\* `weightRow` nella stessa riga di reps e RIR (1:1:1); peso solo se gym, a DESTRA. NON spostare a sinistra. (Futuro: visibilità per-esercizio col descrittore.)

\## Timer — regole (fix background + timer-esercizio)

\- \*\*Fix timer recupero background:\*\* calcolare il tempo trascorso dal timestamp (`Date.now()`), NON decrementare con `setInterval`. Diventa il \*\*motore-timer unico a timestamp\*\*.

\- \*\*Timer-esercizio a tempo (task):\*\* rilevamento DETERMINISTICO via regex sul campo Reps `/\\d+\\s\*(sec|min)/i` (NIENTE colonna/migration). UX a due fasi: "Avvia esercizio · Ns" → countdown lavoro (per i range usa il massimo) → a zero vibra/beep → parte il countdown recupero; i secondi tenuti pre-compilano reps. \*\*VINCOLO:\*\* NON un timer-intervalli configurabile completo. \*\*INCATENATO a "Logging isometrici"\*\* (stessa regex, secondi → `reps`). Diff + conferma. Da fare SOPRA il fix background.

\## Breathwork — Respirazione a cicli (regole feature)

\- \*\*Frontend-only:\*\* NIENTE backend/DB/API/`chat.js`/motore/coach\_rules/token. NON è una sessione AI.

\- Nuovo screen full-screen sullo stile di `#sessionScreen`, mostrato via `showScreen(id)`; ingresso da una card in dashboard.

\- \*\*Bolla:\*\* `transform: scale()` + `transition ease-in-out` di durata = durata della fase. Glow lime `#c8f060` più intenso in inspirazione. Parola al centro; in ritenzione la parola lascia il posto al timer.

\- \*\*Timer di ritenzione:\*\* `Date.now()` (diff), NON `setInterval` decrementale.

\- \*\*Protocollo:\*\* N respiri (default 30, 30-40) → ritenzione a polmoni vuoti (timer in su) → tap = fine → recovery breath \~15s → round successivo (3-5, default 3) → riepilogo tempi (effimero).

\- \*\*Setup prima\*\*, riepilogo dopo; chrome minimale in sessione.

\- \*\*Architettura:\*\* protocollo come oggetto-dati ("descrittore") per aggiungere altre tecniche (pranayama) senza riscrivere il player. Ma ORA solo il protocollo a cicli.

\- \*\*Sicurezza OBBLIGATORIA:\*\* disclaimer al PRIMO uso — iperventilazione + apnea → mai in acqua o alla guida, sempre seduti o sdraiati.

\- \*\*Naming:\*\* "Respirazione a cicli" / "Breathwork", NON "Wim Hof Method".

\- Vincoli standard (var, no backtick, no localStorage, esc(), escape `\\'`, dark theme, ID invariati). v2 (salvataggio tempi) NON ora.

\## Allenamento libero (regole feature — log manuale, no AI)

\- NIENTE AI, NIENTE generazione: puro logging. \*\*≠ Opzione 4 "Workout improvvisato"\*\* (lì l'AI genera il workout).

\- Riusa `persistSets`/`log\_data`/`nextSetNum`/riga input. Nome esercizio da CAMPO TESTO (autocomplete dalla LIBRERIA, fallback testo libero) → grafici Progressi coerenti.

\- Sessione SENZA programma: box vuoti, niente picker/lista CSV, niente `\[SET:]` dall'AI. Senza `programId` → NON riprendibile (non mostrare il riquadro Riprendi).

\## Email / Apps Script — regole (transizione)

\- \*\*Apps Script è in OVERHAUL\*\* (TASKS 🟡): NON costruirci sopra nuove feature. La dipendenza \*\*GEMINI API\*\* per il messaggio delle mail è ora documentata (ARCHITECTURE → External Services); candidato sostituzione → Anthropic via infrastruttura esistente.

\- Se il flusso accesso passa dalle mail Supabase (1A/1B), parti di Apps Script SPARISCONO: non rifare pezzi destinati a morire.

\- \*\*Mail resoconto AI\*\* (🟡) e reminder: cron Vercel UNICO + provider transazionale futuro (gated rebranding). MVP resoconto SENZA immagini (testo + numeri + link Progressi); avanzato QuickChart.

\## Ottimizzazione costi (regole attive in aiSend)

\- Filtro CSV: all'AI va solo il workout scelto (Leva 1)

\- History SEMPRE troncata agli ultimi 12 messaggi (`MAX\_HISTORY`)

\- Storico ultime sessioni NON iniettato

\- `athleteContext` (profilo, incl. infortuni) iniettato solo al primo turno (`isFirst`) — non eliminare (sicurezza)

\- \*\*Prompt caching (Leva 2):\*\* motore cachato in `chat.js` — non rompere (vedi Backend Rules). Il motore è cresciuto (\~250 token: precedenza + valutazione range) ma resta nel blocco cachato; i coach\_rules vanno tenuti SNELLI perché viaggiano nel blocco NON cachato.

\## COACH\_LOG\_FORMAT — LEGACY/dead

`COACH\_LOG\_FORMAT` e `saveSessionLog()` sono ancora nel file ma NON usati. Non costruirci sopra; rimovibili in un cleanup futuro. (I protocolli "REGOLA FINE"/"WORKOUT LOG" nei coach\_rules sono stati rimossi — zombie.)

&#x20;

\## log\_data — due formati (backward compatible)

```

Nuovo: exercises\[].sets = \[{reps, rir, rpe, weight, note, setNum}]  <- renderProgressCharts / persistSets

Vecchio: exercises\[].reps/rir/sets (number)                          <- getExSets()

```

\- RIR/RPE `null` = non dichiarato (escluso dai grafici via `numOrNull`); uno 0 dichiarato resta valido. `weight` 0 = corpo libero (valido).

\- \*\*Isometrici (MVP):\*\* i secondi vivono nel campo `reps` (→ relabel Progressi). Avanzato: campo `seconds` dedicato.

\## Database Rules

\- `profiles.role`: solo `'admin'` o `'athlete'`

\- `profiles.status`: solo `'active'`, `'pending'`, `'inactive'`. \*\*L'admin deve essere `'active'`\*\* (vedi gate chat.js sopra). \*\*✅ Trial 1A (DECISO 12/06):\*\* stato trial = RIUSO di `'pending'` (nessun valore nuovo): `pending` = trialist (logga + chatta fino a N=3), conversione admin → `'active'`. \*\*`status`/`role` READ-ONLY ai non-admin\*\* via trigger `trg\_protect\_profile\_fields` (vedi sotto).

\- `programs.session\_type` / `program\_templates.session\_type`: solo `'bodyweight'` o `'gym'` (NON introdurre `'mixed'` — il caso misto si gestisce col descrittore per-esercizio)

\- `exercises.owner\_id = null` = esercizio globale

\- \*\*`programs.workouts` è `text` (NON jsonb) ed è VESTIGIALE/inutilizzato\*\* — source of truth = `workout\_csv`. `program\_templates.workouts` è `jsonb` ma ugualmente inutilizzato. NON copiarlo tra le tabelle, NON reintrodurlo in `repushTemplate`. Rimovibile in un cleanup.

\- Non eliminare mai dati senza conferma esplicita

\- `programs.user\_id` lega il programma a un singolo atleta; `programs.template\_id` lo aggancia al template (FK ON DELETE SET NULL)

\- \*\*RLS abilitata su tutte le tabelle\*\* (`profiles`, `sessions`, `programs`, `exercises`, `program\_templates`) — policy owner via `auth.uid()` + `is\_admin()` (SECURITY DEFINER). `program\_templates`: 4 policy admin-only. `admin.js`/`chat.js` (service role) bypassano la RLS: i loro gate restano il confine.

\- \*\*Ogni nuova tabella o query dal browser va con la sua policy.\*\*

\- \*\*Due livelli di blocco account\*\*: `inactive` fermato al login (frontend); `pending` = TRIALIST → logga E CHATTA fino a `TRIAL\_SESSIONS=3` sessioni, poi 403 `trial\_exhausted` dal gate di `chat.js` (12/06)

\- La tabella `session\_drafts` è stata RIMOSSA — non reintrodurla

\- \*\*Sessioni "Allenamento libero":\*\* INSERT in `sessions` via client + RLS owner (`auth.uid() = user\_id`); niente `programId`.

\- \*\*✅ Self-activation gap CHIUSA (12/06, era il TODO `policies.sql:33`):\*\* trigger `trg\_protect\_profile\_fields` + function `protect\_profile\_fields` (SECURITY DEFINER, search\_path=public) su `public.profiles`, BEFORE UPDATE: `status`/`role` READ-ONLY ai non-admin (`is distinct from` → `raise exception`); service role e SQL Editor passano (`auth.uid()` null), admin da browser passa. Applicato via SQL Editor e VERIFICATO in produzione (P0001 da atleta; update profilo normale OK; cambio status da admin OK). NON rimuovere il trigger.

\- \*\*✅ Trigger `trg\_assign\_trial\_program` (13/06)\*\* — AFTER INSERT su `public.profiles`, function `assign\_trial\_program` (SECURITY DEFINER, search\_path=public): auto-assegna il template trial (UUID hardcoded `193af02e-...`, "Prova — Full Body") ai nuovi `athlete`/`pending` copiando i campi contenuto in `programs` (`program\_name/coach\_rules/workout\_csv/ai\_prompt/session\_type`, NON `workouts`). Guardia `role='athlete' AND status='pending'`; `exception when others then return new` (non blocca MAI il signup). NON rimuovere. Coesiste con `trg\_protect\_profile\_fields`. Dettaglio in ARCHITECTURE.

\## Cosa NON fare mai

\- Non riscrivere tutto `index.html` per una modifica piccola

\- \*\*Non convertire i .js frontend in ES modules; non togliere/riordinare i tag `<script>` (inline → progress.js → admin-ui.js) né il `<link styles.css>`; non estrarre il core sessione AI da `index.html`\*\*

\- \*\*Non confondere `admin-ui.js` (frontend, root) con `api/admin.js` (serverless): sono due file diversi\*\*

\- \*\*Non saltare il gate di sintassi pre-deploy prima di un push frontend\*\*

\- Non aggiungere dipendenze npm senza chiederlo

\- Non cambiare l'ID di un elemento HTML esistente — incl. `tplName/tplType/tplRules/tplCsv/tplPrompt`, `assignAthleteSelect`, \*\*`atabTemplates`\*\*

\- Non cambiare il formato dei tag AI `\[SET:]` `\[SUPERSET:]` `\[PRONTO]`

\- Non abbassare il `font-size` degli input session sotto 16px; non rimettere il peso su una riga separata

\- Non togliere `var` global declarations in cima al JS (incl. `sessionLog`, `currentSessionId`, `currentSetNum`, `assigningTemplateId`, \*\*`testSession`\*\*)

\- \*\*Non parsare il setNum dalla "Set N/TOT" dell'AI\*\* — il frontend lo possiede via `nextSetNum`

\- Non aggiungere `\[CUE:]` tag; non reintrodurre il "Generatore prompt AI"

\- Non reintrodurre la scelta workout nei prompt (la fa il picker)

\- Non reintrodurre il bottone "fine" ne' la generazione del log dall'AI; non reintrodurre "skip"/`qSend`/`buildSkipMessage`; non reintrodurre `session\_drafts`

\- \*\*Non reintrodurre i protocolli "REGOLA FINE"/"WORKOUT LOG" nei coach\_rules\*\* (zombie rimossi, giugno 2026)

\- \*\*Non rimuovere dal motore i blocchi PRECEDENZA — FILOSOFIA DI PROGRAMMA e VALUTAZIONE DEL RANGE\*\* (reggono i programmi maxout/misto e la correttezza del feedback sui range)

\- \*\*Non duplicare nei coach\_rules le regole già nel motore\*\* (li gonfia nel blocco non cachato e crea conflitti): coach\_rules = solo gli specifici del programma

\- \*\*Non rendere il warm-up opzionale\*\* (è obbligatorio nel motore, con eccezione solo sulla ripresa)

\- \*\*Non far proporre al coach in-sessione aumenti di carico "per progredire"\*\* (autoregolazione reattiva sì, progressione proattiva no — espressa negli schemi feedback; eccezione maxout/misto via PRECEDENZA)

\- \*\*Non mettere indicazioni diverse dal peso nelle Note dei gym\*\* (le legge il box; eccezione documentata: New Workout); il "per lato" dei monolaterali va nelle Reps

\- Non generare HTML senza conferma esplicita

\- Non rimuovere l'auth gate / pending-gate di `/api/chat.js` o `/api/admin.js`; non chiamarli senza access token

\- Non disabilitare la RLS; non creare tabella/query lato browser senza la relativa policy

\- Non rimettere `detectSessionInUrl: true`

\- \*\*Non rompere la struttura del prompt caching (Leva 2)\*\*; non far scendere il motore sotto 1.024 token

\- \*\*Non reintrodurre `workouts` in `repushTemplate`\*\*; non copiarlo tra `programs` e `program\_templates`; non introdurre `session\_type 'mixed'`

\- \*\*Non toccare la primitiva `\_isDemo`\*\* (la usano onboarding E test session) quando si fa cleanup del demo onboarding; \*\*non usarla per il trial funnel\*\* (le sessioni trial persistono)

\- \*\*Breathwork:\*\* non agganciarla a backend/DB/API; non chiamarla "Wim Hof Method"; non saltare il disclaimer

\- \*\*Timer-esercizio:\*\* non costruire un timer-intervalli configurabile completo (versione semplice countdown→recupero)

\- \*\*Periodizzazione AI:\*\* mai applicare carichi in automatico agli atleti (coach-in-the-loop obbligatorio)

\- \*\*Apps Script:\*\* non costruirci sopra nuove feature (sistema in overhaul, parti destinate a sparire)

\- \*\*Non saltare/disattivare il pre-commit hook\*\* (`core.hooksPath .githooks` → `scripts/syntax-check.js`). Se un commit viene bloccato per `SyntaxError`, si CORREGGE il codice — non si usa `--no-verify` se non in vera emergenza.

\- Il vincolo "no local Node" è SUPERATO (Node `v24.16.0` installato, `vercel dev` ora possibile); resta valido che `index.html` usa `var` e niente backtick.

\## Workflow consigliato

&#x20;

\### Inizio nuova conversazione su Claude Code:

```

cd \~/Desktop/calislackline-app

git pull

claude

```

Poi:

```

Leggi CLAUDE.md. Non modificare nulla ancora.

Dimmi cosa vedi: struttura, problemi aperti, rischi.

```

&#x20;

\### Per implementare un task:

```

Implementa SOLO \[task X].

File da toccare: \[file Y]. Non toccare: \[file Z, persistSets, log\_data shape, dedup, auth, DB schema, caching motore].

Niente migration. Mostrami il piano/diff prima di scrivere codice.

```

&#x20;

\### Per analisi senza codice (feature grosse, es. trial funnel / progressione / periodizzazione / editor tabellare):

```

Analizza come funziona oggi \[X] e mostrami un piano con le opzioni. Non scrivere codice ancora.

```

&#x20;

