\# AI Rules — AILISTENICS

&#x20;

\## General Rules

\- Leggi sempre PROJECT\_OVERVIEW, ARCHITECTURE e TASKS prima di proporre modifiche

\- Non rompere codice esistente — ogni modifica deve essere chirurgica

\- Modifica solo i file esplicitamente richiesti nel task

\- Prima di implementare: mostra il piano/diff, poi chiedi conferma

\- Se una modifica tocca auth o DB schema, chiedi sempre conferma esplicita

\- Mantieni naming conventions esistenti (camelCase JS, kebab-case CSS IDs)

\- \*\*Frontend MULTI-FILE (refactor fase 1, giugno 2026):\*\* `index.html` + `styles.css` + `progress.js` + `admin-ui.js` + `log.js`, script CLASSICI non-module → funzioni e var GLOBALI (gli onclick inline e le chiamate cross-file ci contano). TUTTE le Frontend Rules valgono per TUTTI i .js frontend. NON convertire in ES modules; NON cambiare l'ordine dei tag (inline → progress.js → admin-ui.js → log.js); NON estrarre il CORE SESSIONE AI da `index.html` (decisione di fase 1). `admin-ui.js` (frontend, root) ≠ `api/admin.js` (serverless). Eventuali nuove estrazioni (onboarding): SOLO su richiesta, col metodo recon dipendenze read-only → diff → gate → test funzionale (la libreria esercizi è già stata estratta in `admin-ui.js` e il modale log in `log.js` il 15/06; `buildLogSummary` è rimasta nel core)

\## Sviluppo via Claude Code (repo locale)

\- Lo sviluppo del codice avviene via Claude Code sul repo `\~/Desktop/calislackline-app` (Windows: `C:\\Users\\39327\\Desktop\\calislackline-app`)

\- \*\*Ambiente Windows PowerShell:\*\* NIENTE `\&\&` (token non valido) — un comando per riga. \*\*Node.js `v24.16.0` installato in locale (13/06)\*\* (il vecchio "node non installato" è SUPERATO) → `vercel dev` ora possibile. \*\*GATE DI SINTASSI PRE-DEPLOY\*\* ora in DUE livelli: (a) AUTOMATICO — pre-commit hook (`core.hooksPath .githooks` → `scripts/syntax-check.js`, `node --check`) blocca il commit su `SyntaxError`; (b) MANUALE/VISIVO — `index.html` locale in Chrome INCOGNITO + console (F12), nessun `Uncaught SyntaxError` né 404 sui file esterni → safe to push; verifica finale in produzione (Ctrl+F5 su ailistenics.com; pochi utenti; rollback Vercel 1-click se serve)

\- \*\*Dare sempre o un prompt pronto da incollare in Claude Code, o step numerati\*\* — mai indicazioni vaghe

\- Il repo ha un \*\*CLAUDE.md\*\* che guida Claude Code (architettura + regole di lavoro) — tienilo allineato dopo modifiche importanti

\- Ciclo: descrivi modifica -> piano/diff -> approvi edit chirurgici -> GATE di sintassi -> commit + push -> verifica in produzione -> Vercel deploya da main

\- Backend (`api/\*.js`) e documentazione vanno dritti su `main`. Il frontend (`index.html`, `styles.css`, `progress.js`, `admin-ui.js`) va su `main` col GATE prima del push e verifica immediata Ctrl+F5 dopo (rollback pronto); l'anteprima Vercel CLOUD (deployment di branch) resta non usabile (login -> produzione). \*\*Per la preview testabile usa `vercel dev` in LOCALE\*\* (`.\dev.ps1`, ✅ FATTA 14/06; gira però sul DB Supabase REALE)

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

\- `/api/chat.js` ha un \*\*auth gate\*\* (JWT -> 401) + un \*\*gate status\*\*. \*\*✅ Gate trial ATTIVO (12/06):\*\* `TRIAL\_SESSIONS=3` in cima al file; legge `status,role`; `active` → passa; \*\*admin (`role==='admin'`) → bypassa il gate\*\* (commit `1410bd5`); `pending` = TRIALIST → passa se count(`sessions` per `u.id` del JWT, service role, `HEAD` + `Prefer count=exact`) < 3, altrimenti 403 `trial\_exhausted`; fail-closed (count indeterminato → trial\_exhausted; la count include le sessioni "Allenamento libero", MVP); `inactive`/sconosciuto → 403 `account\_not\_active`. \*\*Hardening verificato:\*\* decisione solo su `u.id` del JWT + profilo via service role, nessun campo del body. Frontend: `aiSend` allega l'access token; gestisce 401 e 403 (sul 403 mostra ancora il messaggio generico — CTA `trial\_exhausted` dedicata = prossimo intervento frontend 1A). Rate-limit per-utente ancora da fare (Fase 2). \*\*Modello `claude-sonnet-4-5` invariato; non rimuovere il gate trial.\*\*

\- \*\*✅ ADMIN BYPASS del pending-gate di `/api/chat.js` — FATTO (giugno 2026, commit `1410bd5`):\*\* il gate seleziona `status,role` e passa se `status==='active' || role==='admin'` → l'admin (es. test session "Prova") gira indipendentemente dallo `status`. Supera il vecchio fix-dati `update profiles set status='active' where role='admin'` (non più necessario). Gate trial e struttura del prompt caching (Leva 2) intatti. \*\*Non rimuovere il bypass `role==='admin'`.\*\*

\- \*\*MOTORE-PROMPT in `/api/chat.js`:\*\* dopo i gate, legge dalla tabella `settings` (service role) il comune `coach\_prompt\_global` + il delta per tipo (`coach\_prompt\_gym`|`coach\_prompt\_bodyweight`) scelto da `body.session\_type` — \*\*typeKey HARDCODED\*\* (no injection). Unisce comune -> delta (`motor`). Fallback NON bloccante (`motor=''`). Il TESTO del motore si edita in `settings` (Table Editor), NON nel codice. `aiSend` deve continuare a inviare `session\_type`. \*\*✅ DELTA SVUOTATI (giugno 2026 — "Prompt unico per-esercizio"):\*\* `coach\_prompt\_gym` e `coach\_prompt\_bodyweight` sono ora VUOTI; tutto il comportamento vive in `coach\_prompt\_global`, che contiene il blocco \*\*CARICO O CORPO LIBERO\*\* (discriminante = colonna CSV `Peso`, PER-ESERCIZIO: cella valorizzata = peso target + frase d'intro col peso + peso fuori dalla riga del set; cella vuota = corpo libero, reps + tempo se presente, "per lato"/L&R) e il blocco \*\*LEVA DI DIFFICOLTÀ\*\* (trigger DETERMINISTICO `reps > tetto`, NON RIR). `session\_type` NON guida più il comportamento del motore (`chat.js` concatena un delta vuoto; Leva 2 caching intatta) — resta nel DB/codice (rimozione = cleanup futuro). \*\*Precisazione:\*\* è vero a livello DATI (i delta in `settings` sono svuotati), ma il CODICE che ramifica su `session\_type` è ancora vivo — `aiSend` lo invia nel body e `chat.js` sceglie il typeKey hardcoded concatenando un delta ormai vuoto. \*\*Non reintrodurre i delta gym/bodyweight\*\* (vedi DO-NOT).

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

\- \*\*⚠️ EMAIL/PASSWORD NON ATTIVO — intero path (correzione di stato, giugno 2026):\*\* funziona SOLO Google OAuth (PKCE). NON è solo il reset rotto: anche login/signup via email+password non funziona — i doc lo davano erroneamente ok.

\- \*\*✅ PIANO 1B (16/06) — ACCESSO EMAIL via OTP A CODICE (sostituisce email/password, NON ripara magic-link/PKCE):\*\* OTP a 6 cifre Supabase. Flusso: `signInWithOtp` (template email col \*\*token\*\*, SENZA `emailRedirectTo`) → `verifyOtp({ type:'email' })` → `updateUser({ password })`. Unifica signup/login/reset; il codice si digita IN-APP → NON tocca la macchina di `/reset` né `detectSessionInUrl` (PKCE invariato). \*\*Dipendenza HARD: SMTP custom / provider transazionale\*\* (Resend) — il mailer Supabase di default non basta. \*\*Config NON-repo\*\* (template email Supabase + SMTP custom): il TESTO/template si edita in Supabase, NON nel codice. La mail OTP è \*\*mono-scopo\*\* (niente CTA "Richiedi il coaching" dentro, per deliverability). Il bottone "Crea account con email" resta nascosto/disabilitato finché l'OTP non è pronto (solo-Google nel frattempo). \*\*NON rimettere `detectSessionInUrl: true`.\*\*

\## AI Coach Prompt Rules

> ✅ NOTA: le regole COMUNI sono CENTRALIZZATE nel MOTORE (tabella `settings`), anteposte da `/api/chat.js` al system in base a `session\_type` (e cachate via Leva 2). I `coach\_rules` per-programma/per-template tengono SOLO gli specifici (incl. RIR target e override di filosofia). \*\*TUTTI i 9 programmi sono migrati (giugno 2026)\*\*, inclusi Muscle-Up Pro (misto) e New Workout (maxout) via blocco PRECEDENZA + coach\_rules snelli.

\- Formato set: `\[SET:NomeEsercizio]\\nNome — Set N/TOT | X-Y reps | Tempo: 30X1 | Recupero: mm:ss`

\- Formato superset: `\[SUPERSET:Nome1,Nome2]`

\- \*\*✅ PRECEDENZA — FILOSOFIA DI PROGRAMMA (motore, `coach\_prompt\_global`):\*\* i `coach\_rules` possono dichiarare una FILOSOFIA propria (es. maxout, mista); sui punti in conflitto PREVALGONO le regole del programma; tutto il resto resta regolato dal motore. È il meccanismo di override per-programma (usato da New Workout e Muscle-Up Pro) e il punto di aggancio futuro per la filosofia del descrittore per-esercizio e degli elastici (💡).

\- \*\*✅ VALUTAZIONE DEL RANGE (motore, `coach\_prompt\_global`) — riscritto come CLASSIFICAZIONE MECCANICA min/max (giugno 2026):\*\* non più "tetto = successo" da interpretare, ma regola meccanica con PAVIMENTO e TETTO inchiodati. reps dentro il range, ESTREMI INCLUSI = A TARGET; `reps > tetto` = SOPRA; `reps < pavimento` = SOTTO. Esempi su range piccoli incisi nel prompt: 3 su 3-5 = a target, 5 su 3-5 = a target, 6 su 3-5 = sopra, 2 su 3-5 = sotto. \*\*Guardia bidirezionale esplicita:\*\* il tetto NON va trattato come sforato, il pavimento NON come "sotto". Anti-fotocopia mantenuto (vietata la frase identica su esercizi/set diversi). \*\*Verificato in produzione:\*\* niente più "sforato" sul tetto, niente più "completa il range" sul pavimento.

&#x20; - \*\*✅ Leva-RIR degli skill (MUP) — CHIUSA (giugno 2026, TASKS 3B):\*\* la leva di difficoltà sugli esercizi a corpo libero si attiva ora su un TRIGGER DETERMINISTICO `reps > tetto` del range (nel MOTORE, blocco LEVA DI DIFFICOLTÀ), NON sul giudizio RIR del modello (inaffidabile sul bordo RIR=3). \*\*Lezione load-bearing confermata:\*\* l'aderenza del modello a soglie RIR NUMERICHE dentro un prompt lungo è inaffidabile → si lega la leva a un segnale deterministico. `coach\_rules` MUP snelliti: \*\*rimossa la soglia RIR delle leve\*\* e la filosofia-peso-via-Note; tenuti ISOMETRICI e la scala leve (riduci assistenza → eccentrica → variante). \*\*Non rimettere la soglia RIR nei `coach\_rules` MUP\*\* (vedi DO-NOT).

&#x20; - \*\*✅ PROMPT UNICO per-esercizio — FATTO (giugno 2026, `settings`/Table Editor, no deploy):\*\* i delta `coach\_prompt\_gym`/`coach\_prompt\_bodyweight` sono stati SVUOTATI; un solo `coach\_prompt\_global` applica la leva PER-ESERCIZIO leggendo la colonna CSV `Peso` (valorizzata → carico; vuota → corpo libero, variante/leva/tempo) tramite i blocchi CARICO O CORPO LIBERO + LEVA DI DIFFICOLTÀ. `chat.js` (concatena un delta vuoto) e Leva 2 caching intatti. `session\_type` non guida più il comportamento del motore (rimozione dal DB/codice = cleanup futuro).

\- \*\*✅ WARM-UP OBBLIGATORIO (motore, `coach\_prompt\_global`):\*\* a OGNI avvio sessione ("Inizia sessione: …") la PRIMA risposta è SEMPRE un riscaldamento. Se la prima riga del CSV è un warm-up (Note "riscaldamento"/"warm", o Reps "10 min") presentala (nome + durata + 1-2 punti dalla Note); altrimenti GENERA un warm-up di 3-4 frasi adatto al lavoro. Chiudi SEMPRE col tag `\[PRONTO]` su riga dedicata; NON trattare il warm-up come un set; NON emettere `\[SET:]` finché l'atleta non scrive "pronto". \*\*ECCEZIONE — ripresa:\*\* su "Bentornato"/sessione già iniziata NON rifare il riscaldamento. (I coach\_rules possono fornire il CONTENUTO del warm-up — es. checklist New Workout — la MECCANICA `\[PRONTO]` resta del motore.)

- **Il workout e' scelto PRIMA della chat:** il prompt NON deve far scegliere il workout; l'AI parte col warm-up poi col primo esercizio. (Meccanica UI: per i PROGRAMMI il giorno della fase corrente e' scelto dalla vista dettaglio programDetailScreen e passato a beginSession col nome completo "Fase N - ..."; il picker pre-chat sopravvive SOLO per la test session admin "Prova". In entrambi i casi all'AI arriva un workout gia' scelto.)

\- \*\*Ordine libero (motore rafforzato, giugno 2026):\*\* l'atleta può cambiare esercizio tappando la lista; il messaggio arriva prefissato "Esercizio: <nome>". \*\*Il prefisso "Esercizio:" è AUTORITATIVO\*\* e prevale sull'ordine del CSV e sul default "primo esercizio", ANCHE subito dopo il warm-up. L'AI NON deve fare la guardia all'ordine: vietato chiedere conferma del cambio ("vuoi saltare?"/"era un errore?"), dire "siamo ancora su X" / "torniamo a X" / "prima completa Y", elencare gli esercizi mancanti, o dire che un esercizio è "l'ultimo" per rimandarlo.

\- \*\*RIR e Fatica (RPE) sono OPZIONALI:\*\* se l'atleta indica solo le ripetizioni, registra e prosegui. NON bloccare; al massimo chiedi UNA volta per esercizio.

\- \*\*✅ AUTOREGOLAZIONE REATTIVA SÌ / PROGRESSIONE PROATTIVA NO — correzione doc (giugno 2026):\*\* la regola NON è un blocco dedicato del motore; è espressa NEGLI SCHEMI FEEDBACK (global + delta gym/bodyweight): i suggerimenti "sali/scendi di peso" o "variante più facile/difficile" servono a CENTRARE il target RIR/range del set corrente (autoregolazione REATTIVA — il differenziatore "fai con me"). La progressione della prescrizione TRA le sessioni resta compito della periodizzazione (TASKS). L'override per i programmi a filosofia diversa passa dal blocco PRECEDENZA:

&#x20; - \*\*New Workout (maxout):\*\* cedimento sempre; RIR 0 = obiettivo (mai "fermati prima"); RIR ≥2 → richiamo al maxout; SCHEMA PESO Set1 (ced.\~10, il peso lo TROVA l'atleta) / Set2 (−20/25%).

&#x20; - \*\*Muscle-Up Pro (misto):\*\* vedi regole dedicate sotto.

&#x20; - Ramp/serie prescritte (OK): aumento scritto nel CSV (warm-up, piramidi) = prescrizione, non progressione.

\- \*\*✅ Regole MUSCLE-UP PRO (coach\_rules del template) — SNELLITE (giugno 2026, chiusura 3B):\*\* dopo l'unificazione del motore (delta svuotati) i `coach\_rules` MUP collassano a DUE residui specifici: (a) \*\*ISOMETRICI:\*\* prescrizione "tieni Ns", NIENTE RIR sulle tenute, \*\*conteggio set esplicito\*\* (se Set N < TOT → STESSO esercizio Set N+1, non avanzare); (b) \*\*SCALA LEVE\*\* skill, in ordine: riduci assistenza → eccentrica 3-4s → variante più dura; scopo = CENTRARE il target del set (la progressione tra sessioni la decide il coach); sostituzioni improvvisate accettate senza pignolerie. \*\*RIMOSSI:\*\* la SOGLIA RIR delle leve (la leva è ora `reps > tetto`, deterministica, nel motore) e la filosofia-peso-via-Note (il peso è per-esercizio dalla colonna `Peso`). \*\*Non rimettere la soglia RIR\*\* (vedi DO-NOT).

\- \*\*✅ Regole Frau Medici - Palestra (Petra) — SNELLITE (giugno 2026):\*\* residuo specifico = il blocco \*\*LINGUAGGIO SEMPLICE\*\* (tenuto e preservato). \*\*RIMOSSA\*\* la regola che toglieva peso su RIR basso (causava il feedback errato "togli peso" su ripetizioni a target): l'autoregolazione del carico corretta è "togliere peso SOLO se l'atleta non raggiunge le ripetizioni previste nemmeno al massimo", come da motore. \*\*Learning linguaggio semplice:\*\* i `coach\_rules` a linguaggio semplice devono evitare i termini vietati ANCHE nelle istruzioni interne, non solo in output, o il modello li echeggia.

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

\- \*\*✅ ESERCIZI ALTERNATI (Note "Alternating"):\*\* reps e RIR si contano sul TOTALE alternato, MAI "per lato" né "L&R" (diverso dai monolaterali "Same Side", che restano per-lato). È una regola PER-PROGRAMMA nei `coach\_rules` (es. clausola alternati di BBR), NON globale; lì la fascia RIR valida si raddoppia (es. 0-6 invece di 0-3, perché ~3 di riserva per lato ≈ ~6 sul totale).

\- \*\*✅ REP RANGE (non numeri fissi) per i programmi a ipertrofia:\*\* preferire range che spaziano \~3 (es. `10-13`, `12-15`) invece di un numero secco. Motivo TECNICO: il feedback del coach ragiona su "reps nel range / sopra / sotto" → con un numero fisso quel range è degenere. Schema usato su 741: compound 10-13, isolamenti 12-15, core 15-18 / 17-20, cardio invariato (es. `10 min`). I numeri restano una scelta del coach per-programma. (La valutazione "tetto = successo" è ora codificata nel motore — VALUTAZIONE DEL RANGE.)

\## Descrittore per-esercizio (peso ✅ SHIPPED via colonna CSV; isometrici futuri)

\- \*\*✅ PESO PER-ESERCIZIO (SHIPPED):\*\* il `weighted` è calcolato PER-ESERCIZIO dalla \*\*colonna CSV `peso`\*\* (alias header `carico`), NON da `session\_type`. `exIsWeighted(peso)` = cella `peso` non vuota → mostra `#weightRow` + box=peso (il valore è anche il target). `parseWorkoutCsv` espone `field.peso` (retrocompat: CSV senza colonna → vuoto → corpo libero). \*\*Nuova var `currentWeighted`:\*\* impostata in `updateSetInfo` (da `csvPeso`; superset = esercizio PRIMARIO) e `selectExercise` (da `field.peso`); pilota show/hide `#weightRow` + tipo box; letta da `sendMsg` per il gating del peso loggato. `beginSession`/`resumeSession` resettano `#weightRow` a `none` all'avvio. SUPERATO l'approccio Note (`/N kg/` + fallback `session\_type==='gym'` + gym→Note-come-peso); quirk New Workout (Note=varianti) RISOLTO. \*\*✅ Anche il MOTORE è ora per-esercizio sulla colonna `Peso` (giugno 2026, "Prompt unico per-esercizio"):\*\* i delta `coach\_prompt\_gym`/`bodyweight` sono SVUOTATI e il blocco CARICO O CORPO LIBERO in `coach\_prompt\_global` decide carico/tempo per-esercizio → `session\_type` NON guida più né la UI né il motore (resta solo nel DB/codice, cleanup futuro possibile).

\- \*\*Isometrici (metric=time) — ✅ SHIPPED (giugno 2026):\*\* `metric=time` se Reps matcha `/\\d+\\s\*(sec|min)/i` (`isTimedReps`). Widget cronometro conta-su (`Date.now()`) + infobox Secondi (input `reps\_a` VISIBILE, placeholder "sec"); i secondi vivono nel campo `reps` + marker OPZIONALE `metric:'time'` nel set (retrocompat: log vecchi senza marker = reps). Log via aeroplanino Invia (`sendMsg`); RIMOSSI bottone Registra/`holdManual`/`holdLog`. Etichetta del log "Tenuta: N sec"; `hasReps` esteso a `/Tenuta:\s\*\d+/`. Avanzamento contatore set in `sendMsg` (gated `currentTimed && single`, via `holdTotSet`). NIENTE RIR sulle tenute; RPE/Fatica opzionale; peso se weighted. Avanzato: campo `seconds` dedicato (jsonb, niente migration, ma aggiornare tutti i reader). (Il lato PROMPT degli isometrici è GIÀ coperto nei coach\_rules MUP.)

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

\- `selectExercise(name)`: chiude l'overlay, \*\*ripulisce la quick-option pendente\*\* (commit `675f89e`), `currentSetNum = nextSetNum(name)`, imposta mode/exercises/state, `renderInputFields('single',\[name])`, `setInputLocked(false)`, popola i 4 box dal CSV. \*\*Learning — `#quickOptions` è il container DOM UNICO di TUTTE le quick-option\*\* (bottone "Pronto" del warm-up + option-chip): va ripulito sia da `addBubble` sia ora da `selectExercise`, altrimenti scegliere un esercizio dalla lista prima di premere "Pronto" lascia il bottone appeso e salta il saluto post-pronto.

\- `updateSetInfo(text)`: `currentSetNum = nextSetNum(logName)`; N da `nextSetNum` + TOT dal CSV (fallback al TOT del tag).

\- `sendMsg` (single): antepone "Esercizio: <nome>". Superset: singolo `currentSetNum` su `ssNames\[0]`.

\- Warm-up non-tappabile: righe con `/riscald|warm/i` nella `Note` → `class="wlist-ex wlist-ex-warmup"` (NESSUN onclick). CSS `.wlist-ex-warmup{cursor:default;opacity:.55;}`.

\## Session Screen Rules

\- `updateSetInfo(text)` popola 3 box e salva `currentSetNum` (= `nextSetNum`). \*\*✅ TARGET BOX PER ESERCIZIO (peso via colonna CSV `peso`, NON `session\_type`):\*\* weighted (cella `peso` non vuota → `currentWeighted` true) → il box mostra il PESO (= valore della colonna, che è anche il target); altrimenti Tempo. Stessa logica in `selectExercise` (da `field.peso`/`field.tempo`). `currentWeighted` pilota anche show/hide di `#weightRow` ed è LETTA da `sendMsg` per il GATING del peso loggato (per-esercizio). Niente label per-riga, nessun cambio di ID. SUPERATO l'approccio Note/`session\_type==='gym'`; `session\_type` resta solo per il motore (delta coach\_prompt) + DB.

\- `fmtText(text)` rimuove tag \[SET:]/\[SUPERSET:]/\[CUE:]/\[PRONTO]/\[LOG\_DATA:] e righe set-info (la strip di `\[CUE:]` è DIFENSIVA: feature rimossa, strip intenzionale → lasciarla); se ritorna null/vuoto -> bubble NON renderizzato. `extractOptions(text)` ritorna \[] se il testo contiene \[SET:]/\[SUPERSET:]/\[PRONTO].

\- \*\*Salvataggio PER-SERIE:\*\* `sendMsg` costruisce i set con `reps > 0` (RIR `null` se vuoto, RPE/Fatica `null` se nessun bottone, uno 0 dichiarato resta 0), `setNum = currentSetNum` -> `queueAutosave` -> `persistSets` (INSERT prima serie, UPDATE con dedup nome+setNum). La scrittura `sessions` vive in `persistSetsWrite` (ritorna true/false); su scrittura fallita `persistSets` fa `sb.auth.refreshSession()` + 1 retry della scrittura (token scaduto da tab in background, cfr `aiSend` `d87ecfe`; commit `3088677`). \*\*Sessioni demo NON persistite\*\* (`if(currentProfile.\_isDemo) return;` in `persistSets`) — usate dall'onboarding E dalla test session admin. \*\*Le FUTURE sessioni trial (1A) invece PERSISTONO: niente `\_isDemo`.\*\* \*\*Isometrici:\*\* nel ramo single il log è etichettato "Tenuta: N sec" (invece di "Reps: N") quando `currentTimed`, e `hasReps` matcha anche `/Tenuta:\s\*\d+/` così il timer recupero si ferma anche sulle tenute.

\- \*\*Chiusura con "Torna":\*\* `showDash` ferma il timer recupero, ripristina `\_orig` se demo, e — se `testSession` — torna ad `adminScreen` tab Template (non alla dashboard atleta). \*\*Topbar: SOLO "Torna" + "lista".\*\*

\- \*\*`deleteLog` (fix `7f8315d`):\*\* ramifica su `currentProfile.role==='admin'` → admin: solo `renderLogTable()` (resta su `adminScreen`); atleta: `showDash()`. NON reintrodurre la `showDash()` incondizionata.

\- \*\*Ripresa:\*\* `resumeSession(sessionRow, program)` riaggancia `currentSessionId`, idrata `sessionLog` da `log\_data`, ricostruisce `currentProfile`, chat pulita + "Bentornato" + re-brief. NON creare una seconda riga sessions. NON mostrabile per le sessioni "Allenamento libero" (niente `programId`).

\- \*\*Riga input inline:\*\* `weightRow` nella stessa riga di reps e RIR (1:1:1); peso solo se gym, a DESTRA. NON spostare a sinistra. (Futuro: visibilità per-esercizio col descrittore.)

\## Timer — regole (fix background + timer-esercizio)

\- \*\*✅ Fix timer recupero background — SHIPPED (giugno 2026):\*\* il trascorso si calcola dal timestamp `Date.now()` (`sessionTimerEndAt` + ricalcolo dal diff con `ceil`; pausa congela il rimanente, resume ricalcola `endAt`; tick 250ms solo repaint), NON più `setInterval` decrementale. È il \*\*motore-timer unico a timestamp\*\*, base condivisa col cronometro delle tenute.

\- \*\*✅ Timer-esercizio a tempo — SHIPPED (giugno 2026):\*\* rilevamento DETERMINISTICO via regex sul campo Reps `/\\d+\\s\*(sec|min)/i` (NIENTE colonna/migration). Realizzato come \*\*cronometro CONTA-SU\*\* (`Date.now()`, Avvia/Stop): i secondi tenuti vivono nel campo `reps`, base CONDIVISA col fix timer recupero. \*\*VINCOLO mantenuto:\*\* NON un timer-intervalli configurabile completo. Vedi "Descrittore per-esercizio" (isometrici).

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

\- \*\*Mail resoconto AI\*\* (🟡) e reminder: cron Vercel UNICO + provider transazionale (\*\*Resend\*\* raccomandato; non più gated dal rebranding, chiuso 16/06; \*\*CONDIVISO col flusso OTP 1B\*\* che ne ha dipendenza HARD). MVP resoconto SENZA immagini (testo + numeri + link Progressi); avanzato QuickChart.

\## Ottimizzazione costi (regole attive in aiSend)

\- Filtro CSV: all'AI va solo il workout scelto (Leva 1)

\- History SEMPRE troncata agli ultimi 12 messaggi (`MAX\_HISTORY`)

\- Storico ultime sessioni NON iniettato

\- `athleteContext` (profilo) iniettato solo al primo turno (`isFirst`). \*\*⚠️ REGOLA REVISIONATA (16/06, profilo SLIM):\*\* la vecchia nota "incl. infortuni — non eliminare (sicurezza)" NON vale più per il SELF-SERVE — nel self-serve il profilo è SLIM (solo nickname) → `athleteContext` snello/vuoto, niente dati infortuni/salute. La rete di sicurezza self-serve = contenuto di prova a basso rischio (bodyweight) + dolore segnalato in chat + disclaimer medico nei Termini. \*\*Infortuni/limitazioni si raccolgono SOLO nel questionario di CONVERSIONE "Richiedi il coaching" (con consenso esplicito):\*\* per quegli atleti, quando il profilo è popolato, `athleteContext` torna a iniettarli (e lì NON vanno eliminati — sicurezza)

\- \*\*Prompt caching (Leva 2):\*\* motore cachato in `chat.js` — non rompere (vedi Backend Rules). Il motore è cresciuto (\~250 token: precedenza + valutazione range) ma resta nel blocco cachato; i coach\_rules vanno tenuti SNELLI perché viaggiano nel blocco NON cachato.

\## COACH\_LOG\_FORMAT — RIMOSSO (15/06)

`COACH\_LOG\_FORMAT` e `saveSessionLog()` sono stati RIMOSSI da `index.html` (15/06; erano morti, zero chiamanti). Non reintrodurli. (I protocolli "REGOLA FINE"/"WORKOUT LOG" nei coach\_rules sono stati rimossi — zombie.)

&#x20;

\## log\_data — due formati (backward compatible)

```

Nuovo: exercises\[].sets = \[{reps, rir, rpe, weight, note, setNum}]  <- renderProgressCharts / persistSets

Vecchio: exercises\[].reps/rir/sets (number)                          <- getExSets()

```

\- RIR/RPE `null` = non dichiarato (escluso dai grafici via `numOrNull`); uno 0 dichiarato resta valido. `weight` 0 = corpo libero (valido).

\- \*\*Isometrici (✅ SHIPPED):\*\* i secondi vivono nel campo `reps` + campo OPZIONALE `metric:'time'` nel set (retrocompat: log vecchi senza marker = reps) → relabel Progressi in secondi. Avanzato: campo `seconds` dedicato.

\## Database Rules

\- `profiles.role`: solo `'admin'` o `'athlete'`

\- `profiles.status`: solo `'active'`, `'pending'`, `'inactive'`. \*\*L'admin deve essere `'active'`\*\* (vedi gate chat.js sopra). \*\*✅ Trial 1A (DECISO 12/06):\*\* stato trial = RIUSO di `'pending'` (nessun valore nuovo): `pending` = trialist (logga + chatta fino a N=3), conversione admin → `'active'`. \*\*`status`/`role` READ-ONLY ai non-admin\*\* via trigger `trg\_protect\_profile\_fields` (vedi sotto).

\- `programs.session\_type` / `program\_templates.session\_type`: solo `'bodyweight'` o `'gym'` (NON introdurre `'mixed'` — il caso misto si gestisce col descrittore per-esercizio)

\- `exercises.owner\_id = null` = esercizio globale

\- \*\*✅ Profilo SLIM self-serve — CHIUSO/GIÀ IMPLEMENTATO (verifica codice 24/06):\*\* la UI self-serve in-app (`profileScreen`) scrive GIÀ SOLO `name` (= nickname; input `p_name`, `saveProfile` valida solo il nickname); il form completo (nome/cognome/telefono/infortuni…) vive in `onboardScreen` ed È il questionario di CONVERSIONE "Richiedi il coaching", distinto e voluto → niente da implementare. Gli altri campi profilo (biometrie, `infortuni`, salute, obiettivi…) restano NULLABLE e si popolano SOLO dal questionario di conversione. \*\*Semplificazione SOLO-UI → NESSUNA migration\*\* (non droppare colonne). Il consenso salute (Art. 9) è confinato al questionario di conversione (vedi regola `athleteContext` revisionata).

\- \*\*La colonna `workouts` è stata DROPPATA da `programs` e `program\_templates` (14/06)\*\* — source of truth = `workout\_csv`. NON reintrodurla e NON copiarla tra le tabelle né in `repushTemplate`.

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

\- \*\*Non convertire i .js frontend in ES modules; non togliere/riordinare i tag `<script>` (inline → progress.js → admin-ui.js → log.js) né il `<link styles.css>`; non estrarre il core sessione AI da `index.html`\*\*

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

\- \*\*Non reintrodurre la guardia all'ordine\*\*, nemmeno in forma gentile o come richiesta di conferma del cambio esercizio (il prefisso "Esercizio:" è autoritativo, anche post-warm-up); niente "siamo ancora su X" / "torniamo a X" / elenco mancanti / "è l'ultimo"

\- \*\*Non rietichettare gli isometrici come "Reps"\*\* — il log delle tenute usa "Tenuta: N sec"

\- Non reintrodurre il bottone "fine" ne' la generazione del log dall'AI; non reintrodurre "skip"/`qSend`/`buildSkipMessage`; non reintrodurre `session\_drafts`

\- \*\*Non reintrodurre i protocolli "REGOLA FINE"/"WORKOUT LOG" nei coach\_rules\*\* (zombie rimossi, giugno 2026)

\- \*\*Non rimuovere dal motore i blocchi PRECEDENZA — FILOSOFIA DI PROGRAMMA e VALUTAZIONE DEL RANGE\*\* (reggono i programmi maxout/misto e la correttezza del feedback sui range)

\- \*\*Non reintrodurre i delta `coach\_prompt\_gym`/`coach\_prompt\_bodyweight` nel motore\*\* (SVUOTATI giugno 2026): il comportamento peso/tempo è PER-ESERCIZIO dalla colonna CSV `Peso`, nel blocco CARICO O CORPO LIBERO di `coach\_prompt\_global`

\- \*\*Non rimettere la soglia RIR nei `coach\_rules` Muscle-Up Pro\*\* (3B chiusa): la leva di difficoltà è il trigger DETERMINISTICO `reps > tetto`, gestito dal motore — non il giudizio RIR del modello

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

