\# Project Overview

&#x20;

\## Nome Progetto

AILISTENICS

&#x20;

\## Descrizione

Piattaforma di AI coaching personalizzato per calisthenics, movement training e palestra.

Il coach AI guida l'atleta durante ogni sessione di allenamento in tempo reale, adattando il

workout al profilo individuale (livello, obiettivi, infortuni, attrezzatura) e — soprattutto —

leggendo e rispondendo a RIR/RPE dichiarati dall'atleta. L'admin (Carlo) gestisce atleti,

programmi e libreria esercizi via pannello dedicato. I programmi vivono come \*\*libreria di

template riassegnabili\*\*, assegnabili a più atleti con aggiornamento in cascata.

&#x20;

\## Modello di prodotto e monetizzazione

> Decisioni emerse dal brainstorming roadmap. Guidano prezzo e positioning.

\- \*\*Subscription = spina dorsale.\*\* Il coaching AI ha un costo ricorrente (token) per utente

&#x20; attivo, quindi il ricavo dev'essere ricorrente. NIENTE acquisto una-tantum dei programmi.

\- \*\*Premium via TIER\*\* (es. Basic / Pro / Coached), non vendita à la carte.

\- \*\*Progressione skill inclusa\*\* nell'abbonamento come retention, NON un paywall tra programmi.

\- \*\*Differenziatore core (positioning):\*\* coaching AI in tempo reale che LEGGE e RISPONDE a

&#x20; RIR/RPE. Le altre app (Hevy, Boostcamp) loggano RIR/RPE in modo passivo; il coaching che ci

&#x20; agisce sopra è il fossato. NON costruire il pitch su "nessuno traccia il RIR" (è falso).

\- \*\*✅ DECISIONE — Funnel di accesso IBRIDO (giugno 2026):\*\* il fork "self-serve vs approvazione

&#x20; admin" è CHIUSO. Entrata SELF-SERVE (via Google) con N allenamenti di prova reali su un template

&#x20; di prova; l'approvazione admin si sposta alla CONVERSIONE (richiesta di coaching). Razionale: il

&#x20; differenziatore si capisce solo provandolo; alla richiesta l'admin ha già profilo + log reali.

&#x20; Vedi "Funnel trial self-serve" in TASKS (🔴; fork aperti: valore N, semantica "consumata").

&#x20; \*\*✅ Self-activation gap CHIUSA (12/06):\*\* trigger `trg\_protect\_profile\_fields` su `profiles` (BEFORE UPDATE: `status`/`role` read-only ai non-admin) applicato e verificato in produzione. \*\*Parte SERVER di 1A FATTA\*\* (trigger + gate trial `chat.js` `TRIAL\_SESSIONS=3` + hardening + log puliti); restano template di prova + frontend (CTA + auto-assegnazione) + Test C live.

\- \*\*Estensione del fossato (periodizzazione):\*\* i RIR/RPE raccolti in tempo reale possono alimentare

&#x20; l'analisi TRA le sessioni (progressione carichi/deload suggeriti dall'AI) → il fossato si estende

&#x20; dal "durante" al "tra" le sessioni. Vedi "Analisi AI progressioni" in TASKS (GATED). La \*\*mail

&#x20; resoconto AI settimanale\*\* (TASKS 🟡) usa la stessa leva dati ed è il suo banco di prova.

\- \*\*Differenziazione tier:\*\* self-serve AI (sblocchi automatici via milestone) vs tier coached/live

&#x20; (il coach verifica gli sblocchi, corregge la forma, personalizza, dà accountability). Il premium è

&#x20; il giudizio umano, non l'accesso alle skill.

\- \*\*Sconto studenti\*\* per il pubblico locale/giovane.

\- \*\*⚠️ Pagamenti su iOS:\*\* se in futuro l'app va su App Store, le sub digitali vendute in-app passano

&#x20; per l'in-app purchase Apple (commissione 15-30%); Stripe resta libero su web e Android. Decisione

&#x20; strategica che impatta il flusso Stripe (vedi "Distribuzione app store" in TASKS).

\## Stato Attuale

\- \*\*Production\*\* — live su ailistenics.com (Vercel)

\- Frontend: vanilla JS \*\*multi-file\*\* (refactor fase 1, giugno 2026): `index.html` (\~1934 righe) + `styles.css` + `progress.js` (Progressi/grafici) + `admin-ui.js` (admin panel/template/test session). Script CLASSICI non-module → funzioni e var globali. Il CORE SESSIONE AI resta in `index.html` di proposito

\- \*\*✅ Gate di sintassi pre-deploy (ATTIVO):\*\* prima di OGNI push frontend, apertura di `index.html` in Chrome incognito + console (F12): nessun `Uncaught SyntaxError`, nessun 404 sui file esterni → safe to push. Documentato in CLAUDE.md. Elimina la causa #1 della "pagina bianca"

\- Backend: Vercel Serverless Functions (`/api/chat.js`, `/api/admin.js`, `/api/callback.js`)

\- Auth: funzionante (Google OAuth PKCE + email/password). `detectSessionInUrl: false` su `index.html` e `reset.html`. \*\*⚠️ CORREZIONE (giugno 2026): il RESET PASSWORD è ROTTO\*\* — era erroneamente dato per funzionante. Fix legato al percorso email/password (TASKS 🟡 1B: invito = reset = stesso meccanismo Supabase)

\- \*\*Sicurezza `/api/admin.js`\*\*: auth gate (JWT + `role==='admin'`); frontend via `adminFetch`

\- \*\*Sicurezza `/api/chat.js`\*\*: auth gate (JWT) + gate status. \*\*Gate trial ATTIVO (12/06):\*\* `active` → passa; `pending` = trialist → passa per le prime `TRIAL\_SESSIONS=3` sessioni (count `sessions` per `u.id` del JWT, service role), oltre → `403 trial\_exhausted`; `inactive` → `403 account\_not\_active`. Hardening verificato (decisione solo su `u.id` del JWT + profilo service role). Manca il rate-limit (Fase 2). \*\*NB: il gate vale anche per l'admin\*\* → l'admin deve avere `status='active'` (altrimenti 403 sulle sessioni di test). Risolto via SQL `update profiles set status='active' where role='admin'`

\- \*\*RLS Supabase\*\*: abilitata su tutte le tabelle; `admin.js`/`chat.js` (service role) la bypassano

\- \*\*AI Coach session:\*\* salvataggio PER-SERIE automatico; chiusura con "Torna"; topbar SOLO "Torna" + "lista"; RIR/Fatica OPZIONALI; timer recupero, superset; \*\*warm-up OBBLIGATORIO\*\* (vedi sotto); lista tappabile (ordine libero); ripresa esplicita; picker workout pre-chat

\- \*\*✅ Warm-up obbligatorio (ATTIVO):\*\* il MOTORE (`coach\_prompt\_global`) impone a ogni avvio sessione un riscaldamento (dal CSV se c'è la riga, altrimenti generato) chiuso col tag `\[PRONTO]`; nessun `\[SET:]` prima del "pronto". Eccezione: nessun warm-up sulla ripresa di una sessione già iniziata

\- \*\*✅ Regola coach in-sessione (ATTIVA, motore) — correzione doc:\*\* "autoregolazione REATTIVA sì / progressione PROATTIVA no" NON è un blocco dedicato del motore: è espressa NEGLI SCHEMI FEEDBACK (global + delta gym/bodyweight — "sali di peso"/"variante" servono a CENTRARE il target del set corrente). L'override per maxout/misto passa dal blocco PRECEDENZA (sotto)

\- \*\*✅ Motore-prompt (ATTIVO, COMPLETO — giugno 2026):\*\* regole comuni nel MOTORE (`settings`), anteposto da `chat.js` per `session\_type`; coach\_rules per-programma solo specifici. \*\*TUTTI i 9 programmi migrati\*\*, inclusi i casi maxout/misto: blocco \*\*"PRECEDENZA — FILOSOFIA DI PROGRAMMA"\*\* nel global (i coach\_rules con filosofia dichiarata prevalgono sui conflitti) + coach\_rules snelli di New Workout (FILOSOFIA MAXOUT) e Muscle-Up Pro (FILOSOFIA MISTA + isometrici + leve di difficoltà). Aggiunto anche il blocco \*\*"VALUTAZIONE DEL RANGE"\*\* (tetto del range = successo; schemi feedback = esempi, vietata la frase fotocopia). Test "Prova" validati in produzione

\- \*\*✅ Sistema template programmi (ATTIVO):\*\* libreria di template riassegnabili (`program\_templates` + `programs.template\_id`); "Assegna" + "Applica a tutti" (snapshot + repush). Migrazione FATTA (9 template)

\- \*\*✅ Test sessione AI Coach dall'admin ("Prova") — ATTIVO:\*\* dalla tab Template, "Prova" su una card avvia una sessione AI reale col contenuto del template, \*\*non persistita\*\* (riusa la primitiva demo `\_isDemo`; contesto atleta neutro), e "Torna" riporta al pannello admin. (Var `testSession`, id `atabTemplates`.)

\- \*\*Meccanismo demo:\*\* `startDemoSession`/`\_isDemo`/`\_orig` + guardia in `persistSets` + restore in `showDash` sono VIVI (usati da onboarding e dalla test session) — NON rimossi

\- \*\*Leva 2 — Prompt caching (ATTIVO):\*\* `cache\_control: ephemeral` sul blocco motore in `/api/chat.js` (\~90% di taglio sulla porzione statica). Commit `ee173c7`. I coach\_rules snelliti di MUP/NW hanno ridotto anche il blocco non cachato

\- \*\*Target box per tipo:\*\* bodyweight → Tempo; gym → Peso (col Note). I rep range e il "per lato" si vedono correttamente nel box. \*\*Eccezione documentata:\*\* in New Workout la Note contiene le varianti (non il peso) → il box mostra quel testo (accettato: filosofia maxout, il peso lo trova l'atleta)

\- \*\*✅ Bug admin cancellazione sessione — RISOLTO (11/06, commit `7f8315d`):\*\* `deleteLog` ramifica su `role==='admin'` → l'admin resta nel pannello

\- Admin panel: gestione atleti, sessioni, libreria esercizi 49+, \*\*tab Template\*\*

\- Progressi: grafici per esercizio + overview

\- Ottimizzazioni costi API attive (troncamento history, no storico, contesto atleta solo primo turno, filtro CSV, prompt caching)

\- \*\*Sviluppo via Claude Code\*\* sul repo locale (CLAUDE.md nel repo) + git/GitHub → deploy automatico Vercel

\## Problemi Aperti

\- \*\*⚠️ RESET PASSWORD ROTTO\*\* — i doc lo davano funzionante, NON lo è. Fix = stesso meccanismo dell'invito email/password (Supabase recovery/`inviteUserByEmail`) → un solo lavoro, vedi TASKS 🟡 1B. Non bloccante per il trial funnel (lancio solo-Google)

\- \*\*Refactor monolite → FASE 1 FATTA (giugno 2026), refactor FERMATO QUI di proposito.\*\* Gate di sintassi + estrazione `styles.css`/`progress.js`/`admin-ui.js`: rischio pagina-bianca eliminato, blast radius ridotto, `index.html` −30% (\~1929 righe, oggi \~1934; pre-refactor 2757). Il CORE SESSIONE AI resta in `index.html` DI PROPOSITO. Estrazioni residue OPZIONALI (vedi TASKS 🟢)

\- \*\*✅ RIR target per-programma — FATTO (tutti).\*\* BBR fascia 0-3, i 3 gym \~3, maxout 0-1 via filosofia New Workout

\- \*\*✅ Motore-prompt — migrazione COMPLETA (giugno 2026).\*\* Anche maxout/misto, via PRECEDENZA + override nei coach\_rules. Chiuso

\- \*\*Prerequisito/hardening admin per `/api/chat.js`:\*\* oggi l'admin deve avere `status='active'` (fix dati applicato). Hardening opzionale ANCORA APERTO: gate `status==='active' || role==='admin'` (il gate trial 1A è ora implementato; questo bypass admin resta separato e non urgente, il fix dati basta)

\- \*\*Sessioni miste (bodyweight + gym) non gestite per-esercizio LATO UI\*\* → descrittore per-esercizio (peso/isometrici dal CSV). Il lato PROMPT del misto è già coperto (filosofia MUP). Vedi TASKS

\- \*\*Apps Script da rivedere pesantemente\*\* (questionario + mail richiesta coaching, doppia mail, contenuti; dipendenza GEMINI API ora documentata in ARCHITECTURE) — vedi TASKS 🟡; non costruirci sopra nuove feature

\- \*\*`/api/chat.js` — manca il rate-limit\*\* (Fase 2)

\- Nessun sistema di pagamento ancora integrato (Stripe pianificato)

\- Nessuna notifica push / reminder allenamento (è anche il "valore nativo" per l'App Store)

\- \*\*Timer recupero si ferma se l'app va in background\*\* → fix con `Date.now()`; è la FONDAZIONE del timer-esercizio a tempo

\- \*\*Validazione `coach\_rules` non vuoto\*\* → da togliere (utile per il SaaS). NB: il guard della test session già controlla `workout\_csv`, non i coach\_rules

\- \*\*`programs.workouts` vestigiale\*\* (`text`, non jsonb) — `repushTemplate` non lo tocca; da rimuovere in un cleanup

\- \*\*Open question strategiche (non task, vedi TASKS 💡):\*\* rebranding del nome (nessuna decisione; il "Dominio email personalizzato" ne eredita il gate) e doppia source-of-truth dei doc (ponte git `/docs` + `@`-import in CLAUDE.md)

\- \*\*FORK APERTI (da decidere, NON ancora risolti):\*\*

&#x20; - \_(✅ CHIUSO 12/06: N=3; "sessione consumata" = riga in `sessions`; stato trial = riuso 'pending')\_

&#x20; - Progressione programma: carichi scritti dal coach nel CSV (default MVP) \*\*vs\*\* app che suggerisce i carichi (= periodizzazione AI)

&#x20; - Periodizzazione AI: il programma personalizzato per-atleta DIVERGE dal template → regola template-tiene-struttura \*\*vs\*\* carichi-personalizzati-su-copia

&#x20; - \_(RISOLTO con l'ibrido: self-serve vs approvazione admin — vedi Modello di prodotto)\_

\## Obiettivi

\- Coaching AI personalizzato su misura (calisthenics/bodyweight + palestra)

\- Tracking progressioni nel tempo

\- Onboarding automatico + assegnazione programma suggerita dall'AI

\- \*\*Funnel trial self-serve\*\* (entrata Google, N sessioni di prova, conversione = richiesta coaching)

\- \*\*Gestione programmi come libreria di template — FATTA (mono-coach).\*\* Multi-coach resta GATED

\- \*\*Progressione del programma\*\* come sequenza ("dove sono / prossimo workout") — spina dorsale che collega multi-fase, sblocco skill, fine sessione chiara

\- \*\*Periodizzazione attiva\*\* (analisi AI progressioni + deload, coach-in-the-loop) — estende il fossato; la \*\*mail resoconto AI\*\* ne è il banco di prova

\- \*\*Monetizzazione ad abbonamento\*\* con struttura a tier; piano SaaS multi-coach; eventuale distribuzione app store (gated)

\## Target

Atleti calisthenics e movement, principianti e intermedi. Community locale Alto Adige / area Egna,

espandibile online. Programmi anche per palestra tradizionale.

&#x20;

\## Programmi Attivi (e relativi template)

> Ogni programma è agganciato a un template (libreria). 9 template totali. I prompt (coach\_rules)

> vivono in Supabase (admin / tab Template), non nel codice; il MOTORE (`settings`) tiene il

> comportamento comune. \*\*Tutti i 9 programmi girano sul motore\*\* (giugno 2026).

\- \*\*Body By Rings\*\* — bodyweight, rings forza/skill. RIR fascia 0-3 (regola affinata applicata)

\- \*\*741 Fitness\*\* — gym, ipertrofia (Petra). RIR target \~3 (APPLICATO). \*\*CSV ripulito:\*\* rep range

&#x20; (compound 10-13, isolamenti 12-15, core 15-18/17-20), monolaterali con "per lato" nelle Reps,

&#x20; Adduzioni+Abduzioni 3+3 adiacenti a fine giornata su tutti i giorni

\- \*\*POOL DANGER HYPERTROPHY\*\* — gym, ipertrofia (Caterina). RIR \~3 (APPLICATO)

\- \*\*Bro split\*\* — gym, ipertrofia (Federico). RIR \~3 (APPLICATO)

\- \*\*Muscle-Up Pro — Level 1\*\* — bodyweight, misto corpo-libero/peso + isometrici a tempo.

&#x20; \*\*✅ MIGRATO al motore (giugno 2026)\*\* con coach\_rules snelli: FILOSOFIA MISTA ("con peso"

&#x20; per-esercizio), ISOMETRICI (tieni Ns, niente RIR, conteggio set esplicito), LEVE DI DIFFICOLTÀ

&#x20; skill. Resta il CASO MISTO per il \*\*descrittore per-esercizio (lato UI)\*\*

\- \*\*New Workout\*\* — gym, filosofia maxout (cedimento, RIR 0-1). \*\*✅ MIGRATO al motore (giugno

&#x20; 2026)\*\* via PRECEDENZA: FILOSOFIA MAXOUT (RIR 0 = obiettivo), SCHEMA PESO Set1/Set2. \*\*Quirk CSV

&#x20; documentato:\*\* Note = varianti/schema, NON peso (eccezione alla regola gym; Reps "10 / 13-15" =

&#x20; target Set1/Set2)

\- \*\*Freestyle leg day\*\* — bodyweight

\- \*\*Project Pina - Fase 1\*\* — bodyweight

\- \*\*Upper / Lower Rotation - W1-W2\*\* — gym

\## Features principali

\- \*\*Auth\*\* — Google OAuth (PKCE) + email/password (⚠️ reset rotto, vedi Problemi Aperti)

\- \*\*Dashboard atleta\*\* — programmi assegnati, statistiche, log recenti, riquadro "Riprendi"

\- \*\*AI Coach session\*\* — chat real-time, 3 info box, salvataggio per-serie, lista tappabile (ordine libero), \*\*warm-up obbligatorio\*\*; chiusura con "Torna"

\- \*\*Sistema template programmi\*\* — libreria riassegnabile (tab Template): crea, modifica, elimina, \*\*Assegna\*\*, \*\*Prova\*\* (test session non persistita), \*\*Applica a tutti\*\*

\- \*\*Test sessione admin ("Prova")\*\* — avvia una sessione AI reale da un template senza switchare account, non persistita

\- \*\*Ordine libero\*\* — tap su un esercizio della lista; setNum deterministico lato frontend

\- \*\*Ripresa esplicita\*\* — riaggancia la sessione < 24h sulla stessa riga `sessions`

\- \*\*Picker workout\*\* — overlay pre-chat per i multi-workout

\- \*\*log\_data strutturato\*\* — per-set con reps/rir/rpe/weight/note + programId/chosenWorkout

\- \*\*Profilo atleta\*\* — dati fisici, obiettivi, attrezzatura, infortuni

\- \*\*Admin panel\*\* — gestione atleti, log, libreria esercizi, tab Template

\- \*\*Schermata Progressi\*\* — tab Esercizio + Overview

\- \*\*Libreria esercizi\*\* — 49+ esercizi

\- \*\*Onboarding form\*\* — email automatica via Apps Script (in overhaul, vedi TASKS)

\- \*\*(In arrivo)\*\* Funnel trial self-serve (Google); Mail resoconto AI settimanale; Logo/icona home screen (passo 1 PWA); Breathwork (frontend-only); Progressione programma (sequenza "prossimo workout"); Peso per-esercizio + Logging isometrici (descrittore per-esercizio); Timer-esercizio a tempo; Editor tabellare programmi (CSV↔tabella); Allenamento libero (log manuale, no AI); Periodizzazione attiva (GATED); Distribuzione app store (GATED)

