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

&#x20; Vedi "Funnel trial self-serve" in TASKS (✅ COMPLETO; fork chiusi: N=3, "consumata" = riga in `sessions`, stato trial = riuso `pending`).

&#x20; \*\*✅ Self-activation gap CHIUSA (12/06):\*\* trigger `trg\_protect\_profile\_fields` su `profiles` (BEFORE UPDATE: `status`/`role` read-only ai non-admin) applicato e verificato in produzione. \*\*1A COMPLETO E LIVE (13/06):\*\* server (trigger self-activation + gate trial `chat.js` `TRIAL\_SESSIONS=3` + hardening + log puliti) + template di prova "Prova — Full Body" + frontend (CTA `trial\_exhausted`) + auto-assegnazione via \*\*trigger DB\*\* (`trg\_assign\_trial\_program`); verificato end-to-end (Test C, account Google nuovo). Dettaglio in "Stato Attuale" e ARCHITECTURE.

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

\- \*\*✅ DECISIONE — Priorità attuale = VALIDAZIONE con conversione MANUALE (16/06):\*\* la prima mossa
&#x20; è convertire a mano i primi \*\*1-3 trialist reali\*\* col percorso manuale GIÀ esistente (CTA
&#x20; "Richiedi il coaching" → mailto → l'admin porta `pending`→`active` + incasso manuale). \*\*Stripe
&#x20; resta GATED dietro la prima conversione manuale\*\*: prima si validano i paganti, poi si automatizza
&#x20; il pagamento. Vedi "Conversione manuale primi trialist" e "Stripe" in TASKS.

\- \*\*⚠️ Nota fiscale Stripe (NON è consulenza — da confermare col commercialista):\*\* costruire Stripe
&#x20; in \*\*Test Mode\*\* è legale e senza requisiti; per \*\*incassare un abbonamento ricorrente\*\* serve
&#x20; \*\*partita IVA\*\* (attività abituale) — la prestazione occasionale (<5.000€) NON copre un SaaS
&#x20; ricorrente. Regime \*\*forfettario\*\* soglia 85.000€, flat tax 15% (5% nei primi 5 anni); \*\*caveat:\*\*
&#x20; il reddito da lavoro dipendente dell'anno precedente (soglia nell'ordine dei 30.000€) può escludere
&#x20; il forfettario → da verificare. Obbligo fattura elettronica; autofattura reverse charge \*\*TD17\*\*
&#x20; sulle commissioni Stripe (Stripe Ireland).

\## Stato Attuale

\- \*\*Production\*\* — live su ailistenics.com (Vercel)

\- Frontend: vanilla JS \*\*multi-file\*\* (refactor fase 1, giugno 2026): `index.html` (\~1787 righe) + `styles.css` + `progress.js` (Progressi/grafici) + `admin-ui.js` (admin panel/template/test session/libreria esercizi) + `log.js` (modale log). Script CLASSICI non-module → funzioni e var globali. Il CORE SESSIONE AI resta in `index.html` di proposito (`buildLogSummary` incluso)

\- \*\*✅ Gate di sintassi pre-deploy (ATTIVO, ora AUTOMATICO):\*\* pre-commit hook (`core.hooksPath .githooks` → `scripts/syntax-check.js`, `node --check` su index.html inline + progress.js + admin-ui.js + log.js, commit `d258d6d`) blocca il commit su `SyntaxError`. In più il check manuale (Chrome incognito + console F12: nessun `Uncaught SyntaxError`, nessun 404) per il visivo/runtime. Documentato in CLAUDE.md. Elimina la causa #1 della "pagina bianca". \*\*Node.js `v24.16.0` installato in locale (13/06)\*\* → `vercel dev` ora possibile

\- Backend: Vercel Serverless Functions (`/api/chat.js`, `/api/admin.js`, `/api/callback.js`)

\- Auth: \*\*funziona SOLO Google OAuth (PKCE)\*\*. `detectSessionInUrl: false` su `index.html` e `reset.html`. \*\*⚠️ CORREZIONE (giugno 2026): l'INTERO percorso EMAIL/PASSWORD NON è attivo\*\* — non è solo il reset rotto: login/signup via email+password non funziona affatto. Era erroneamente dato per funzionante. \*\*Piano (16/06): SOSTITUIRE il path email/password con un flusso OTP a codice\*\* (Supabase `signInWithOtp` + `verifyOtp` + `updateUser` per la password) che unifica signup/login/reset e scavalca il magic-link/PKCE rotto = TASKS 🟡 1B (dipende da SMTP custom / provider transazionale)

\- \*\*Sicurezza `/api/admin.js`\*\*: auth gate (JWT + `role==='admin'`); frontend via `adminFetch`

\- \*\*Sicurezza `/api/chat.js`\*\*: auth gate (JWT) + gate status. \*\*Gate trial ATTIVO (12/06, raffinato 13/06):\*\* `active` → passa; `pending` = trialist → passa per le prime `TRIAL\_SESSIONS=3` sessioni (count via GET `sessions select=created\_at` per `u.id` del JWT, service role; la sessione più recente se < 24h non conta — finestra "Riprendi", commit `21b25ff`), oltre → `403 trial\_exhausted`; `inactive` → `403 account\_not\_active`. Sul 403 il frontend mostra la CTA "Richiedi il coaching" (commit `5323bd3`). Hardening verificato (decisione solo su `u.id` del JWT + profilo service role). Manca il rate-limit (Fase 2). \*\*NB: il gate vale anche per l'admin\*\* → l'admin deve avere `status='active'` (altrimenti 403 sulle sessioni di test). Risolto via SQL `update profiles set status='active' where role='admin'`

\- \*\*✅ Funnel trial self-serve (LIVE, 13/06):\*\* entrata self-serve via Google → al primo login il template "Prova — Full Body" (corpo libero, 1 workout, autoregolazione RIR) viene auto-assegnato da \*\*trigger DB\*\* (`trg\_assign\_trial\_program`) → 3 sessioni reali che popolano i Progressi → al tentativo successivo `403 trial\_exhausted` con CTA "Richiedi il coaching" (mailto all'admin). La conversione admin (`pending` → `active`) riapre la chat. Verificato end-to-end (Test C). Email/password (1B) e provider transazionale = lavori futuri

\- \*\*RLS Supabase\*\*: abilitata su tutte le tabelle; `admin.js`/`chat.js` (service role) la bypassano

\- \*\*AI Coach session:\*\* salvataggio PER-SERIE automatico; chiusura con "Torna"; topbar SOLO "Torna" + "lista"; RIR/Fatica OPZIONALI; timer recupero, superset; \*\*warm-up OBBLIGATORIO\*\* (vedi sotto); lista tappabile (ordine libero); ripresa esplicita; picker workout pre-chat

\- \*\*✅ Warm-up obbligatorio (ATTIVO):\*\* il MOTORE (`coach\_prompt\_global`) impone a ogni avvio sessione un riscaldamento (dal CSV se c'è la riga, altrimenti generato) chiuso col tag `\[PRONTO]`; nessun `\[SET:]` prima del "pronto". Eccezione: nessun warm-up sulla ripresa di una sessione già iniziata

\- \*\*✅ Regola coach in-sessione (ATTIVA, motore) — correzione doc:\*\* "autoregolazione REATTIVA sì / progressione PROATTIVA no" NON è un blocco dedicato del motore: è espressa NEGLI SCHEMI FEEDBACK (global + delta gym/bodyweight — "sali di peso"/"variante" servono a CENTRARE il target del set corrente). L'override per maxout/misto passa dal blocco PRECEDENZA (sotto)

\- \*\*✅ Motore-prompt (ATTIVO, COMPLETO — giugno 2026):\*\* regole comuni nel MOTORE (`settings`), anteposto da `chat.js` per `session\_type`; coach\_rules per-programma solo specifici. \*\*TUTTI i 9 programmi migrati\*\*, inclusi i casi maxout/misto: blocco \*\*"PRECEDENZA — FILOSOFIA DI PROGRAMMA"\*\* nel global (i coach\_rules con filosofia dichiarata prevalgono sui conflitti) + coach\_rules snelli di New Workout (FILOSOFIA MAXOUT) e Muscle-Up Pro (FILOSOFIA MISTA + isometrici + leve di difficoltà). Aggiunto anche il blocco \*\*"VALUTAZIONE DEL RANGE"\*\* (tetto del range = successo; schemi feedback = esempi, vietata la frase fotocopia). Test "Prova" validati in produzione

\- \*\*✅ Sistema template programmi (ATTIVO):\*\* libreria di template riassegnabili (`program\_templates` + `programs.template\_id`); "Assegna" + "Applica a tutti" (snapshot + repush). Migrazione FATTA (9 template)

**Progressione programma (modello a fasi).** I programmi periodizzati multi-fase vivono in un solo CSV/template coi workout prefissati "Fase N - <sessione>". La vista dettaglio (tap sul programma) mostra i giorni della fase corrente con stato fatto/continua (logica min-count deterministica). Avanzamento automatico di fase non ancora implementato. Il vecchio pannello dashboard "Prossimo allenamento" e la funzione programProgress sono stati rimossi.

\- \*\*✅ Test sessione AI Coach dall'admin ("Prova") — ATTIVO:\*\* dalla tab Template, "Prova" su una card avvia una sessione AI reale col contenuto del template, \*\*non persistita\*\* (riusa la primitiva demo `\_isDemo`; contesto atleta neutro), e "Torna" riporta al pannello admin. (Var `testSession`, id `atabTemplates`.)

\- \*\*Meccanismo demo:\*\* `startDemoSession`/`\_isDemo`/`\_orig` + guardia in `persistSets` + restore in `showDash` sono VIVI (usati da onboarding e dalla test session) — NON rimossi

\- \*\*Leva 2 — Prompt caching (ATTIVO):\*\* `cache\_control: ephemeral` sul blocco motore in `/api/chat.js` (\~90% di taglio sulla porzione statica). Commit `ee173c7`. I coach\_rules snelliti di MUP/NW hanno ridotto anche il blocco non cachato

\- \*\*Target box per tipo:\*\* bodyweight → Tempo; gym → Peso (col Note). I rep range e il "per lato" si vedono correttamente nel box. \*\*Eccezione documentata:\*\* in New Workout la Note contiene le varianti (non il peso) → il box mostra quel testo (accettato: filosofia maxout, il peso lo trova l'atleta)

\- \*\*✅ Bug admin cancellazione sessione — RISOLTO (11/06, commit `7f8315d`):\*\* `deleteLog` ramifica su `role==='admin'` → l'admin resta nel pannello

\- Admin panel: gestione atleti, sessioni, libreria esercizi 49+, \*\*tab Template\*\*

\- Progressi: grafici per esercizio + overview

\- Ottimizzazioni costi API attive (troncamento history, no storico, contesto atleta solo primo turno, filtro CSV, prompt caching)

\- \*\*Sviluppo via Claude Code\*\* sul repo locale (CLAUDE.md nel repo) + git/GitHub → deploy automatico Vercel

\- \*\*✅ DECISIONE — Profilo SLIM self-serve (16/06):\*\* il profilo in-app self-serve = \*\*SOLO nickname\*\*.
&#x20; Tolti dalla UI self-serve nome, cognome, telefono, biometrie e dati salute. Coaching
&#x20; principle-driven → `athleteContext` snello/vuoto nel self-serve (la test session prova già che il
&#x20; motore gira su profilo neutro). \*\*REVISIONE CONSAPEVOLE\*\* della vecchia regola "athleteContext incl.
&#x20; infortuni — non eliminare (sicurezza)": gli infortuni/dati salute NON si raccolgono nel self-serve →
&#x20; rete di sicurezza = contenuto di prova generico e a basso rischio (bodyweight) + l'atleta segnala il
&#x20; dolore in chat + disclaimer medico nei Termini. \*\*Due profili distinti:\*\* SLIM in-app (nickname) vs
&#x20; questionario di CONVERSIONE ("Richiedi il coaching": intake completo + infortuni/salute con consenso
&#x20; esplicito). DB: semplificazione SOLO-UI, colonne profilo restano nullable, NESSUNA migration. Vedi
&#x20; TASKS + ARCHITECTURE + AI_RULES.

\- \*\*✅ DECISIONE — Landing + hero + flusso accesso (16/06):\*\* hero riscritto in italiano (headline
&#x20; "Il coach AI che adatta ogni serie alla tua fatica"); azioni "Accedi con Google" (primaria) + "Crea
&#x20; account con email" (primaria, \*\*flusso OTP a codice\*\*) + "Richiedi il coaching" come \*\*link
&#x20; secondario\*\*. Il blocco email/password rotto va \*\*SOSTITUITO\*\* dal flusso OTP (non solo nascosto).
&#x20; Footer con link Privacy/Termini + nota consenso al login. Vedi "Landing + hero" e 1B (OTP) in TASKS.

\- \*\*✅ DECISIONE — Layer privacy minimo (16/06):\*\* pagine statiche Informativa privacy + Termini, link
&#x20; nel footer, canale per la cancellazione. Col profilo slim NIENTE dati Art. 9 (salute) nel funnel
&#x20; self-serve → niente consenso salute nel funnel, probabilmente niente cookie banner (solo cookie di
&#x20; sessione); consenso salute confinato al questionario di conversione. Disclosure responsabili
&#x20; (Google, Supabase, Vercel, Anthropic), età minima 16, disclaimer medico nei Termini. Vedi TASKS.

\- \*\*✅ Pacchetto landing/privacy — STATO (17/06):\*\* \*\*Step 1\*\* pagine statiche `privacy.html` +
&#x20; `termini.html` FATTO (commit `41e1b6d`; ⚠️ placeholder `[DATA]` e `[EMAIL-CONTATTO]` ancora da
&#x20; compilare prima del lancio); \*\*Step 2\*\* footer consenso + link Termini/Privacy nella schermata di
&#x20; login FATTO (commit `304c891`); \*\*Step 3b\*\* blocco email/password e link "Password dimenticata?"
&#x20; NASCOSTI (`display:none`, NON cancellati) → login solo-Google (commit `a36d365`); il blocco email/pw
&#x20; è avvolto in `<div class="login-emailpw">` dentro `#loginScreen` = aggancio per la fase 2 OTP.
&#x20; \*\*Step 4\*\* (profilo SLIM self-serve, solo nickname) DECISO ma ANCORA DA IMPLEMENTARE.

\- \*\*✅ DECISIONE — Hero elaborato RIMANDATO alla fase i18n (17/06):\*\* la sostituzione della tagline
&#x20; con headline/sub/offer italiani (Step 3a) è stata \*\*scartata e revertata\*\* (mai committata). La
&#x20; tagline inglese "AI Coaching · Personalized · Adaptive" RESTA (scelta founder). L'hero elaborato si
&#x20; farà UNA volta sola, multilingua, dentro la fase i18n — non si scrive due volte.

\- \*\*✅ DECISIONE — i18n (IT/EN/DE) = STRADA A (17/06):\*\* lancio MVP \*\*in italiano ora\*\*,
&#x20; internazionalizzazione come \*\*fase dedicata e prioritaria SUBITO DOPO\*\*. Approccio: (1) \*\*coaching\*\*
&#x20; — i prompt in admin restano SOLO in italiano; si salva la lingua scelta dall'utente e `api/chat.js`
&#x20; aggiunge una direttiva al system ("rispondi all'atleta in {lingua}") → l'AI risponde IT/EN/DE
&#x20; leggendo il contesto italiano (da decidere: nomi esercizi dal CSV in italiano o tradotti); (2) \*\*UI
&#x20; statica\*\* via dizionario `STRINGS.it`/`.en`/`.de` + funzione `t()` + switcher; (3) \*\*pagine legali\*\*
&#x20; almeno IT + DE. Vedi "Internazionalizzazione i18n" in TASKS.

\- \*\*✅ Accesso email via OTP (fase 2 / 1B) — INVARIATO (17/06):\*\* il blocco email/password è solo
&#x20; nascosto (`login-emailpw`), da \*\*SOSTITUIRE\*\* con la UI OTP. \*\*Dipendenza hard:\*\* provider email
&#x20; transazionale (Resend raccomandato) da confermare col founder + config Supabase (SMTP + template col
&#x20; token + DNS). Lancio resta solo-Google. Vedi 1B in TASKS.

\## Problemi Aperti

\- \*\*⚠️ EMAIL/PASSWORD NON ATTIVO (intero path), non solo il reset\*\* — i doc davano email/password funzionante: NON lo è. Funziona SOLO Google OAuth (PKCE). Login/signup via email+password e il reset password sono entrambi rotti. \*\*Piano (16/06): SOSTITUZIONE con flusso OTP a codice\*\* (Supabase `signInWithOtp`/`verifyOtp`/`updateUser`) che unifica signup/login/reset e scavalca il magic-link/PKCE rotto → un solo lavoro, vedi TASKS 🟡 1B. \*\*Dipendenza HARD: SMTP custom / provider transazionale\*\* (il mailer Supabase di default è 2 mail/ora, inutilizzabile in produzione). Non bloccante per il trial funnel (lancio solo-Google)

\- \*\*Refactor monolite → FASE 1 FATTA (giugno 2026), refactor FERMATO QUI di proposito.\*\* Gate di sintassi + estrazione `styles.css`/`progress.js`/`admin-ui.js`/`log.js`: rischio pagina-bianca eliminato, blast radius ridotto, `index.html` −35% (\~1787 righe oggi, dopo l'estrazione della libreria esercizi in `admin-ui.js` e del modale log in `log.js` il 15/06; pre-refactor 2757). Il CORE SESSIONE AI resta in `index.html` DI PROPOSITO. Estrazioni residue OPZIONALI (vedi TASKS 🟢)

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


\- \*\*Open question strategiche (non task, vedi TASKS 💡):\*\* ~~rebranding del nome~~ \*\*✅ CHIUSA (16/06): AILISTENICS confermato come nome prodotto, COAICH scartato\*\* → il "Dominio email personalizzato" non è più gated dal rebranding; resta aperta solo la doppia source-of-truth dei doc (ponte git `/docs` + `@`-import in CLAUDE.md)

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

\- \*\*Progressione del programma\*\* (spina dorsale del percorso atleta) — modello a fasi: base SHIPPED (navigazione per fasi + vista dettaglio); restano da collegare sblocco skill, fine sessione chiara e avanzamento automatico di fase

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

\- \*\*Auth\*\* — SOLO Google OAuth (PKCE) attivo (⚠️ email/password NON attivo — intero path, non solo il reset; vedi Problemi Aperti)

\- \*\*Dashboard atleta\*\* — programmi assegnati, statistiche, log recenti, riquadro "Riprendi"

\- \*\*AI Coach session\*\* — chat real-time, 3 info box, salvataggio per-serie, lista tappabile (ordine libero), \*\*warm-up obbligatorio\*\*; chiusura con "Torna"

\- \*\*Sistema template programmi\*\* — libreria riassegnabile (tab Template): crea, modifica, elimina, \*\*Assegna\*\*, \*\*Prova\*\* (test session non persistita), \*\*Applica a tutti\*\*

\- \*\*Test sessione admin ("Prova")\*\* — avvia una sessione AI reale da un template senza switchare account, non persistita

\- \*\*Ordine libero\*\* — tap su un esercizio della lista; setNum deterministico lato frontend

\- \*\*Ripresa esplicita\*\* — riaggancia la sessione < 24h sulla stessa riga `sessions`

\- \*\*Picker workout\*\* — overlay pre-chat per i multi-workout

\- \*\*log\_data strutturato\*\* — per-set con reps/rir/rpe/weight/note + programId/chosenWorkout

\- \*\*Profilo atleta\*\* — DUE livelli (decisione 16/06): SLIM self-serve in-app (solo nickname) vs intake completo (dati fisici, obiettivi, attrezzatura, infortuni/salute con consenso) nel questionario di CONVERSIONE "Richiedi il coaching". Le colonne profilo complete restano nel DB (nullable)

\- \*\*Admin panel\*\* — gestione atleti, log, libreria esercizi, tab Template

\- \*\*Schermata Progressi\*\* — tab Esercizio + Overview

\- \*\*Libreria esercizi\*\* — 49+ esercizi

\- \*\*Onboarding form\*\* — email automatica via Apps Script (in overhaul, vedi TASKS)

\- \*\*(In arrivo)\*\* Profilo SLIM self-serve (nickname, Step 4 — unico residuo del pacchetto landing); Fase i18n IT/EN/DE (prioritaria post-lancio; l'hero elaborato si fa qui); Accesso email via OTP a codice (fase 2, sostituisce il blocco email/pw nascosto); Analytics funnel (da dati Supabase); Conversione manuale primi trialist + Stripe (gated); Mail resoconto AI settimanale; Logo/icona home screen (passo 1 PWA); Breathwork (frontend-only); Peso per-esercizio + Logging isometrici (descrittore per-esercizio); Timer-esercizio a tempo; Editor tabellare programmi (CSV↔tabella); Allenamento libero (log manuale, no AI); Periodizzazione attiva (GATED); Distribuzione app store (GATED)

