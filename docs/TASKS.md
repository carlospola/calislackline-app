\# Tasks — AILISTENICS

&#x20;

\_Aggiornato: 2026-06-25\_

&#x20;

\---

&#x20;

\## 🔴 High Priority

&#x20;

\- \[ ] \*\*Conversione MANUALE dei primi 1-3 trialist (validazione, decisione 16/06) — PRONTA, in attesa del via del founder (founder-timed).\*\* Percorso GIÀ esistente, pronto da eseguire ma NON da avviare ora: è il founder a decidere quando si parte. Convertire a mano i primi trialist reali col percorso GIÀ esistente — CTA "Richiedi il coaching" (sul `403 trial\_exhausted`) → mailto all'admin → l'admin porta `pending`→`active` + incasso manuale (es. bonifico/PayPal). NIENTE codice nuovo: gira sul funnel trial 1A già live. \*\*È il GATE di "Sistema pagamenti — Stripe"\*\* (Stripe NON si costruisce prima della prima conversione manuale). Gira in PARALLELO al pacchetto landing/profilo-slim/privacy.

\- \[x] \*\*RIR target per-programma — FATTO (BBR + i 3 gym).\*\* Spostato in ✅ Completati (giugno 2026). I valori vivono nei `coach\_rules` dei TEMPLATE (BBR fascia 0-3 + autoregolazione; 741/POOL DANGER/Bro split RIR \~3) + "Applica a tutti".

\- \[x] \*\*Motore-prompt — casi maxout/misto MIGRATI (11 giugno 2026).\*\* Spostato in ✅ Completati. Meccanismo: blocco PRECEDENZA nel motore + override di filosofia nei coach\_rules (New Workout = maxout, Muscle-Up Pro = misto). Tutti i 9 programmi ora sul motore. Il punto di OVERRIDE PER-PROGRAMMA resta la presa per la filosofia del \*\*descrittore per-esercizio\*\* e (futuro) per gli \*\*elastici\*\* (💡).

\- \[x] \*\*Refactor monolite — FASE 1 FATTA, refactor FERMATO QUI (decisione, giugno 2026).\*\* Vedi ✅ Completati. Gate di sintassi + `styles.css` + `progress.js` + `admin-ui.js` + `log.js`; `index.html` 2757 → \~1787 righe (−35%, dopo l'estrazione di libreria esercizi e modale log il 15/06); rischio pagina-bianca eliminato; blast radius per-file. \*\*Il CORE SESSIONE AI NON si estrae.\*\* Estrazioni residue → voce 🟢 sotto.

\- \[ ] \*\*Video tutorial esercizi\*\* — aggiungere colonna `video\_url` a `exercises` (proporre la migration, attendere conferma). Video su YouTube (NO self-hosting), aperti in overlay in-app, link dal nome esercizio nel `setInfoBox`. Gestire il matching del nome (nomi canonici dal CSV) — punto fragile. Partire dai \~10-15 movimenti del solo programma base, con video propri. Doppia funzione: tutorial in-app + contenuto social, ma due output distinti.

\- \[ ] \*\*Flusso acquisto programmi pre-fatti (Opzione 2)\*\* — vendere i programmi/template curati esistenti. Dipende da Stripe. Serve solo storefront + assegnazione al pagamento (con i template, l'assegnazione è già `assignTemplate`).

\- \[ ] \*\*Flusso coaching personalizzato a pagamento (Opzione 3)\*\* — acquisto/richiesta; il coach crea il programma su misura e monitora le progressioni (in gran parte già supportato dall'admin).

\- \[ ] \*\*Notifica reminder allenamento\*\* — email o push quando un atleta non si allena da X giorni. \*\*NOTA:\*\* le notifiche PUSH sono anche il "valore nativo" che sblocca la pubblicazione su App Store (Guideline 4.2 — vedi 🟢 Distribuzione app store). \*\*Infrastruttura (cron Vercel + email) CONDIVISA con "Mail resoconto AI settimanale" (🟡)\*\* — progettarle insieme: un solo cron che per ogni atleta decide reminder o resoconto.

\- \[ ] \*\*Onboarding AI\*\* — dopo il form, l'AI suggerisce automaticamente quale programma/template assegnare (solo l'admin approva). \*\*Si lega all'"Overhaul sistema Apps Script" (🟡):\*\* rivedere il questionario è l'occasione per progettare i due INSIEME.

\---

&#x20;

\## 🟡 Medium Priority

&#x20;

- [x] **Progressione programma — modello a FASI + vista dettaglio — FATTO (giugno 2026, SHIPPED).** Un programma periodizzato multi-fase vive in UN template/CSV; i workout sono prefissati "Fase N - <sessione>" (il prefisso rende i nomi unici, evita il collasso del parser, codifica la fase). Retrocompat: nomi senza prefisso -> nessuna fase -> rotazione piatta.
  - **phaseOf** (/Fase\s*(\d+)/i -> numero|null) e **stripPhase** ("Fase N - " tolto per il display).
  - **programDayStates(program, sessions):** per la fase corrente (= phaseOf dell'ultima sessione, altrimenti la fase piu' bassa) calcola i giorni e lo stato. "Completato nel ciclo corrente" deterministico via MIN-COUNT: count[giorno] = n. sessioni con quel chosenWorkout nella fase; min = minimo; done = count > min (smorzato); continua = primo giorno (ordine CSV) con count == min. Day-0/fine-ciclo (tutti zero o tutti pari) -> niente smorzati, continua = primo giorno.
  - **Vista dettaglio (programDetailScreen):** tap sul programma in showDash -> openProgram: <2 workout = beginSession diretto, altrimenti openProgramDetail (async, ri-query sessions). Giorno fatto smorzato + tag "fatto"; giorno continua con anello accent + "Continua"; tap -> beginSession col nome COMPLETO. Fasi superiori non raggiunte -> riga muta "Fase N bloccata".
  - **Rimosso:** vecchia funzione programProgress (rotazione "dopo l'ultimo", dead code) e pannello dashboard "Prossimo allenamento" (#programProgressPanel).
  - **Supera** la vecchia convenzione "S1 · Push / Sett. N": ora il prefisso di fase e' "Fase N - <sessione>".
  - **GAP NOTO:** avanzamento automatico di fase NON ancora implementato (le fasi superiori restano "bloccate" nella vista). Sfumatura: un meccanismo di gating di fase esisteva nel codice, ma ATTUALMENTE la lista programma e' piatta e self-serve (funziona bene cosi') -> da rivedere se/quando reintrodurre il gating di fase.
  - **FORK ANCORA APERTO (carichi, ortogonale alla navigazione):** carichi scritti dal coach nel CSV (default MVP) VS app che suggerisce i carichi (= periodizzazione attiva). In attesa decisione Carlo.

\- \[x] \*\*Landing + hero — STATO 17/06: footer/consenso FATTO, hero elaborato RIMANDATO alla fase i18n.\*\* Footer consenso + link Termini/Privacy nel login FATTI (commit `304c891`); blocco email/password + "Crea account con email" + "Password dimenticata?" NASCOSTI (`display:none`, wrapper `login-emailpw` dentro `#loginScreen`) → login solo-Google (commit `a36d365`). \*\*L'hero ELABORATO è RIMANDATO alla fase i18n:\*\* la sostituzione tagline→headline/sub/offer IT (Step 3a) è stata SCARTATA e revertata (mai committata); la tagline EN "AI Coaching · Personalized · Adaptive" RESTA (scelta founder); l'hero si farà UNA volta sola, multilingua, dentro la fase i18n. \_(Resta sotto come riferimento la copy IT proposta il 16/06.)\_ Riscrittura dell'hero in italiano, lingua coerente. \*\*Headline:\*\* "Il coach AI che adatta ogni serie alla tua fatica". \*\*Sub:\*\* "Calisthenics e palestra. Dichiari quanto è dura una serie e l'AI ricalibra carico, ripetizioni e recupero in tempo reale, durante l'allenamento non dopo." \*\*Riga offerta:\*\* "Prova gratis: 3 allenamenti reali con il coach AI." \*\*Azioni:\*\* "Accedi con Google" (primaria) + "Crea account con email" (primaria, flusso OTP) + "Richiedi il coaching" (link SECONDARIO). \*\*Il blocco email/password rotto va SOSTITUITO dal flusso OTP\*\* (vedi 1B), non solo nascosto. \*\*Footer\*\* con link Privacy + Termini + nota consenso al login. \*\*Claim ancorati a ciò che il coach FA davvero\*\* (autoregolazione REATTIVA per centrare il target) — NIENTE promesse su forma o progressione automatica nel durante-sessione. \*\*Sequenza:\*\* il pacchetto landing+hero+profilo-slim+privacy è a rischio basso, NESSUNA dipendenza email → si fa PRIMA dell'OTP (nel frattempo "Crea account con email" resta nascosto/disabilitato, solo-Google). Frontend-only (`index.html` markup + copy).

\- \[x] \*\*Layer privacy minimo (Informativa + Termini) — ✅ FATTO (17/06).\*\* \*\*Step 1:\*\* pagine statiche `privacy.html` + `termini.html` create (commit `41e1b6d`) — \*\*⚠️ placeholder `[DATA]` e `[EMAIL-CONTATTO]` ancora da compilare prima del lancio\*\*. \*\*Step 2:\*\* link \*\*Termini\*\* + \*\*Informativa privacy\*\* nel footer consenso del login (commit `304c891`). Resta da predisporre il canale per richiedere la cancellazione. \_(Contesto originale 16/06:)\_ Pagine statiche \*\*Informativa privacy\*\* + \*\*Termini\*\*, link nel footer, canale per richiedere la cancellazione. Col \*\*profilo SLIM\*\* (solo nickname) NIENTE dati Art. 9 (salute) nel funnel self-serve → niente consenso salute nel funnel, \*\*probabilmente niente cookie banner\*\* (solo cookie di sessione); il consenso salute è confinato al questionario di CONVERSIONE. \*\*Disclosure responsabili:\*\* Google, Supabase, Vercel, Anthropic (incl. trasferimento extra-UE USA + SCC/DPF; nota: l'API Anthropic ELABORA ma non ADDESTRA sui dati — da confermare nel DPA). \*\*Età minima 16. Disclaimer medico nei Termini.\*\* Testo da redigere/verificare (Iubenda o legale) — ⚠️ NON è consulenza legale. Parte del pacchetto landing/profilo-slim (rischio basso). File: `index.html` (footer + pagine statiche).

\- \[x] \*\*Profilo SLIM self-serve (solo nickname) — ✅ CHIUSA (verifica diretta sul codice 24/06: GIÀ IMPLEMENTATA).\*\* La verifica sul codice ha trovato che il form self-serve in `profileScreen` raccoglie GIÀ SOLO il nickname (input `p_name`; `saveProfile` valida solo il nickname). \*\*⚠️ AGGIORNAMENTO (luglio 2026): `onboardScreen` NON è più il questionario di conversione con intake completo\*\* — è ora un form \*\*lead-only\*\* "Richiedi il coaching" (Nome/Email/Telefono/Messaggio + consenso) che manda un lead al Google Sheet via APPS_URL (logica in `onboard.js`) e NON popola `profiles`. `athleteContext` resta snello/vuoto nel self-serve. \*\*DB: nessuna migration\*\* (colonne profilo restano NULLABLE). \_(Contesto originale 16/06:)\_ Il profilo in-app self-serve raccoglie SOLO il \*\*nickname\*\*. \*\*⚠️ REVISIONE CONSAPEVOLE\*\* della vecchia regola "athleteContext incl. infortuni — non eliminare (sicurezza)": gli infortuni/salute NON si raccolgono nel self-serve; rete di sicurezza = contenuto di prova generico e a basso rischio (bodyweight) + l'atleta segnala il dolore in chat + disclaimer medico nei Termini. \*\*Infortuni/salute SOLO nel questionario di CONVERSIONE\*\* "Richiedi il coaching" (con consenso esplicito). \*\*Conseguenza:\*\* il pacchetto landing/privacy ha come UNICO residuo pre-lancio la compilazione dei placeholder `[DATA]`/`[EMAIL-CONTATTO]` in `privacy.html`/`termini.html`.

\- \[ ] \*\*Accesso email via OTP A CODICE (1B) — riformulato 16/06 (sostituisce email/password + reset rotti).\*\* Per chi non ha/non vuole Google: anziché riparare il magic-link/PKCE rotto, si passa a un \*\*OTP a 6 cifre Supabase\*\*. \*\*Flusso:\*\* form signup `nickname + email` → `signInWithOtp` (template email col \*\*token\*\*, SENZA `emailRedirectTo`) → `verifyOtp({ type:'email' })` → `updateUser({ password })`. \*\*Unifica signup, login e reset in UN solo meccanismo a codice\*\* e \*\*SCAVALCA\*\* il path magic-link/PKCE rotto (codice digitato IN-APP, nessun callback → non si tocca la macchina di `/reset` né `detectSessionInUrl`). Le password restano (login durevole); reset = di nuovo OTP. \*\*⚠️ DIPENDENZA HARD: SMTP custom / provider transazionale\*\* (il mailer Supabase di default è \~2 mail/ora best-effort, inutilizzabile in produzione) → \*\*Resend\*\* raccomandato (SMTP custom, tier gratuito, SPF/DKIM sul dominio), CONDIVISO con mail resoconto + dominio custom. \*\*Config NON-repo:\*\* template email Supabase col token + SMTP custom. \*\*Sequenza:\*\* il bottone "Crea account con email" resta NASCOSTO/disabilitato finché l'OTP non è pronto (solo-Google nel frattempo) → non reintrodurre una porta morta. Non bloccante per il trial (lancio solo-Google). Tocca `index.html` (auth) + config Supabase.

\- \[ ] \*\*Internazionalizzazione i18n (IT/EN/DE) — NUOVA (decisione 17/06).\*\* \*\*STRADA A:\*\* lancio MVP \*\*in italiano ORA\*\*, internazionalizzazione come \*\*fase dedicata e prioritaria SUBITO DOPO\*\* il lancio. \*\*Tre pezzi:\*\* (1) \*\*Coaching\*\* — i prompt/`coach_rules` in admin restano SOLO in italiano; si \*\*salva la lingua\*\* scelta dall'utente e `api/chat.js` aggiunge al system una direttiva "rispondi all'atleta in {lingua}" → l'AI risponde IT/EN/DE leggendo il contesto italiano. \*\*FORK da decidere:\*\* i nomi esercizi dal CSV restano in italiano o si traducono. ⚠️ tocca `api/chat.js` → diff + conferma. (2) \*\*UI statica\*\* via dizionario `STRINGS.it`/`.en`/`.de` + funzione `t()` + switcher lingua (frontend). (3) \*\*Pagine legali\*\* almeno IT + DE. \*\*L'hero elaborato (rimandato dal pacchetto landing) si fa QUI, una volta sola, multilingua.\*\*

\- \[ ] \*\*Overhaul sistema Apps Script (form lead + mail richiesta coaching).\*\* \*\*⚠️ NOTA (luglio 2026):\*\* il form onboarding è ora \*\*lead-only\*\* (Nome/Email/Telefono/Messaggio + consenso, logica in `onboard.js`) → la parte di intake pesante (eta/peso/altezza/infortuni/discipline/skill/obiettivi) è stata RIMOSSA; oggi Apps Script riceve solo un lead. Il resto dell'overhaul resta aperto: il sistema attuale (Apps Script → mail, con passaggio via GEMINI API per il messaggio) va rivisto PESANTEMENTE: doppia mail al momento della richiesta coaching (una a Carlo, una al richiedente), CONTENUTO delle mail da riscrivere, architettura da ripensare. \*\*Dipendenze incrociate:\*\* (a) si intreccia con 1A/1B — se il flusso accesso passa dalle mail Supabase (conferma/invito), parte di Apps Script SPARISCE invece di essere rifatta: NON ricostruire pezzi destinati a morire; (b) candidato sostituzione Gemini → Anthropic via infrastruttura esistente (un solo vendor, una sola chiave; l'eventuale messaggio AI nelle mail passa da lì); (c) si lega a "Onboarding AI" (🔴): rivedere il questionario è l'occasione per progettarli INSIEME.

\- \[ ] \*\*Mail resoconto AI settimanale (recap automatico avanzamento atleta).\*\* Mail periodica generata in automatico: l'AI legge i log dell'atleta e produce un resoconto in linguaggio coach + avanzamento. Funzione: retention + percezione di "coach che ti segue" anche tra le sessioni. Contenuti extra: DA DEFINIRE più avanti.

&#x20; - \*\*Sinergia 1 — STESSA LEVA DATI della "Analisi AI progressioni" (🟢 GATED):\*\* consuma ESATTAMENTE lo stesso aggregato compatto pre-aggregato (1 riga/esercizio: miglior set, RIR medio/trend, volume vs settimana prima). L'aggregatore JS deterministico si costruisce UNA volta e serve DUE feature. La mail è il \*\*banco di prova a basso rischio della periodizzazione\*\*: qui l'AI COMUNICA soltanto, non propone carichi → niente coach-in-the-loop obbligatorio, niente apply, niente editor tabellare come prerequisito.

&#x20; - \*\*Sinergia 2 — STESSA INFRASTRUTTURA del "Notifica reminder allenamento" (🔴):\*\* entrambe servono uno scheduler (VERCEL CRON su nuovo endpoint api/, gratuito, già compatibile con lo stack) + canale email. UN solo cron che per ogni atleta decide: allenato → candidato resoconto; fermo da X giorni → candidato reminder. Due mail, una infrastruttura.

&#x20; - \*\*Sinergia 3:\*\* si aggancia all'overhaul mail (🟡) e al dominio custom (🟢): costruirla sul provider transazionale futuro, NON su Apps Script che sta per essere smontato.

&#x20; - \*\*Grafici nelle email (punto spinoso — Chart.js non gira nelle mail):\*\* MVP RACCOMANDATO = NIENTE immagini — resoconto testuale AI (3-4 frasi) + numeri chiave + LINK "Vedi i grafici" → schermata Progressi nell'app (il click riporta l'atleta in app = metà dello scopo). AVANZATO: grafici PNG via QuickChart (renderizza CONFIG Chart.js come immagine via URL — i config esistono già in `progress.js`). Zero rendering server proprio.

&#x20; - \*\*Costo:\*\* trascurabile (on-demand settimanale, input compatto, \~1-2 cent/atleta/settimana).

\- \[ ] \*\*Logo/icona web app (PASSO 1 della PWA, indipendente dal service worker).\*\* Quando l'atleta aggiunge l'app alla home screen, l'icona deve essere il logo, non lo screenshot generico del browser. \*\*Punto chiave: NON serve la PWA completa\*\* (service worker/installabilità/Lighthouse — quella resta prerequisito store, PASSO 2). Bastano: `manifest.json` minimo (nome, icone 192/512px, theme scuro, `display:standalone`) per Android/Chrome + `<link rel="apple-touch-icon">` per iOS/Safari + FAVICON (chiude anche il 404 noto in console, task 🟢 esistente). Tre file statici + due righe nel `<head>` di `index.html`. Zero JS, zero rischio sintassi. \*\*Prerequisito:\*\* asset logo quadrato sorgente (\~1024px) da cui derivare i formati. \*\*Nota rebranding: NON bloccante\*\* — se il nome cambia si rifanno 3 icone, costo irrisorio; meglio l'icona attuale ora che lo screenshot del browser per mesi.

\- \[ ] \*\*Sessione di respirazione (Breathwork) — protocollo a cicli (MVP).\*\* Tool guidato di respirazione \*\*frontend-only\*\*, stile Wim Hof (nome di prodotto: "Respirazione a cicli" / "Breathwork", NON "Wim Hof Method" — è un marchio). NIENTE backend/DB/API/motore/coach\_rules/token: pura UI client.

&#x20; - \*\*Protocollo (un round):\*\* (1) respirazione: la bolla pulsa per N respiri (default 30, range 30-40), continua, senza pause; (2) ritenzione a polmoni VUOTI: bolla grande/ferma, timer conta IN SU; (3) tap sullo schermo → fine ritenzione; (4) recovery breath: inspiri pieno e trattieni \~15s (bolla piena); (5) round successivo; totale 3-5 round (default 3); (6) fine: riepilogo dei tempi di ritenzione per round (in memoria, effimero).

&#x20; - \*\*Setup (prima):\*\* n° round (3-5), respiri per round (30-40), velocità (lento/medio/veloce).

&#x20; - \*\*Bolla (visual):\*\* cerchio con glow morbido su sfondo scuro, accent lime `#c8f060`; il glow si intensifica in inspirazione. `transform: scale()` + `transition ease-in-out` di durata = durata della fase → movimento continuo. Parola al centro: "Inspira" / "Espira" / "Trattieni"; in ritenzione la parola lascia il posto al timer. Chrome minimale: bolla + parola + "Round x/y". Setup PRIMA, riepilogo DOPO.

&#x20; - \*\*Timer:\*\* conta dal timestamp con `Date.now()` (diff), NON con `setInterval` a decremento → preciso anche in background (stessa lezione del bug "timer recupero").

&#x20; - \*\*Integrazione:\*\* nuovo screen full-screen sullo stile di `#sessionScreen`, mostrato via `showScreen(id)`; ingresso da una card in dashboard.

&#x20; - \*\*Sicurezza (obbligatoria):\*\* disclaimer al PRIMO uso — iperventilazione + apnea → mai in acqua o alla guida, sempre seduti o sdraiati.

&#x20; - \*\*Nota architetturale:\*\* struttura il protocollo come \*\*oggetto-dati ("descrittore"):\*\* fasi, durate, hold, cue, suono → in futuro altre tecniche (pranayama) SENZA riscrivere il player. Ma ORA solo il protocollo a cicli. Salvataggio tempi su DB = v2 (🟢).

&#x20; - \*\*Vincoli tecnici:\*\* vanilla JS, `var`, NO backtick template literals, NO localStorage; non cambiare ID esistenti; dark theme + variabili CSS; onclick in stringhe HTML con escape `\\'`; input utente via `esc()`. NON toccare `/api/chat.js`, `/api/admin.js`, schema DB. Mostra piano/diff prima del codice; non generare HTML senza conferma.

\- \[x] \*\*Peso per-esercizio in sessioni miste (bodyweight + gym) — ✅ SHIPPED (via colonna CSV `peso`, NON regex Note).\*\* Il campo peso (`#weightRow`) e il target box sono ora PER-ESERCIZIO, pilotati da `currentWeighted`, NON più da `session\_type`. Meccanismo:

&#x20; - \*\*`weighted` = cella CSV `peso` non vuota\*\* (`exIsWeighted(peso)`); il valore di `peso` è anche il TARGET mostrato nel box. \*\*SUPERATO l'approccio Note\*\* (regex `/N kg/` + fallback `session\_type==='gym'` + gym→Note-come-peso): la Note NON pilota più il box peso. Quirk New Workout (Note=varianti) RISOLTO.

&#x20; - \*\*`parseWorkoutCsv` riconosce l'header `peso` (alias `carico`)\*\* → `field.peso` (retrocompat: CSV senza colonna → vuoto → corpo libero).

&#x20; - \*\*Nuova var globale `currentWeighted`:\*\* impostata in `updateSetInfo` (da `csvPeso`; superset = esercizio PRIMARIO) e `selectExercise` (da `field.peso`); pilota show/hide `#weightRow` + tipo box; letta da `sendMsg` per il GATING del peso loggato. `beginSession`/`resumeSession` resettano `#weightRow` a `none` all'avvio.

&#x20; - \*\*`session\_type` RISTRETTO al motore\*\* (delta `coach\_prompt`) + DB; non pilota più la UI peso. (cleanup codice/DB futuro: vedi task "Prompt unico per-esercizio" in 💡.)

&#x20; - \*\*Resta aperto:\*\* il lato \*\*isometrici (metric=time)\*\* del descrittore per-esercizio (vedi "Logging esercizi isometrici"). Futuro: anche gli \*\*elastici\*\* (💡) si appoggiano qui (`load:'kg'|'band'|none`).

\- \[x] \*\*Migrazione colonna `peso` su TUTTI i programmi con carico — ✅ COMPLETATO (giugno 2026, via tab Template admin + "Applica a tutti", nessun deploy).\*\* Ogni programma con carico ha la colonna `peso` popolata, così `weighted`/`currentWeighted` si leggono dal CSV (vedi "Peso per-esercizio"). \*\*Convenzione colonna:\*\* header `Peso` come ULTIMA colonna; gym = carico verbatim (es. `40 kg`); corpo-libero-zavorrato = zavorra; \*\*vuoto\*\* su warm-up/cardio/accessori a corpo libero. La colonna Note dei gym tiene ANCORA il peso (era la fallback per la finestra pre-push; ora il frontend per-esercizio è pushato, ma la Note non è stata ripulita). \*\*Migrati:\*\* 741 Fitness, Pool Danger Hypertrophy (il piccolo no-name Leg press/Side kick), Bro split; Muscle-Up Pro era già migrato. \*\*Fuori per DECISIONE (non pending):\*\* Body By Rings + "Prova — Full Body" (bodyweight puro, nessuna colonna serve); New Workout (quirk Note=varianti maxout, niente colonna peso) e Upper/Lower Rotation lasciati fuori volutamente.

\- \[x] \*\*\[FIX COACHING] 3A — Classificazione meccanica del range — ✅ COMPLETATO (in `coach\_prompt\_global`, Table Editor, no deploy).\*\* Il blocco VALUTAZIONE DEL RANGE è stato riscritto come classificazione MECCANICA min/max, con tetto E pavimento inchiodati ed esempi su range piccoli (3 su 3-5 = a target, 5 su 3-5 = a target, 6 su 3-5 = sopra, 2 su 3-5 = sotto), guardia bidirezionale (il tetto NON è uno sforamento, il pavimento NON è un "sotto"), anti-fotocopia mantenuto. \*\*Verificato:\*\* niente più "sforato" sul tetto, niente più "completa il range" sul pavimento. Vedi AI\_RULES / ARCHITECTURE (descrizione blocco aggiornata).

\- \[ ] \*\*Editor tabellare programmi (admin, CSV↔tabella) — DA ALZARE (è prerequisito di "Analisi AI progressioni").\*\* Oltre a incollare `workout\_csv` nel textarea (flusso che RESTA), poterlo modificare in vista TABELLARE tipo Excel — click sulla cella, cambi solo quella; al Salva il `workout\_csv` viene riscritto. Due viste dello stesso dato.

&#x20; - \*\*Perché:\*\* oggi per cambiare una cosa (recupero, range, peso) tocca ri-promptare Claude o editare il CSV grezzo a mano (fragile: una virgola rompe il parsing). Tabella = modifiche chirurgiche senza rischio strutturale; UX naturale col SaaS.

&#x20; - \*\*Approccio (riuso):\*\* `parseWorkoutCsv` per il parse; `adminFetch`/`editProgram` per il salvataggio. parse CSV → tabella editabile (1 riga/esercizio, raggruppate per workout, 1 cella = 1 input) → al salva ricostruisci il CSV → `editProgram`.

&#x20; - \*\*MVP:\*\* toggle "CSV grezzo ↔ Tabella" (tenere il textarea per incollare da Claude); editing delle sole celle; serializzatore che rispetta le regole CSV.

&#x20; - \*\*Dopo (non MVP):\*\* aggiungi/elimina/riordina righe; dropdown nome esercizio dalla LIBRERIA → risolve il naming-match fragile (CSV = `\[SET:]` = nome libreria = chiave video).

&#x20; - \*\*RISCHIO CHIAVE:\*\* round-trip LOSSLESS. parse → tabella → CSV deve ridare lo STESSO identico CSV (virgole nelle Note, celle vuote, righe warm-up, multi-workout). Test: ri-serializzare un CSV non modificato restituisce lo stesso CSV.

&#x20; - \*\*File:\*\* `index.html`. Frontend-only. \*\*PREREQUISITO del ramo "AI applica le progressioni"\*\* — il suo motore parse↔serialize è il livello di apply SICURO della periodizzazione AI.

\- \[ ] \*\*Sessione "Allenamento libero" (log manuale, no programma, no AI).\*\* L'atleta logga una sessione NON legata a programma/template: scrive il nome esercizio e logga sets/reps/RIR/peso/RPE, anche solo 2-3 esercizi. Niente AI: puro logging.

&#x20; - \*\*DISTINZIONE CRITICA:\*\* è DIVERSA dall'Opzione 4 "Workout improvvisato" (🟢), che fa GENERARE il workout all'AI. Qui NIENTE generazione, NIENTE AI. TENERLE SEPARATE.

&#x20; - \*\*Approccio (riuso):\*\* il motore di logging è già agnostico (`persistSets`→`log\_data`, `nextSetNum`, riga input). Come `selectExercise` ma col nome da CAMPO TESTO invece che dal CSV. INSERT in `sessions` via client + RLS owner.

&#x20; - \*\*MVP:\*\* (a) ingresso "Allenamento libero" in dashboard → sessione SENZA programma (box vuoti, niente picker/lista CSV); (b) campo "aggiungi esercizio" → logica tipo `selectExercise` → input sbloccato → log → `persistSets`; (c) session screen in modalità manuale (nessun `\[SET:]` dall'AI).

&#x20; - \*\*Accortezza:\*\* nome via AUTOCOMPLETE dalla LIBRERIA (fallback testo libero) → i grafici Progressi restano coerenti.

&#x20; - \*\*Nota:\*\* senza `programId` NON è "riprendibile" → NON mostrare il riquadro Riprendi per queste sessioni.

&#x20; - \*\*File:\*\* `index.html`. Frontend-only.

\- \[x] \*\*\[BUG] Admin → cancellazione sessione rimanda alla dashboard atleta — RISOLTO (11 giugno 2026).\*\* Vedi ✅ Completati (commit `7f8315d`).

\- \[ ] \*\*Conteggio set per esercizio nella lista (X/Y) + esercizi completati non-tappabili\*\* — nell'overlay lista "X/Y set fatti" per esercizio; esercizio con tutti i set loggati → marcato completato e NON più tappabile. Fonte: set loggati per esercizio da `sessionLog.exercises` vs totale CSV (`parseWorkoutCsv(...).fieldsByWorkout`). In `showWorkoutList`. È la base per "Fine sessione chiara". \*\*Alimenta "Progressione programma".\*\*

\- \[ ] \*\*Fine sessione chiara\*\* — indicatore "sessione completata" quando tutti gli esercizi sono fatti. ⚠️ NON reintrodurre il bottone "fine" né il log generato dall'AI; si appoggia al rilevamento del punto sopra. \*\*Alimenta "Progressione programma"\*\* (e la variante "sessione consumata = completata" del trial funnel 1A).

\- \[ ] \*\*Sistema sblocco skill "ad albero"\*\* — sblocco PER MERITO / milestone, NON per tempo o pagamento. Albero RAMIFICATO. Assessment "test-out". Libertà tra programmi GIÀ sbloccati. Vale come RETENTION → Fase 2, dopo i primi paganti. \*\*È un RAMO di "Progressione programma".\*\*

\- \[ ] \*\*Struttura tier abbonamento (Basic AI / Pro / Coached)\*\* — definire cosa sblocca ciascun tier (vedi PROJECT\_OVERVIEW).

\- \[ ] \*\*Sistema pagamenti — Stripe\*\* — abbonamento mensile. \*\*Prerequisito di Opzioni 2 e 3.\*\* \*\*GATED dietro la prima conversione MANUALE\*\* (vedi "Conversione manuale primi trialist" in alto): prima si valida un pagante a mano, poi si automatizza. \*\*Si può costruire/testare subito in Test Mode\*\* (legale, nessun requisito). ⚠️ \*\*Nota fiscale (NON consulenza — confermare col commercialista):\*\* incassare un abbonamento RICORRENTE richiede \*\*partita IVA\*\* (attività abituale; la prestazione occasionale <5.000€ NON copre un SaaS ricorrente). Regime forfettario soglia 85.000€, flat tax 15% (5% primi 5 anni); \*\*caveat:\*\* il reddito da lavoro dipendente dell'anno prima (soglia \~30.000€) può escludere il forfettario → verificare. Obbligo fattura elettronica; autofattura reverse charge \*\*TD17\*\* sulle commissioni Stripe (Stripe Ireland). ⚠️ Su iOS le sub vendute in-app passano per l'IAP Apple (15-30%) — vedi Distribuzione app store.

\- \[ ] \*\*`/api/chat.js` rate-limit (Fase 2)\*\* — resta il rate-limit per-utente attivo.

\- \[ ] \*\*Note post-sessione atleta\*\* — campo libero dopo la sessione.

\- \[ ] \*\*Export log PDF\*\* — bottone "Scarica PDF".

\- \[ ] \*\*Admin dashboard metrics + Analytics funnel (esteso 16/06)\*\* — sessioni/settimana, atleti attivi, workout più popolari. \*\*DUE livelli (decisione 16/06):\*\* \*\*L1 (subito, costo privacy ZERO):\*\* metriche FUNNEL dai dati Supabase già presenti — signup Google vs email, sessioni di prova, `trial_exhausted`, click "Richiedi il coaching", conversioni. \*\*L2 (dopo):\*\* analytics di pagina \*\*COOKIELESS\*\* per comportamento/drop-off — \*\*Umami\*\* (self-host su Vercel + Postgres Supabase) o \*\*Plausible\*\* hosted; \*\*EVITARE Google Analytics\*\* (cookie + banner) per preservare il no-banner.

\- \[x] \*\*e1RM stimato — ✅ SHIPPED (Batch 1 Progressi, commit `91ff228`).\*\* Formula Epley nel ramo ESERCIZIO CON PESO: `e1RM = peso * (1 + reps/30)`; per ogni sessione si prende il MAX e1RM dei suoi set; riusa il canvas `chartReps`; titolo "1RM stimato (kg)". SOSTITUISCE nel GRAFICO il precedente "Peso massimo (kg)" (il peso max resta nella stat-card `pStatPR`). Vedi ✅ Completati Batch 1.

\- \[x] \*\*\[KNOWN GAP] "Assegna" non idempotente — ✅ RISOLTO (giugno 2026, commit `1410bd5`).\*\* Il doppio tap creava DUE righe `programs` duplicate. Fix: `confirmAssign` (`admin-ui.js`) ha ora una guardia di re-entrancy — var `assignInFlight` a livello di file + `try/finally` che la resetta + bottone di conferma disabilitato durante la chiamata. Scartato il constraint DB `(user\_id, template\_id)` (il debounce frontend basta). Gap chiuso.

\- \[x] \*\*Progressi — "Volume massimo singolo set" → "Miglior set" — ✅ SHIPPED (Batch 1 Progressi, commit `91ff228`).\*\* La stat-card ex "VOLUME" (`pLblTot`/`pStatTotalReps`) mostra ora il volume massimo del singolo set = `max(reps*peso)`, label "MIGLIOR SET", suffisso `kg`, fallback trattino. Vedi ✅ Completati Batch 1.

\- \[x] \*\*Progressi — grafico a barre "Volume per sessione" — ✅ SHIPPED (Batch 1 Progressi, commit `91ff228`).\*\* Nel ramo con peso = somma `(peso*reps)` per sessione; riusa il canvas `chartTotalReps`; titolo per-ramo (weighted = "Volume per sessione (kg)", isometrici = "Secondi totali sessione", corpo libero = "Reps totali sessione"). Vedi ✅ Completati Batch 1.

\- \[x] \*\*Progressi (Overview) — rinominare "RPE medio" → "Fatica percepita media" — ✅ SHIPPED (Batch 1 Progressi, commit `91ff228`).\*\* Rinominati in `index.html` i titoli grafici `chartRPE`/`chartOvRPE` e la stat `ovStatRPE` ("RPE medio"/"RPE MEDIO"/"RPE medio per sessione" → "Fatica percepita media", anche in MAIUSC) per coerenza col label in sessione. Vedi ✅ Completati Batch 1.

\- \[x] \*\*Progressi — "Dettaglio set per-esercizio" — ✅ SHIPPED (Progressi v2, commit `4ed20c8`).\*\* Multi-metrica (peso: Tonnellaggio/Massimale stimato/Reps/RIR/RPE; corpo libero: Reps/RIR/RPE; isometrici: Secondi/RIR/RPE) con controlli on/off + stile barre/punti/linea; assi `y`/`yE`/`yEffort`; cap ultimi 60 set; stato non persistente. Vedi Completati Progressi v2.

\- \[x] \*\*Togliere la validazione "coach\_rules non vuoto" — ✅ FATTO (giugno 2026, commit `1410bd5`).\*\* Rimossa la validazione che bloccava il salvataggio con `coach\_rules` vuoto in `saveEditProgram`, `addProgram` e `saveTemplate` (`admin-ui.js`): ora richiedono solo il nome; `coach\_rules` resta nel form ma è opzionale (il comportamento comune vive nel motore). (Il guard di `startTestSession` controllava già `workout\_csv`, non i coach\_rules.)

\---

&#x20;

\## 🟢 Low Priority / più avanti

&#x20;

\- \[ ] \*\*Rinomina repo GitHub → AILISTENICS — PARCHEGGIATA (ora SBLOCCATA, branding deciso 16/06).\*\* Allineamento del NOME del repo al brand confermato (oggi `carlospola/calislackline-app`). Checklist: (1) rinomina il repo su GitHub (i redirect del vecchio path reggono); (2) aggiorna il link repo su Vercel; (3) aggiorna il remote git locale (`git remote set-url`); (4) allinea lo slug nei doc. \*\*Nota:\*\* il dominio `ailistenics.com` è INVARIATO — è solo allineamento del nome repo, NON un cambio prodotto/feature.

\- \[ ] \*\*Refactor — estrazioni residue (OPZIONALI, solo se la dimensione torna a pesare).\*\* Col metodo rodato della fase 1 (recon dipendenze read-only → diff → gate → push → test funzionale in produzione). \*\*Libreria esercizi (→`admin-ui.js`), modale log (→`log.js`): FATTE il 15/06; logica onboarding lead-only (submitLead/closeLead →`onboard.js`): FATTA (luglio 2026)\*\* (vedi ✅ Completati). \*\*NON estrarre il core sessione AI\*\* (decisione di fase 1). Nuovi file = script classici non-module caricati dopo l'inline.

\- \[ ] \*\*Dominio email personalizzato — GATED dietro il rebranding (💡, OPEN QUESTION non decisa).\*\* Mail transazionali da dominio proprio (es. coach@<brand>.com) invece di Gmail/Apps Script. \*\*NON avviare prima della decisione rebranding\*\* (ne eredita il gate). Note tecniche: richiede provider transazionale (Resend/Postmark/SES) + SPF/DKIM sul dominio; Supabase supporta SMTP custom per le mail auth → quando esisterà, anche le mail di invito/conferma/reset (1B) escono dal dominio brandizzato. \*\*Il provider transazionale è dipendenza CONDIVISA con "Mail resoconto AI settimanale" (🟡).\*\*

\- \[ ] \*\*Distribuzione app store (Google Play + App Store) — GATED (dopo i primi paganti).\*\* Impacchettare l'app web esistente in un guscio nativo, senza riscriverla.

&#x20; - \*\*Google Play (facile):\*\* TWA via PWABuilder/Bubblewrap; requisiti = manifest + service worker + HTTPS (già ok) + Lighthouse ≥80 + Digital Asset Links; \~25$ una tantum; fattibile da Windows. \*\*PREREQUISITO = "PWA / installazione mobile" (PASSO 2).\*\*

&#x20; - \*\*App Store (tosto):\*\* DUE muri — (1) serve un Mac (Xcode) o cloud-build (Codemagic/EAS/runner macOS); (2) Guideline 4.2: un "wrapper nudo" del sito viene quasi sempre RIFIUTATO → serve valore nativo (notifiche push, navigazione nativa, offline). \~99$/anno; review 24-48h ma i cicli di rifiuto costano giorni.

&#x20; - \*\*Buona notizia:\*\* il valore nativo è già in roadmap — le NOTIFICHE PUSH del reminder allenamento sono il biglietto d'ingresso per il 4.2.

&#x20; - \*\*⚠️ Apple IAP (3.1.1):\*\* le sub digitali vendute DENTRO l'app iOS passano per l'in-app purchase Apple → 15-30% (15% se <1M$/anno). Stripe gira libero su web/Android; iOS è vincolato → impatta il flusso pagamenti Stripe.

&#x20; - \*\*Sequenza:\*\* Logo/icona (PASSO 1, 🟡) → PWA (PASSO 2) → Google Play (test) → App Store (con push del reminder + decisione IAP). \*\*File:\*\* `index.html` (PWA) + tooling esterno. \*\*GATED\*\* dietro mono-coach validato con paganti.

\- \[ ] \*\*Analisi AI progressioni + deload (Periodizzazione attiva — Avanzato) — GATED.\*\* L'AI legge i risultati loggati (reps/peso/RIR/RPE) e SUGGERISCE progressione carichi e deload.

&#x20; - \*\*COSTO NON è il problema:\*\* gira ON-DEMAND / fine settimana / fine mesociclo (NON per-serie, NON real-time) → centesimi (\~1-6 cent a chiamata; \~0,5-2,4 €/mese su 10 atleti).

&#x20; - \*\*DESIGN:\*\* core DETERMINISTICO in JS a ZERO token (double progression: serie al top del range con RIR ≥ target → +carico; deload se RIR crolla/reps calano a parità di carico; deload programmato ogni N settimane) + strato AI SOTTILE solo per GIUDIZIO/COMUNICAZIONE.

&#x20; - \*\*LEVA DATI:\*\* mandare dati COMPATTI pre-aggregati (1 riga/esercizio: miglior set, RIR medio/trend, volume vs settimana prima), NON `log\_data` grezzo → input −5/10×. Cache del prompt-template (stile Leva 2). \*\*L'AGGREGATORE è CONDIVISO con la "Mail resoconto AI settimanale" (🟡): si costruisce UNA volta; la mail è il suo banco di prova a basso rischio.\*\*

&#x20; - \*\*APPLY (semi-automatico DI PROPOSITO):\*\* l'AI PROPONE cambi ASTRATTI ("+2,5kg" / "tieni" / "deload −10%" + motivo), NON CSV grezzo → un MAPPER DETERMINISTICO li converte in numeri formattati → la TABELLA (editor tabellare) li mostra come DIFF → coach approva → il SERIALIZER riscrive `workout\_csv` → `editProgram`. Il CSV cambia SOLO all'APPROVAZIONE.

&#x20; - \*\*DIPENDENZA:\*\* richiede il motore di round-trip dell'EDITOR TABELLARE come superficie di apply sicura.

&#x20; - \*\*TARGET DI APPLY = PER-ATLETA:\*\* applica sulla COPIA del singolo atleta (`editProgram` sulla sua riga `programs`), NON sul template (sennò `repushTemplate` lo spingerebbe a tutti). \*\*FORK APERTO (NON risolvere):\*\* dopo una progressione AI quel programma DIVERGE dal template → un futuro "Applica a tutti" sovrascriverebbe i carichi personalizzati. Regola futura da decidere: il template tiene la STRUTTURA, i carichi personalizzati vivono sulla COPIA.

&#x20; - \*\*⚠️ SICUREZZA:\*\* MAI applicare salti di carico in automatico (rischio infortunio) → coach-in-the-loop OBBLIGATORIO. Più automazione DOPO (opzionale): toggle "applica in automatico SOLO i casi deterministici ovvi", tenendo il GIUDIZIO (deload) sempre col gate coach. MVP = tutto approvato.

&#x20; - \*\*TIE-IN:\*\* estende il fossato dal "durante" al "tra" le sessioni (RIR/RPE raccolti real-time → usati per programmare).

&#x20; - \*\*GATED dietro:\*\* Progressione sequenziale (MVP) + "Fine sessione chiara" + dati sufficienti + atleti paganti. \*\*File:\*\* `chat.js` (nuova chiamata) + frontend → diff + conferma; tocca anche `editProgram` + semantica template.

\- \[x] \*\*Hardening: admin bypassa il pending-gate di `/api/chat.js` — ✅ FATTO (giugno 2026, commit `1410bd5`).\*\* `/api/chat.js` ora seleziona `status,role` dal profilo e il gate passa se `status==='active' || role==='admin'` → la test session "Prova" gira indipendentemente dallo `status` dell'admin. Gate trial e struttura del prompt caching (Leva 2) intatti.

\- \[ ] \*\*Cleanup: verifica del path "demo onboarding"\*\* — `startDemoSession` ha chiamanti (onboarding/dashboard atleta). Verificare se l'ingresso è ancora raggiungibile/voluto in UI; eventualmente ripulire i chiamanti morti SENZA toccare la primitiva `\_isDemo` (la usa anche la test session). NON urgente.

\- \[ ] \*\*Multi-coach / "amici come coach"\*\* \_(GATED)\_ — i template e l'assegnazione esistono già; il passo è più coach con i propri template/atleti. GATED dietro la validazione del mono-coach; poi 1-2 amici-coach. Intervento architetturale (ownership template, RLS per-coach) → analisi prima.

\- \[ ] \*\*Breathwork v2 — salvataggio tempi di ritenzione\*\* — persistere i tempi per round. Richiede migration DB dedicata (NON nell'MVP).

\- \[ ] \*\*Breathwork — altre tecniche (pranayama)\*\* — Nadi Shodhana, Ujjayi, Bhastrika, Kapalabhati, Bhramari. Nuovi "descrittori" se il player è a oggetto-dati. Niente API.

\- \[ ] \*\*Builder "crea il tuo programma" (Opzione 1)\*\* — l'utente seleziona esercizi dalla libreria e può crearne (`owner\_id` esiste), genera `workout\_csv`, gira sul motore generico (NON reintrodurre il "Generatore prompt AI" rimosso). Rischio commodity → dopo validazione.

\- \[ ] \*\*"Workout improvvisato" (Opzione 4)\*\* — mini-questionario (attrezzi, obiettivi, tempo) → l'AI GENERA il workout su prompt generico. DEVE catturare infortuni/limitazioni (sicurezza). \*\*DIVERSO da "Allenamento libero"\*\* (🟡): qui l'AI genera, lì è log manuale.

\- \[ ] \*\*Commento stale in `api/chat.js`\*\* — sopra il blocco del gate trial cita ancora "count exact via HEAD", ma la logica è ora GET + finestra 24h (commit `21b25ff`). Solo commento, nessun impatto.

\- \[ ] \*\*Playwright E2E del funnel trial — SBLOCCATO (prerequisito SODDISFATTO: ambiente di preview locale ✅ FATTA, 14/06).\*\* Test ad alto valore (signup → template → 3 sessioni → 403 → CTA): ora c'è dove farlo girare in sicurezza (`vercel dev` via `.\dev.ps1`). \*\*Caveat:\*\* la preview tocca il DB Supabase REALE (env da production) → l'E2E va isolato su dati/account di test.

\- \[ ] \*\*Cleanup account/programmi di test\*\* — rimuovere account/programmi di prova residui.

\- \[x] \*\*Cleanup `workouts` (vestigiale) — FATTA (14/06).\*\* Colonna `workouts` (text in `programs`, jsonb in `program\_templates`) inutilizzata (source of truth = `workout\_csv`), ora RIMOSSA del tutto. \*\*Tempo 1 — CODICE (commit `2618335`):\*\* rimosse le 5 scritture LIVE (`addProgram`/`editProgram` su `programs`, `addTemplate`/`editTemplate` su `program\_templates`, `assignTemplate` su `programs`) in `api/admin.js` + i 6 payload `workouts:JSON.stringify([])` in `admin-ui.js` + la destrutturazione morta in `repushTemplate`. \*\*Tempo 2 — DROP colonna DB (eseguito a mano nel SQL Editor di Supabase, non versionato):\*\* `alter table programs drop column workouts` + idem `program\_templates`; verifica `information\_schema` tornata a zero righe. Nessun riferimento residuo su `programs`/`program\_templates`. Le 3 occorrenze legacy su `profiles` (`updateProgram`/`resetProgram`) restano FUORI SCOPE — coperte dal loro TODO dedicato ("Cleanup `admin.js` legacy").

\- \[x] \*\*Cleanup `COACH\_LOG\_FORMAT` / `saveSessionLog()` — FATTA (15/06).\*\* Rimossi da `index.html` (dichiarazione + intera funzione), zero chiamanti verificati. `stripLogData` (usata da `fmtText`) lasciata VIVA di proposito.

\- \[x] \*\*Cleanup `admin.js` legacy — FATTA (14/06).\*\* Rimosse le due funzioni morte `updateProgram`/`resetProgram` da `api/admin.js` (nessun chiamante nel frontend); chiuse così le ultime occorrenze di `workouts` su `profiles`.

\- \[ ] \*\*PWA / installazione mobile (PASSO 2)\*\* — service worker + installabilità + Lighthouse ≥80. \*\*Il PASSO 1 (manifest + icone + favicon) è la voce 🟡 "Logo/icona web app"\*\* e si fa prima, indipendente. \*\*PREREQUISITO di "Distribuzione app store".\*\*

\- \[ ] \*\*Dark/light toggle\*\* — tema chiaro (dark è brand).

\- \[ ] \*\*Micro animazioni\*\* — transizioni tra schermate.

\- \[ ] \*\*Libreria esercizi pubblica (SEO)\*\* — pagina sfogliabile senza login. Con RLS serve una policy di lettura pubblica dedicata.

\- \[ ] \*\*favicon\*\* — manca (404 in console, innocuo). \*\*Si chiude col PASSO 1 "Logo/icona web app" (🟡).\*\*

\---

&#x20;

\## 💡 Idee / decisioni strategiche da valutare (NON confermate)

> Parcheggio strategico: NON sono task operativi né decisioni prese. Si ragiona, poi si promuovono in 🔴/🟡/🟢 o si scartano.

&#x20;

\- \[ ] \*\*Esercizi con elastici (resistance band) — parcheggiata, DA DEFINIRE.\*\* Modellare gli esercizi con elastici dove il colore = intensità. \*\*Principio fissato:\*\* livelli ancorati agli ELASTICI FISICI del set reale (tipicamente 1-5), NON scala astratta 1-10 — gli elastici sono oggetti discreti, l'atleta ragiona per colore ("ho usato il rosso"), la progressione non è lineare come i kg (salti grossi tra bande; si progredisce con reps/tempo a parità di banda) → tabella di mappatura `livello ↔ colore ↔ resistenza indicativa` definita sul set reale.

&#x20; - \*\*DOMANDE APERTE:\*\* (a) assistenza vs resistenza — in calisthenics l'elastico spesso AIUTA (trazioni/muscle-up assistiti: banda più grossa = più FACILE, scala invertita); come resistenza è l'opposto; se servono entrambe, il dato deve dire anche la DIREZIONE; (b) quale set fisico hanno gli atleti (quanti colori, quali); se set diversi → mappatura per-programma nei `coach\_rules`, non globale.

&#x20; - \*\*MVP ipotizzato (da validare):\*\* token CSV deterministico (es. "elastico N" nella Note dei programmi bodyweight/misti — la regola "Note = peso" vale solo per i gym), mappatura colori in una riga dei `coach\_rules` del template (l'AI parla per colori, zero codice), livello loggato come campo del set nel jsonb.

&#x20; - \*\*CROSS-REF:\*\* si appoggia al \*\*descrittore per-esercizio\*\* (`load:'kg'|'band'|none`); le LEVE DI DIFFICOLTÀ di Muscle-Up Pro citano già "elastico più leggero"; impatta l'autoregolazione ("aggiungi peso" non si traduce in "elastico +0,5": si cambia banda o si lavora su reps/tempo).

\- \[ ] \*\*Certificazione PT Project inVictus come R\&D dell'app — DA VALUTARE (acquisto NON confermato).\*\*

&#x20; - \*\*Contesto:\*\* studiare la cert PT e convertire i concetti in qualità del "cervello" coaching ("conoscenza del coach = qualità dell'app").

&#x20; - \*\*Dati corso (DA RIVERIFICARE all'iscrizione):\*\* \~998€ (o 4×249,50€), 14gg rimborso; 50h on-demand, 100% online, accesso 2 anni accademici, 11 moduli; Diploma inVictus Trainer + tesserino ASI 3° livello (\~65€), compatibile Riforma dello Sport (EPS via ASI), EQF4, riconosciuto CONI; esame 100 domande chiuse (min 60/100) + prerequisiti prove pratiche VIDEO + tesina su percorso ≥6 settimane (body recomp o forza/ipertrofia); sessioni giu/set/nov; iscrizioni a finestre (set-ott + gennaio), attualmente CHIUSE / lista d'attesa.

&#x20; - \*\*Mappatura moduli→feature:\*\* Mod 6 (Teoria allenamento: periodizzazione, buffer=RIR, micro/macrociclo, percentuali, Prilepin) → spina teorica di "Analisi AI progressioni" e "Progressione programma" (mesociclo); Mod 8/9 (Metodo + Programmi: buffer/cedimento, progressioni, programmazione per livello) → template stratificati per livello + base skill tree + affinamento coach\_rules autoregolazione reattiva; Mod 3 (Biomeccanica + traumatologia: spalla/ginocchio/lombalgia) → tassonomia libreria esercizi + qualità cue + logica infortuni (filtro sicurezza athleteContext) + video tutorial accurati; Mod 7 (Valutazione funzionale: prima seduta, test) → Onboarding AI + assessment "test-out"; Mod 10/11 (Marketing + fiscale/legale) → posizionamento subscription + lato fiscale/assicurativo. FUORI SCOPE: moduli nutrizione/ricomposizione (incl. DCA) — non costruirci feature.

&#x20; - \*\*Bonus:\*\* le prove pratiche OBBLIGANO a filmare i video degli esercizi = gli stessi 10-15 movimenti core del task "Video tutorial" + contenuto social.

&#x20; - \*\*Analisi:\*\* sinergia reale e coerente, MA i concetti (periodizzazione/double progression/deload/buffer) sono scienza standard → la spesa si giustifica su CREDENZIALE + METODO COERENTE; l'app è il bonus forte, non il motivo unico. Rendere la sinergia CONCRETA: \*\*tesina = caso AILISTENICS\*\* (blocco forza/ipertrofia di 6 settimane fatto girare nell'app su un atleta beta) → deliverable del corso e validazione dell'app = lo stesso lavoro. Workflow: appunti modulo per modulo → artefatti dell'app.

&#x20; - \*\*SCOPE coaching (chiarito giugno 2026):\*\* la parte IN-SESSIONE che il corso alimenta = modulazione del \*\*RIR target per livello atleta e per tipo esercizio\*\* dentro il MOTORE + ripulitura mirata degli SCHEMI DI FEEDBACK. \*\*FUORI scope (GATED):\*\* la progressione TRA le sessioni (doppia progressione, deload) NON è coaching in-sessione → resta dentro "Analisi AI progressioni + deload" (🟢, Periodizzazione AI).

&#x20; - \*\*Sotto-item APERTO (frontend del motore, `settings`):\*\* ripulire il FRASEGGIO dello schema di feedback per gli esercizi a CORPO LIBERO — dopo l'unificazione dei delta (vedi "Prompt unico per-esercizio", Completati) il ramo corpo-libero può ECHEGGIARE frasi pescate dal ramo con carico (es. "vicino al limite"). Da rivedere nel testo `coach\_prompt\_global` (Table Editor, no deploy).

&#x20; - \*\*Next reasoning:\*\* decidere se/quando iscriversi alla prossima finestra, legandolo a quando il coaching fa reddito e al costo-opportunità (50h+tesina+esame vs costruire). NON aspettare il corso per i task ungated.

&#x20; - \*\*CROSS-REF:\*\* Analisi AI progressioni + deload, Progressione programma, Sblocco skill ad albero, Video tutorial esercizi, Onboarding AI.

\- \[x] \*\*Rebranding nome prodotto — ✅ DECISO (16/06): AILISTENICS CONFERMATO come nome prodotto; COAICH SCARTATO. NON è più una domanda aperta.\*\*

&#x20; - \*\*Innesco (storico):\*\* "AILISTENICS" (AI + calisthenics) lega il brand al solo corpo libero; il prodotto copre anche palestra/ipertrofia, funzionale e movimento. Domanda: nome troppo settoriale? → \*\*valutata e DECISA (16/06): si TIENE AILISTENICS\*\* (cambio nome = costo/rischio non giustificato ora; il prodotto cresce sotto questo nome).

&#x20; - \*\*Esplorazione archiviata (NON scelte):\*\* candidato emerso COAICH (CO-AI-CH, "AI" dentro "coach"; verifica web: nessuna app/brand fitness omonima → libero in categoria; caveat: a voce suona "coach" → ambiguità pronuncia/spelling, rischio passaparola + digitazione dominio, radice generica). Scartati con motivo: trAInr/Trainr (saturo: Trainerize, "Trainr: Strength Coach" quasi-clone, trainr.fitness…), AIthlete (preso su .co/.net/.club/.app + handle IG, con "AiThlete" quasi-clone). Lezione: lo spazio "AI infilata in una parola" è affollato; gli evocativi (Kairos, Strive/Straive, Thrive, Sensei/Sensai) già a mercato, spesso da cloni del concept.

&#x20; - \*\*Storico (decisione ora PRESA: si resta AILISTENICS — riferimento solo se mai si riaprisse):\*\* il bivio era (a) COAICH + risoluzione wordmark/pronuncia VS (b) marchio coniato/astratto distintivo + AI nel tagline. Verifiche pre-acquisto (allora): dominio coaich.com (+ .it/.ai) su Namecheap, handle @coaich su IG/TikTok/X; clearance trademark = passo legale separato. Scope migrazione AMPIO (non è solo "scegliere il nome"): `index.html` (title, UI, stringhe "AILISTENICS", meta/OG, futuro manifest PWA); dominio (Vercel + DNS Namecheap + redirect dal vecchio + URL callback/reset); email onboarding (Apps Script); .md + CLAUDE.md; social/store; repo (`carlospola/calislackline-app`) e progetto Supabase: valutare di LASCIARE i nomi interni invariati (non rompere FK/URL/env). \*\*GATE A CASCATA (ora SBLOCCATO):\*\* il "Dominio email personalizzato" (🟢) ereditava questo gate; con AILISTENICS confermato non è più gated dal rebranding.

&#x20; - \*\*DO-NOT:\*\* non rinominare nulla in codice/dominio/repo/Supabase finché non c'è decisione esplicita; non comprare domini senza il check Namecheap. Il cambio nome NON è un cambio di prodotto/feature.

\- \[ ] \*\*Workflow Claude.ai ↔ Claude Code — source of truth unico nel repo (ponte git) — DA RAGIONARCI.\*\*

&#x20; - \*\*Problema:\*\* doppia source of truth (4 .md nel Project Claude.ai, CLAUDE.md nel repo) + avanti-e-indietro a copia-incolla manuale dello split workflow → frizione.

&#x20; - \*\*Fatti:\*\* nessun ponte nativo Project↔Claude Code (feature request aperta); il sistema Task/Agent Teams di Claude Code vive DENTRO Claude Code, non verso Claude.ai; tool terzi (ClaudeSync) non ufficiali e a rischio ToS → NON usarli su un prodotto live. Unico ponte reale: git/GitHub.

&#x20; - \*\*PARTE 1 (se confermata — doc-only, ZERO rischio deploy, dritta su main):\*\* spostare i 4 .md in `/docs` nel repo; CLAUDE.md li importa con la sintassi `@` (`@docs/TASKS.md`, `@docs/ARCHITECTURE.md`…) così Claude Code li legge e li AGGIORNA direttamente; collegare il Project Claude.ai a GitHub (connector) per leggere il repo VIVO invece delle copie statiche. Risultato: source-of-truth UNICO nel repo, git come livello di sync; Project = cervello strategia/architettura, Claude Code = esecuzione + bookkeeping (incl. aggiornare TASKS.md). File: repo `/docs` + CLAUDE.md. Frontend/backend/DB: NESSUNO. Niente migration.

&#x20; - \*\*PARTE 2 (Avanzato, GATED — NON ora):\*\* Agent Teams/subagent paralleli in Claude Code e/o GitHub Action di Claude Code con issue/PR come coda di task e PR automatica su branch.

&#x20; - \*\*⚠️ CAVEAT LOAD-BEARING:\*\* NON puntare al pieno automatico. Il gate "piano/diff prima del codice" resta obbligatorio: è produzione con utenti veri. \*\*PREREQUISITO per la PARTE 2 — ambiente di preview/test: ora SODDISFATTO\*\* (preview locale `vercel dev` ✅ FATTA, 14/06) → la PARTE 2 è SBLOCCATA su questo fronte. \*\*MA\*\* la preview gira sul DB Supabase REALE (env da production), quindi NON è ancora uno staging isolato: un loop "completa tutta TASKS.md da solo" spedirebbe comunque effetti in prod. Coach-in-the-loop obbligatorio.

&#x20; - \*\*Next reasoning:\*\* decidere se attivare la PARTE 1 in un prossimo batch documentale.

\- \[ ] \*\*Avatar coach per-atleta — idea minore, DA VALUTARE (tenuta in parcheggio prima di scartarla).\*\* Personalizzazione visiva del coach AI per atleta. Nessun dettaglio definito, nessuna analisi fatta.

- [ ] 💡 **Log multi-disciplina + timer attivita + calendario multicolore — PARCHEGGIATA (idea, BS 16/06/2026).** Registro allenamenti OLTRE AILISTENICS: timer di durata per BJJ e altre discipline, log che compare nei Progressi con media/settimana, totale mese e totale storico PER disciplina; calendario con un colore per disciplina e cella splittata in 2-3 quando nello stesso giorno ci sono piu discipline; sessioni AILISTENICS incluse come una delle discipline.
  - **Aggancio architettura:** il calendario esiste gia (`renderHeatmapMonth` + `calNavMonth` in `progress.js`) → lo split-cella multicolore e un'evoluzione di quello; stat per disciplina sullo stesso pattern di `renderOverviewCharts`. Il timer durata cavalca il MOTORE-TIMER unico a `Date.now()` gia pianificato (NO `setInterval` dedicato). "Disciplina" = dato configurabile `{nome, colore}` (stessa filosofia del descrittore per-esercizio); AILISTENICS e una delle discipline.
  - **⚠️ FORK #1 (data model, da sciogliere PRIMA del build):** tabella nuova `activities {user_id, discipline, date, duration_seconds, note}` VS campo `discipline` sulla `sessions` esistente. Gotcha: il gate trial in `chat.js` conta le righe di `sessions` → i log non-AILISTENICS li dentro BRUCIANO i crediti di prova e gonfiano i conteggi. Spinge forte verso tabella separata.
  - **FORK minori aperti:** AILISTENICS = una disciplina o due (cali vs gym, gia distinti da `session_type`); regola di render per >3 discipline in un giorno (tetto 3 + "+N"?); granularita log BJJ (solo durata+nota MVP vs round/sparring/tecnica v2).
  - **MVP:** quick-log (disciplina + data + durata) + colore per disciplina nel calendario esistente + i tre conteggi. Frontend + tabella leggera, basso rischio. Split-cella multicolore = v2.
  - **Posizionamento:** feature di RETENTION/stickiness, NON del fossato (il core resta il coaching real-time su RIR/RPE). Prioritizzare DOPO le mosse che sbloccano il primo pagante. Valutazione BS: retention 8/10, core 3/10, fattibilita MVP 7/10, urgenza 4/10.

- [ ] 💡 **Colonna CSV "tipologia esercizio" {corpo libero, zavorra, peso} — PARCHEGGIATA (idea, 24/06/2026).** Classificatore esplicito per riga, IN AGGIUNTA alla colonna `Peso` (NON la sostituisce: il valore kg resta in `Peso`). Oggi la detection weighted-vs-corpo-libero basta sulla colonna `Peso` piena/vuota; nessun consumatore obbligatorio.
  - **Unico aggancio concreto attuale:** per la ZAVORRA, 1RM stimato e volume (Batch 1 Progressi) sono calcolati sulla SOLA zavorra ignorando il peso corporeo → numero ASSOLUTO impreciso (il TREND resta ok). La tipologia permetterebbe di etichettare diverso (es. "1RM zavorra") o di sopprimere l'1RM tenendo solo il trend.
  - **Promuovere a batch SOLO se** il distinguo zavorra/peso deve cambiare un'ETICHETTA o un COMPORTAMENTO. Cambio multi-superficie: parser (`field.tipologia`) + migrazione di tutti i 9 CSV + lettori.
  - **Nota collegata:** il caso "cali zavorrato non mostra il peso" si risolve GIÀ OGGI come FIX DATI (popolare la colonna `Peso` con la zavorra via tab Template + "Applica a tutti"), zero codice.

\---

&#x20;

\## ✅ Completati — Progressi v2: Epley RIR-adj + Dettaglio set multi-metrica + titoli/desc + grafici Overview (25 giugno 2026, commit `7744796`+`2fb6aeb`+`4ed20c8`+`e23164b`+commit Overview)

\- \[x] \*\*Step 1 — Epley RIR-adjusted (commit `2fb6aeb`).\*\* Stima 1RM = `peso*(1+(reps+rir)/30)`; `rirEff=0` se rir null. Unica occorrenza in `progress.js` (sessionMaxE1rm). CORREGGE la formula del Batch 1 (era `reps/30`).

\- \[x] \*\*Step 2 — Dettaglio serie per serie multi-metrica (commit `4ed20c8`).\*\* `renderSetDetailChart` riscritta: 5 metriche (peso: Tonnellaggio/Massimale stimato/Reps/RIR/RPE; corpo libero: Reps/RIR/RPE; isometrici: Secondi/RIR/RPE), controlli on/off + stile barre/punti/linea generati via DOM (no onclick inline) nei div `pChartSetsControls`/`pChartSetsDesc`. Assi: `y` (sx), `yE` (dx, massimale), `yEffort` (dx 0-10, RIR+RPE condivisi). Default ON a barre: tonn+rir (peso), reps+rir (libero). Stato NON persistente. Cap ultimi 60 set. NB: la baseline sostituita era il commit `7744796` (il cui messaggio dice "bar volume/reps/secondi + linea RIR" ma la baseline reale era "volume + linea RIR" — annotazione, nessun amend git).

\- \[x] \*\*Step 3 — Tab Esercizio: titoli estesi + desc/formula + nuovo grafico RIR (commit `e23164b`).\*\* Titoli estesi su `chartReps` ("Massimale stimato per sessione (kg)" / "Media reps a serie (per sessione)"; isometrico invariato) e `chartTotalReps` ("Tonnellaggio per sessione (kg)" / "Reps totali per sessione"; isometrico invariato), settati per-ramo in `progress.js`. Nuovi div desc dinamici `pChartRepsDesc`/`pChartTotalRepsDesc` (popolati via `esc()` + span formula blu `#8fb0c0`; isometrico = desc vuota). Desc statiche in HTML per RPE (relabel "Fatica percepita (RPE medio)"). NUOVO grafico "Margine al cedimento (RIR medio)" (canvas `chartRir`, RIR medio per sessione, barre 0-10, RIR 0 valido via `rir != null`; sia peso sia corpo libero).

\- \[x] \*\*Step 4 — Tab Overview: stat-card + 4 grafici + relabel (commit Overview).\*\* 3 nuove stat-card (`ovStatReps` REPS TOTALI, `ovStatRir` RIR MEDIO, `ovStatAvgSets` MEDIA SET/SESS.) nel grid esistente (3→6). 4 nuovi grafici per-sessione: `chartOvSets` (Set), `chartOvTotReps` (Reps totali), `chartOvVol` (Tonnellaggio, SOLO `weight>0`), `chartOvRir` (RIR medio, barre 0-10). Relabel: torta "Distribuzione intensità (RIR globale)" → "Come distribuisci lo sforzo (RIR)" + desc; "Fatica percepita media per sessione" → "Fatica percepita (RPE medio)" + desc. Tutti i testi user-friendly con titolo+desc+formula approvati.

\- \[x] \*\*Invariati:\*\* heatmap calendario, modale giorno, rami isometrici (titoli/desc non sovrascritti). File toccati: `progress.js` + `index.html`. Residuo tecnico noto (non bug): `var totalVolume` in `renderProgressCharts` ancora morta (dal Batch 1).

\## ✅ Completati — Batch 1 Progressi: 1RM stimato + volume per sessione + miglior set + rename Fatica (24 giugno 2026, commit `91ff228`)

\- \[x] \*\*1RM stimato (Epley).\*\* Nuovo grafico nel ramo ESERCIZIO CON PESO: `e1RM = peso * (1 + reps/30)`; per ogni sessione si prende il MAX e1RM dei suoi set; riusa il canvas `chartReps`; titolo "1RM stimato (kg)". SOSTITUISCE nel GRAFICO il precedente "Peso massimo (kg)" (il peso max resta nella stat-card `pStatPR`).

\- \[x] \*\*Volume per sessione (kg).\*\* Grafico nel ramo con peso = somma `(peso*reps)` per sessione; riusa il canvas `chartTotalReps`; titolo per-ramo: weighted = "Volume per sessione (kg)", isometrici = "Secondi totali sessione", corpo libero = "Reps totali sessione".

\- \[x] \*\*Miglior set.\*\* La stat-card ex "VOLUME" (`pLblTot`/`pStatTotalReps`) mostra ora il volume massimo del singolo set = `max(reps*peso)`, label "MIGLIOR SET", suffisso `kg`, fallback trattino.

\- \[x] \*\*Rename "RPE medio" → "Fatica percepita media".\*\* In `index.html`: titoli grafici `chartRPE`/`chartOvRPE` e stat `ovStatRPE` ("RPE medio"/"RPE MEDIO"/"RPE medio per sessione" → "Fatica percepita media", anche in MAIUSC), per coerenza col label in sessione.

\- \[x] \*\*Invariati:\*\* i rami CORPO LIBERO e ISOMETRICI. File toccati: `progress.js` + `index.html`. \*\*Nota tecnica residua (non bug):\*\* la var `totalVolume` in `renderProgressCharts` è ora morta (sommata ma non mostrata) — cleanup futuro, innocua.

\## ✅ Completati — Form template + coach\_rules opzionale + Assegna idempotente + admin bypass (23 giugno 2026, commit `1410bd5`)

\- \[x] \*\*Form Template senza placeholder di esempio.\*\* Nel modale `#templateFormModal` rimossi i placeholder di esempio dai campi compilabili `tplName`, `tplRules`, `tplCsv`, `tplPrompt` (la select `tplType` invariata).

\- \[x] \*\*`coach\_rules` ora opzionale.\*\* Rimossa la validazione che bloccava il salvataggio con `coach\_rules` vuoto in `saveEditProgram`, `addProgram` e `saveTemplate` (`admin-ui.js`): ora richiedono SOLO il nome; il campo `coach\_rules` resta ma è opzionale (il comportamento comune vive nel motore `settings`).

\- \[x] \*\*"Assegna" idempotente (debounce).\*\* `confirmAssign` (`admin-ui.js`) ha una guardia di re-entrancy — var `assignInFlight` a livello di file + `try/finally` che la resetta + bottone di conferma disabilitato durante la chiamata. Chiude il gap noto "doppio tap = riga `programs` duplicata".

\- \[x] \*\*Admin bypassa il pending-gate di `/api/chat.js`.\*\* Il gate ora seleziona `status,role` e passa se `status==='active' || role==='admin'` → la test session "Prova" gira indipendentemente dallo `status` dell'admin. Gate trial e struttura del prompt caching (Leva 2) intatti.

\## ✅ Completati — Isometrici a tempo + timer a timestamp + fix motore base (giugno 2026)

\- \[x] \*\*Esercizio a tempo / isometrici (logging + cronometro) — SHIPPED (giugno 2026).\*\* È il `metric=time` del descrittore per-esercizio, gemella di `weighted=Peso`. \*\*Rilevamento DETERMINISTICO:\*\* `isTimedReps(reps)` = `/\\d+\\s\*(sec|min)/i` sul campo Reps → `currentTimed` + `currentHoldTarget` (`parseHoldTarget`: range → max; "min" → ×60). \*\*Cronometro CONTA-SU su `Date.now()`\*\* (`holdStart`/`holdInterval`/`holdElapsed`; `holdToggle`/`holdReset`), MAI `setInterval` decrementale. \*\*UI ridisegnata:\*\* widget cronometro (label "Tenuta" + `holdNum`) e infobox Secondi (input `reps\_a` VISIBILE, placeholder "sec") sullo stesso piano; sotto i bottoni Avvia/Stop (`holdGo`) + Reset stesso piano. \*\*UN solo percorso di log:\*\* l'aeroplanino Invia (`sendBtn` → `sendMsg`); RIMOSSI il bottone Registra, l'input `holdManual` e la funzione `holdLog`. \*\*Logging:\*\* secondi nel campo `reps` (MVP) + marker OPZIONALE `metric:'time'` nel set di `log\_data` (jsonb, niente migration; retrocompat: log vecchi senza marker = reps). \*\*Avanzamento contatore set\*\* deterministico in `sendMsg`, gated `currentTimed && currentSetMode==='single' && pendingSets.length`, via `holdTotSet`, poi `holdReset`. \*\*Etichetta log "Tenuta: N sec"\*\* (invece di "Reps: N") quando `currentTimed`; `hasReps` matcha anche `/Tenuta:\s\*\d+/` → il timer recupero si ferma anche sulle tenute. Box Target = `csvReps` (es. "40-50 sec") quando timed. Niente RIR sulle tenute, RPE opzionale, peso se weighted. Helper: `isTimedReps`, `parseHoldTarget`, `holdTotSet`. \*\*EDGE noti:\*\* superset di tenute → input manuale (raro); isometrico zavorrato (peso>0) → resta nel ramo peso (kg), relabel secondi solo se non weighted; formato misto "1 min 30 sec" mal-parsato da `parseHoldTarget` (raro); tenuta 0s → bubble innocuo; log vecchi senza marker `metric:'time'` non rietichettati in secondi. Lato PROMPT già coperto nei `coach\_rules` MUP. Solo `index.html`, frontend-only.

\- \[x] \*\*Timer recupero in background — SHIPPED (giugno 2026).\*\* Riscritto da `setInterval` decrementale a `Date.now()`: `sessionTimerEndAt` + ricalcolo del rimanente dal diff con `ceil`; la pausa congela il rimanente, il resume ricalcola `endAt`; tick 250ms solo repaint → robusto col tab in background. È il \*\*motore-timer unico a timestamp\*\*, base CONDIVISA col cronometro delle tenute (isometrici). Tocca `index.html`.

\- \[x] \*\*Progressi in secondi — SHIPPED (giugno 2026).\*\* `renderProgressCharts` rietichetta per esercizio a tempo: TENUTA MAX / MEDIA / TOT SECONDI, titolo "Media secondi per set", secondo titolo "Secondi totali sessione" via nuovo id HTML `pChartTotalRepsTitle`, valori col suffisso "s". Detection `isTimedExercise(name, filtered)` (prima dal marker `metric:'time'` nel log, fallback al CSV corrente via `isTimedReps`). Edge: isometrico zavorrato resta nel ramo peso (kg); log vecchi senza marker non rietichettati. Ora in `progress.js`.

\- \[x] \*\*Fix motore — guardia all'ordine (ORDINE LIBERO rafforzato).\*\* In `coach\_prompt\_global` (Table Editor, no deploy, già live): il prefisso "Esercizio: <nome>" è AUTORITATIVO e prevale sull'ordine del CSV e sul default "primo esercizio", ANCHE subito dopo il warm-up; vietato fare la guardia all'ordine, chiedere conferma del cambio, dire "siamo ancora su X" / "torniamo a X" / "prima completa Y", elencare i mancanti, o dire che un esercizio è "l'ultimo" per rimandarlo; ancora nel blocco WARM-UP (dopo "pronto", se il primo messaggio nomina un esercizio col prefisso "Esercizio:", parti da quello).

\- \[x] \*\*Fix dati BBR — archer alternati.\*\* Rimosso "L&R" dai 3 archer ALTERNATI (Archer Pushup Fase 1 Push 1, Archer Pushup Fase 2 Push 1, Archer Chinup Fase 2 Pull 2): negli alternati le reps si contano sul TOTALE, non per lato; i "Same Side" restano per-lato. Aggiunta clausola ALTERNATI nei `coach\_rules` BBR (template + 5 copie collegate; NON in BBR Test): su esercizi "Alternating" reps e RIR si contano sul TOTALE alternato (mai "per lato"), e la fascia RIR valida diventa 0-6 (non 0-3) perché ~3 di riserva per lato ≈ ~6 sul totale.

\- \[x] \*\*Fix motore — feedback "reps sotto il range".\*\* In `coach\_prompt\_global`: stima il massimo a quel carico ≈ reps + RIR confrontato col pavimento; reps+RIR ≥ pavimento o RIR non dichiarato → "completa il range, stesso carico"; reps+RIR < pavimento → con carico "abbassa il peso", a corpo libero "variante più facile / più assistenza".

> \*\*⚠️ NOTA:\*\* i tre fix motore/dati sopra (guardia ordine, BBR alternati, feedback sotto il range) sono correzioni di BASE separate. NON sono il \*\*Punto 6 inVictus\*\* (modulazione del RIR target per livello atleta e tipo esercizio), che resta PARCHEGGIATO nelle task/idee future con la cornice "studio prima, implemento incrementale".

\## ✅ Completati — Prompt unico per-esercizio + fix bug Pronto + chiusura 3B (giugno 2026)

\- \[x] \*\*\[BUG] `selectExercise` non azzera la quick-option `[PRONTO]` pendente — RISOLTO (commit `675f89e`).\*\* Se l'atleta sceglieva un esercizio dalla lista PRIMA di premere "Pronto" (warm-up), il bottone Pronto restava appeso e saltava il saluto post-pronto. Fix: `selectExercise` ora rimuove la quick-option pendente all'inizio, subito dopo la chiusura dell'overlay, replicando il pattern già presente in `addBubble`. \*\*`#quickOptions` è il container DOM UNICO di TUTTE le quick-option\*\* (bottone Pronto del warm-up + option-chip) → ripulito sia da `addBubble` sia ora da `selectExercise`. Solo `index.html`, frontend-only.

\- \[x] \*\*Prompt unico per-esercizio (unificare i delta motore) — FATTO (`settings`, Table Editor, no deploy).\*\* I due delta `coach\_prompt\_gym` e `coach\_prompt\_bodyweight` sono stati \*\*SVUOTATI\*\* e il comportamento peso/tempo è ora interamente in `coach\_prompt\_global`, deciso \*\*PER-ESERCIZIO\*\* dalla colonna `Peso` del CSV (cella valorizzata = CON CARICO; cella vuota = A CORPO LIBERO). Aggiunti al global i blocchi \*\*CARICO O CORPO LIBERO\*\* e \*\*LEVA DI DIFFICOLTÀ\*\*. \*\*`chat.js` e la Leva 2 (prompt caching) intatti:\*\* `chat.js` concatena un delta vuoto, la struttura a blocchi cachati non cambia. `session\_type` non è più usato dal motore per il comportamento (resta nel DB/codice → rimozione = cleanup futuro). \*\*Effetto:\*\* il caso misto è gestito per-esercizio senza `session\_type`.

\- \[x] \*\*\[FIX COACHING] 3B — Leva-RIR di Muscle-Up Pro — CHIUSA (`coach\_prompt\_global` + `coach\_rules`, Table Editor, no deploy).\*\* La leva di difficoltà sugli esercizi a corpo libero si attiva ora su un trigger \*\*DETERMINISTICO `reps > tetto` del range\*\* (nel MOTORE), NON sul giudizio RIR del modello (che era flaky sul bordo RIR=3). `coach\_rules` Muscle-Up Pro snelliti: \*\*rimossa la soglia RIR delle leve e la filosofia-peso-via-Note\*\*; tenuti ISOMETRICI e la scala leve (riduci assistenza → eccentrica → variante).

\- \[x] \*\*\[FIX COACHING] coach\_rules Frau Medici - Palestra (Petra) snelliti (`coach\_rules`, Table Editor).\*\* Rimossa la regola che toglieva peso su RIR basso (causava il feedback errato "togli peso" su ripetizioni a target); tenuto e preservato il blocco \*\*LINGUAGGIO SEMPLICE\*\*. Learning: i `coach\_rules` a linguaggio semplice devono evitare i termini vietati ANCHE nelle istruzioni interne, non solo in output, o il modello li echeggia. Dopo l'unificazione i `coach\_rules` collassano a residui specifici per-programma (Petra = linguaggio semplice; Muscle-Up Pro = isometrici + scala leve).

\## ✅ Completati — E2E funnel trial (Playwright) (16 giugno 2026)

\- \[x] \*\*Harness E2E ISOLATO sotto `e2e/` (Playwright) — FATTO (16/06).\*\* Cartella `e2e/` con `package.json` proprio (NON il repo, che resta no-build), `node_modules` gitignorato (`e2e/.gitignore`), e `e2e` in `.vercelignore` alla root → \*\*escluso dal deploy\*\*. Config `playwright.config.js`: un solo project chromium, `baseURL http://localhost:3000`, NESSUN `webServer` (il dev server si avvia a mano con `.\dev.ps1`).

\- \[x] \*\*Spec `e2e/specs/trial-funnel.spec.js` — verifica il gate trial.\*\* Scenario: trialist (`pending`) con \*\*3 sessioni consumate\*\* → 4o avvio sessione dal dashboard → \*\*POST `/api/chat` → 403 `trial_exhausted`\*\* → CTA \*\*"Richiedi il coaching"\*\* visibile. Iniezione sessione via `signInAsUser` (login programmatico anon) + `window.sb.auth.setSession` → \*\*nessuna UI Google\*\*.

\- \[x] \*\*Seed/teardown via service-role isolati (`e2e/lib/db.js`).\*\* Tutte le operazioni su \*\*email riservate\*\* `e2e+<ts>@ailistenics.test` (regex `RESERVED_RE`); ogni delete passa per `assertTestEmail`; `preSweep` ripulisce run crashati. Determinismo: le 3 sessioni sono \*\*retrodatate 25h\*\* (oltre la finestra 24h "Riprendi" → nessuna sottrazione → `used=3`). \*\*Zero token Anthropic\*\*: il 403 scatta PRIMA della chiamata AI. Validato (`1 passed`).

\- \[x] \*\*Commit:\*\* `7239400` (scaffold harness + seed/teardown validati) e `14ed1d7` (spec + helper `signInAsUser` + probe auth + dotenv quiet). \*\*Prereq esecuzione:\*\* dev server locale (`.\dev.ps1`) + `NEXT_PUBLIC_SUPABASE_ANON_KEY` valorizzata in `.env.local`.

\## ✅ Completati — Estrazione modale log (15 giugno 2026)

\- \[x] \*\*Estrazione log modal (`index.html` → `log.js`) — FATTA (15/06).\*\* 4 funzioni (`openLogModal`/`toggleLogEdit`/`saveLogEdit`/`deleteLog`) + var `currentLogSession` spostate VERBATIM (estratte via `sed`, byte-exact); \*\*`buildLogSummary` lasciata nel core\*\* (pura, usata da `resumeSession` e `openLogModal`); il markup `#logModal` resta in `index.html`; tag `<script src="log.js">` aggiunto dopo `admin-ui.js`; `scripts/syntax-check.js` esteso a `log.js`; ramo `role` di `deleteLog` (admin→`renderLogTable`, atleta→`showDash`) invariato. Syntax gate exit 0 + smoke OK incluso il delete da admin (resta nel pannello). `index.html` \~1835 → \~1787 righe. Ordine tag non vincolante (tutte le call cross-file post-load via global scope).

\## ✅ Completati — Estrazione libreria esercizi (15 giugno 2026)

\- \[x] \*\*Estrazione libreria esercizi (`index.html` → `admin-ui.js`) — FATTA (15/06).\*\* Le 5 funzioni (`loadLibrary`/`filterLibrary`/`openExerciseModal`/`saveExercise`/`deleteExercise`) + la var `allExercises` spostate VERBATIM (byte-accurate: preservati gli escape `\\'` negli onclick generati e `è` in `saveExercise`). Il MARKUP (toolbar libreria, modale `exerciseModal`) e gli onclick restano in `index.html`, risolti via global scope post-load (script classici non-module). Unico chiamante esterno (`switchTab` in `admin-ui.js`) ora intra-file. Syntax gate (`node scripts/syntax-check.js` → exit 0) + smoke OK. `index.html` \~1934 → \~1835 righe. Metodo: recon dipendenze read-only → diff → verifica byte → gate.

\## ✅ Completati — Preview locale vercel dev (14 giugno 2026)

&#x20;

\- \[x] \*\*Ambiente di preview locale (`vercel dev`) — ATTIVO (14 giugno 2026).\*\* `vercel dev` gira in locale (Node v24.16.0). Launcher: `.\dev.ps1` dalla root (carica `.env.local` nella shell, poi `vercel dev --listen 3000`). Aggiunto il redirect `http://localhost:3000/\*\*` ai Supabase Redirect URLs (Site URL invariato). Validato end-to-end, inclusa una SESSIONE AI completa in locale.

\- \[x] \*\*406 in console eliminato (`.single()` → `.maybeSingle()`).\*\* Causa: `loadProfile` (index.html) faceva `SELECT profiles ... .single()` che su 0 righe (profilo non ancora creato al primo login) torna 406 da PostgREST. Fix: `.maybeSingle()` su quella query + sulla gemella in `openAthleteProfileModal` (admin-ui.js). Le due `insert().select().single()` (loadProfile branch insert, persistSets) lasciate invariate (lì 0 righe = errore vero). Branch logici invariati. Diagnosi confermata in preview locale (Progressi → query `sessions` a 200, nessun 406). Commit `19774c0`.

\- \[x] \*\*Refresh token / "Sessione scaduta" — retry su 401 (commit `d87ecfe`).\*\* In `aiSend` (index.html), quando `/api/chat` torna 401 il client ora tenta `sb.auth.refreshSession()` e, se ottiene un token nuovo, rifa' la stessa fetch (stesso `chatBody`) UNA volta; la bubble "Sessione scaduta. Esci e rientra" compare solo se anche il retry e' 401 (o il refresh fallisce). Causa: su mobile l'`autoRefreshToken` dell'SDK Supabase viene sospeso quando la tab va in background (schermo bloccato tra i set) → al ritorno l'access token e' scaduto e la prima chiamata falliva. Scope: solo il blocco 401 di `aiSend`; body preservato verbatim; `persistSets`/reader intatti. Smoke test chat OK in locale.

\- \[x] \*\*Rischio gemello refresh token su `persistSets` — FATTO (commit `3088677`).\*\* In `index.html` la scrittura della riga `sessions` è isolata in una nuova helper `persistSetsWrite()` (INSERT 1ª serie / UPDATE successive, ritorna `true`/`false`); su scrittura fallita (error sull'UPDATE o throw di `.single()` sull'INSERT) `persistSets` chiama `sb.auth.refreshSession()` e riprova la scrittura UNA volta. Copre il "rischio gemello" del token scaduto con tab in background su mobile (stesso scenario del fix `aiSend` `d87ecfe`). Il merge in `sessionLog` resta in `persistSets`, fuori da try/catch; la rete `.catch(){}` di `queueAutosave` è invariata. La gemella `adminFetch` è ora FATTA (commit `adfe5cc`, vedi sotto).

\- \[x] \*\*Rischio gemello refresh token su `adminFetch` — FATTO (commit `adfe5cc`).\*\* Correzione dell'imprecisione precedente: NON c'era alcun logout. Oggi su token scaduto `adminFetch` (in `admin-ui.js`) allega comunque il token vecchio, `/api/admin` risponde `401 {error:'Sessione non valida'}` e il call-site fa solo `alert('Errore: Sessione non valida')` e ritorna — azione admin fallita, nessun retry. Il fix isola il retry DENTRO la helper: serializza il body una volta, fa la fetch e su `401` chiama `sb.auth.refreshSession()`; se ottiene un nuovo `access_token` rifà la STESSA fetch (stesso body) UNA volta col token nuovo; ritorna sempre la `Response` non letta → i ~12 call-site restano invariati e ne beneficiano in un punto solo. Se anche il retry è `401` resta l'alert come prima. Stesso scenario di `aiSend` (`d87ecfe`) / `persistSets` (`3088677`): token scaduto da tab in background su mobile.

\## ✅ Completati — Funnel trial 1A COMPLETO + syntax gate + Node locale (13 giugno 2026)

&#x20;

\- \[x] \*\*Funnel trial self-serve via Google (1A) — COMPLETO E VERIFICATO (13 giugno 2026).\*\* Ibrido: entrata self-serve, approvazione spostata alla conversione. Le tre parti residue ora chiuse: (a) template di prova "Prova — Full Body" creato e collaudato (autoregolazione RIR bidirezionale verificata); (b) frontend `index.html` — CTA "Richiedi il coaching" su `trial\_exhausted` (commit `5323bd3`) + auto-assegnazione spostata su \*\*trigger DB\*\* (non più frontend); (c) \*\*Test C live PASSATO\*\* con account Google nuovo (`medicicro@gmail.com`): signup → profilo `pending` → template auto-assegnato → 3 sessioni loggate → Progressi popolati → 403 `trial\_exhausted` → bubble CTA → mailto precompilato con nome+email → conversione admin a `active` → chat ripassa.

\- \[x] \*\*Syntax-check pre-commit hook (commit `d258d6d`).\*\* `scripts/syntax-check.js` (zero dipendenze, `node --check` sui blocchi `<script>` inline di `index.html` + `progress.js` + `admin-ui.js` + `log.js`) + `.githooks/pre-commit` + `git config core.hooksPath .githooks`. Blocca il commit su `SyntaxError` indicando file e riga. Verificato: passa su codice pulito, blocca su riga rotta, gira nel commit reale. Elimina in automatico il rischio "pagina bianca".

\- \[x] \*\*Node.js installato in locale (v24.16.0).\*\* Supera il vecchio vincolo "no local Node". Sblocca `vercel dev` (preview locale) e strumenti E2E futuri.

\## ✅ Completati — Funnel trial 1A: parte SERVER (12 giugno 2026)

&#x20;

\- \[x] \*\*Trigger self-activation gap (era `policies.sql:33`).\*\* `trg\_protect\_profile\_fields` + function `protect\_profile\_fields` (`SECURITY DEFINER`, `search\_path=public`) su `public.profiles`, BEFORE UPDATE: `status` e `role` READ-ONLY per i non-admin (`is distinct from` → `raise exception`); service role e SQL Editor passano (`auth.uid()` null), admin da browser passa. Applicato via SQL Editor, VERIFICATO in produzione 12/06: P0001 sul cambio `status` da atleta; update profilo normale OK; cambio `status` dal pannello admin OK.

\- \[x] \*\*Gate trial in `/api/chat.js`.\*\* `TRIAL\_SESSIONS = 3`. Gate: `active` → passa; `pending` → count(`sessions` per `u.id` del JWT, service role, `HEAD` + `Prefer count=exact` via `Content-Range`) < 3 → passa, altrimenti `403 {"error":"trial\_exhausted"}`; `inactive`/sconosciuto/assente → `403 account\_not\_active` invariato. Fail-closed: count indeterminato → `trial\_exhausted`. La count include le sessioni "Allenamento libero" (semplificazione MVP accettata). \*\*Hardening gate (era TODO): VERIFICATO, zero modifiche\*\* — decisione solo su `u.id` del JWT + profilo via service role, nessun campo del body influenza il gate. Testato in produzione. Modello `claude-sonnet-4-5` invariato.

\- \[x] \*\*Pulizia log `chat.js`.\*\* Rimossi i 3 `console.log` con dati conversazione/profilo (request/messages count, API-key-present, risposta del modello); resta solo `console.log('Error:', err.message)`.

\- \[x] \*\*Fork chiusi 1A + verifiche:\*\* N=3; "sessione consumata" = riga in `sessions`; stato trial = RIUSO di `pending` (conversione admin → `active`). Verificato live anche il blocco `inactive` al login.

\## ✅ Completati — Motore maxout/misto + fix bug admin (11 giugno 2026)

&#x20;

\- \[x] \*\*Motore-prompt — casi maxout/misto MIGRATI (chiude la migrazione: tutti i 9 programmi sul motore).\*\* Approccio MVP "override testuale con precedenza", tutto Supabase (Table Editor + editTemplate + "Applica a tutti"), zero codice, zero deploy.

&#x20; - \*\*(1) Blocco "PRECEDENZA — FILOSOFIA DI PROGRAMMA"\*\* aggiunto a `coach\_prompt\_global`: i coach\_rules che dichiarano una FILOSOFIA propria (maxout, mista) prevalgono sui punti in conflitto; il resto resta regolato dal motore.

&#x20; - \*\*(2) Coach\_rules di NEW WORKOUT riscritti SNELLI:\*\* FILOSOFIA MAXOUT (cedimento sempre; RIR 0 = obiettivo, mai "fermati prima"; RIR ≥2 → richiamo al maxout), SCHEMA PESO Set1 (ced.\~10, l'atleta TROVA il peso, niente annuncio) / Set2 (−20/25%), lettura CSV "10 / 13-15" (target Set1/Set2), Note = VARIANTI non peso, checklist warm-up Push/Pull/Legs (contenuto; meccanica `\[PRONTO]` dal motore), milestone Fase 1.

&#x20; - \*\*(3) Coach\_rules di MUSCLE-UP PRO riscritti SNELLI:\*\* FILOSOFIA MISTA ("con peso" per-esercizio: promemoria zavorra + peso accettato nel feedback), ISOMETRICI ("tieni Ns", NIENTE RIR sulle tenute, conteggio set esplicito: Set N < TOT → STESSO esercizio Set N+1), LEVE DI DIFFICOLTÀ skill (ordine: riduci assistenza → eccentrica 3-4s → variante più dura; scopo = CENTRARE il target del set, la progressione tra sessioni la decide il coach; sostituzioni improvvisate accettate senza pignolerie), lettura CSV (set esatti, recupero min→mm:ss).

&#x20; - \*\*(4) Rimossi da entrambi i protocolli ZOMBIE\*\* "REGOLA FINE" + "WORKOUT LOG" (morti dal redesign Stage 3; il motore già li vieta) e i duplicati del motore (inizio sessione, formato output, struttura risposta, RIR opzionale). Rimosso da MUP il "parti immediatamente con Set 1" (vince il warm-up obbligatorio del motore).

&#x20; - \*\*Test "Prova" passati:\*\* NW: warm-up checklist + `\[PRONTO]`; RIR 0 a target → "A target." (NON "fermati 1-2 reps prima"); RIR 3 → richiamo maxout; intro "trova un peso che ti porta a cedimento \~10". MUP: tetto del range → successo; sforamento vero → leva assistenza/eccentrica con formulazione variata; "Prossimo: Weighted Pull-Up. Aggiungi peso." sul misto; conteggio set isometrici corretto dopo il fix.

&#x20; - \*\*Costi API:\*\* motore +\~250 token ma nel blocco CACHATO (Leva 2, \~10% del prezzo); coach\_rules MUP/NW molto dimagriti nel blocco NON cachato → sessioni MUP/NW più economiche di prima. Motore sempre > 1.024 token (cache attiva).

\- \[x] \*\*Motore — "VALUTAZIONE DEL RANGE" + anti-fotocopia\*\* (in `coach\_prompt\_global`, subito dopo gli schemi FEEDBACK): reps dentro il range, ESTREMI INCLUSI = target rispettato; il TETTO del range (es. 12 su 8-12) è un SUCCESSO, non uno sforamento; "sopra il range" = SOLO oltre il tetto; gli schemi sono esempi di CONTENUTO, non frasi da copiare alla lettera (vietata la frase identica su esercizi/set diversi). Fix nato da test reali su MUP (errore fattuale sul tetto + frase fotocopia del delta bodyweight ripetuta verbatim) — vale per TUTTI i programmi.

\- \[x] \*\*Correzione doc — regola "autoregolazione reattiva sì / progressione proattiva no":\*\* verificato il testo completo di `coach\_prompt\_global` — la regola NON esiste come blocco dedicato; è espressa NEGLI SCHEMI FEEDBACK del motore (global + delta gym/bodyweight: "sali di peso" / "variante" servono a CENTRARE il target del set corrente = autoregolazione reattiva). L'override maxout passa dal blocco PRECEDENZA. Doc allineati.

\- \[x] \*\*\[BUG] Admin → cancellazione sessione rimanda alla dashboard atleta — RISOLTO\*\* (commit `7f8315d`). `deleteLog` ora ramifica su `currentProfile.role==='admin'`: admin → solo `renderLogTable()` (resta su `adminScreen`, riga rimossa dalla tabella); atleta → `showDash()` come prima (rimosso il `renderLogTable` ridondante del ramo atleta, che scriveva su markup admin invisibile). Solo `index.html`, un handler. Verificato in produzione su entrambi i flussi.

\- \[x] \*\*\[OPS] Cache DNS post-sospensione ICANN (11/06).\*\* A riattivazione Namecheap AVVENUTA, il resolver locale (router/ISP) può continuare a servire l'IP del PARKING Namecheap (198.54.117.x) fino a scadenza TTL → `ERR\_CONNECTION\_REFUSED` anche a dominio sano (e anche da mobile se sotto lo stesso WiFi / carrier con cache stale). \*\*Diagnosi:\*\* doppio `nslookup` — resolver locale vs `8.8.8.8`; se Google risolve l'IP Vercel (es. 216.198.79.1), il dominio è ok ed è solo cache. \*\*Bypass sempre disponibile:\*\* URL `\*.vercel.app` (stesso deployment). Workaround locale: DNS manuale 8.8.8.8 (da GUI; il cmdlet PowerShell richiede finestra amministratore vera). NON aprire ticket a Namecheap in questo scenario.

\## ✅ Completati — Refactor fase 1 + RIR gym (10 giugno 2026)

&#x20;

\- \[x] \*\*Gate di sintassi pre-deploy\*\* — sezione in CLAUDE.md: prima di ogni push frontend, `index.html` aperto in Chrome incognito + console (F12) → nessun `Uncaught SyntaxError`, nessun 404 sui file esterni → safe to push. Zero-install. Elimina la causa #1 della pagina bianca; gli errori runtime dentro flussi specifici restano da verificare in produzione.

\- \[x] \*\*Stage 0 — `styles.css`\*\* — blocco `<style>` (181 righe) estratto verbatim; `<link rel="stylesheet">` nello stesso punto del `<head>`. Commit `80cb4af`. Verificato in produzione (render identico).

\- \[x] \*\*Stage 1 — `progress.js`\*\* — area Progressi/grafici (stato co-locato + 10 funzioni; 314 righe). Recon: area FOGLIA, nessun chiamante JS esterno; aggancio solo via onclick/onchange del markup → script classico non-module. Nota: la sequenza `\\u2014` dell'originale è resa col carattere `—` letterale (runtime identico). Commit `2a76f54`. Test funzionale in produzione OK.

\- \[x] \*\*Stage 2 — `admin-ui.js`\*\* — admin panel (19 funzioni) + template (7 funzioni + `editingTemplateId`/`assigningTemplateId`) + `startTestSession` (333 righe, verbatim byte-accurate: 36 `\\'` preservati). 3 punti di contatto cross-file via global scope: `handleSession→showAdmin`, `showDash→renderTemplates`, `deleteLog→renderLogTable`. ⚠️ `admin-ui.js` (frontend, root) ≠ `api/admin.js` (serverless). Test funzionale in produzione OK incluso il giro "Prova" → "Torna" → tab Template.

\- \[x] \*\*RIR target gym applicati\*\* — 741 Fitness, POOL DANGER HYPERTROPHY, Bro split: riga `Intensità target: RIR \~3...` nei `coach\_rules` dei TEMPLATE → "Prova" → "Applica a tutti". Nessun codice, nessun deploy. Con BBR (già fatto) il task RIR per-programma è CHIUSO.

\- \[x] \*\*\[OPS] Dominio ailistenics.com sospeso e riattivato (10/06)\*\* — sospensione per verifica contatti ICANN non completata (mail Namecheap del 07/06, deadline 10/06) → `ERR\_CONNECTION\_REFUSED` intermittente su tutti i dispositivi. Verifica completata (anche per `calislackline.com`) → riattivato. Lezione: quelle mail Namecheap "Action required: Verify your contact information" hanno una deadline reale; l'app su `\*.vercel.app` resta sempre raggiungibile come bypass diagnostico. \*\*Vedi anche \[OPS] 11/06: la cache DNS può prolungare il disservizio LOCALE oltre la riattivazione.\*\*

\## ✅ Completati — Test session admin + warm-up obbligatorio (giugno 2026)

&#x20;

\- \[x] \*\*Test sessione AI Coach dall'account ADMIN ("Prova").\*\* Bottone "Prova" sulla card di ogni template (`renderTemplates`). `startTestSession(templateId)`: profilo NEUTRO `{ \_isDemo:true, \_orig:<admin> }`, poi `startSessionWithPrompt(...)` → riusa il path demo (non-persist) + l'intera macchina sessione. Guard su `workout\_csv` (NON sui coach\_rules). `\_isDemo` fa saltare `persistSets`; profilo neutro → `buildAthleteContext` vuoto. Flag globale `var testSession=false;`; ramo in `showDash` che, se `testSession`, ripristina `\_orig` e torna ad `adminScreen` tab Template (id `atabTemplates`). \*\*Prerequisito:\*\* admin con `profiles.status='active'`.

\- \[x] \*\*Warm-up OBBLIGATORIO nel motore.\*\* `coach\_prompt\_global`: warm-up obbligatorio a ogni avvio sessione (dal CSV se c'è la riga, altrimenti generato), chiuso con `\[PRONTO]`, nessun `\[SET:]` prima del "pronto". \*\*Eccezione ripresa:\*\* su "Bentornato" NON rifare il riscaldamento. Editato dal Table Editor, nessun deploy. Validato in produzione.

\- \[x] \*\*Chiarimento meccanismo demo (documentazione).\*\* `startDemoSession`/`\_isDemo`/`\_orig` + guardia in `persistSets` + restore in `showDash` sono \*\*VIVI\*\* (onboarding/dashboard), NON rimossi. La test session ci si appoggia (alla PRIMITIVA di non-persistenza, non al flow onboarding).

\## ✅ Completati — Sistema template + Leva 2 (giugno 2026)

&#x20;

\- \[x] \*\*Leva 2 — Prompt caching\*\* — `/api/chat.js`: `system` come ARRAY di blocchi; `cache\_control: { type:'ephemeral' }` sul blocco del MOTORE, `body.system` come secondo blocco. Fallback a stringa se `motor` vuoto. Motore > minimo 1.024 token. \~90% di taglio sulla porzione ripetuta. Commit `ee173c7`.

\- \[x] \*\*Tabella `program\_templates` + `programs.template\_id`\*\* — libreria + FK ON DELETE SET NULL. RLS 4 policy admin-only.

\- \[x] \*\*Action template in `admin.js`\*\* — `addTemplate`, `editTemplate`, `removeTemplate` (`96cfb1c`); `assignTemplate`, `repushTemplate` (`a27efe2`). Liste lette frontend-diretto via SDK.

\- \[x] \*\*UI tab Template\*\* — `#tab-templates` + `#templateList`; modal `#templateFormModal`; hook switchTab (`f096127`). Bottoni "Assegna"/"Applica a tutti" (`410a8ae`). Riga "Assegnato a:" (`0e2f542`).

\- \[x] \*\*Migrazione programmi esistenti → template\*\* — collegamento in-place via SQL, id/storico/ripresa preservati. 9 template. BBR uniformato.

\- \[x] \*\*Fix `repushTemplate` — rimosso `workouts`\*\* — `74b72bd`.

\## ✅ Completati — Session screen UI (giugno 2026)

&#x20;

\- \[x] \*\*Anti-zoom input mobile\*\* — `#sessionScreen input, #sessionScreen textarea { font-size:16px !important; }`. `6e78978`.

\- \[x] \*\*Peso inline con reps/RIR\*\* — `#weightRow` nella stessa riga (flex 1:1:1); peso solo se gym, a destra. `6e78978`.

\- \[x] \*\*Tastiera numerica reps/RIR\*\* — `inputmode="numeric"`; peso `inputmode="decimal"`.

\- \[x] \*\*Allineamento label dei 3 box\*\* — `min-height:30px` + flex.

\- \[x] \*\*Ordine box\*\* — `\[ Reps ] \[ RIR ] \[ Peso ]`.

\## ✅ Completati — Motore-prompt + target box (giugno 2026)

&#x20;

\- \[x] \*\*Motore-prompt base (per-tipo)\*\* — tabella `settings` (`coach\_prompt\_global` + delta gym/bodyweight). `/api/chat.js` legge comune + delta (typeKey HARDCODED) e li antepone a `body.system`; fallback non bloccante. `index.html` invia `session\_type`. `ab18084`.

\- \[x] \*\*Target box per tipo\*\* — gym → PESO (col Note), bodyweight → Tempo. `f1d4245`.

\- \[x] \*\*Migrazione coach\_rules programmi PURI\*\* — BBR, Petra, Cate. (Muscle-Up Pro e New Workout migrati l'11 giugno 2026, vedi sopra.)

\## ✅ Completati — Stage 2 (lista tappabile) + fix giugno 2026

&#x20;

\- \[x] \*\*Stage 2 — lista esercizi tappabile\*\* — `selectExercise(name)`; `sendMsg` antepone "Esercizio: <nome>".

\- \[x] \*\*setNum deterministico (`nextSetNum`)\*\* — il frontend possiede il setNum su tap E tag AI.

\- \[x] \*\*Warm-up non-tappabile\*\* — rilevamento `/riscald|warm/i` su Note.

\- \[x] \*\*Fix login OAuth PKCE\*\* — `detectSessionInUrl: true → false`.

\- \[x] \*\*Rimozione bottone skip\*\* — rimossi bottone + `qSend` + `buildSkipMessage`.

\## ✅ Completati — Stage 3 (redesign sessione) + cleanup

&#x20;

\- \[x] Salvataggio sessione PER-SERIE in `sessions.log\_data`.

\- \[x] Rimosso bottone "fine" + log dall'AI; chiusura con "Torna".

\- \[x] Rimosso bottone "recap"; history troncata a 12.

\- \[x] RIR / Fatica opzionali (`null` se non dichiarati).

\- \[x] Ripresa esplicita "Riprendi allenamento" (`resumeSession`).

\- \[x] Rimozione `session\_drafts` (tabella + 4 funzioni).

\- \[x] Fix login preview Vercel (`redirectTo` su origin).

\## ✅ Completati — precedenti

&#x20;

\- \[x] RLS Supabase su tutte le tabelle; fix privilege-escalation su `profiles`

\- \[x] Pending-gate `/api/chat.js` + auth gate JWT

\- \[x] Auth gate `/api/admin.js`

\- \[x] Auth Google OAuth (PKCE) + email/password (⚠️ reset password ROTTO — correzione giugno 2026, vedi 🟡 1B)

\- \[x] Dashboard atleta; AI Coach session (chat, timer, RPE, reps/RIR, superset)

\- \[x] Admin panel (atleti, log, libreria 49+)

\- \[x] Onboarding form → email Apps Script

\- \[x] Profilo atleta modificabile

\- \[x] log\_data per-set; Schermata Progressi; session\_type; tracking peso

\- \[x] Generatore prompt AI rimosso; CUE tecnica rimossa

\- \[x] Ottimizzazione costi (troncamento history, no storico, athleteContext solo primo turno)

\- \[x] Leva 1 — Filtro workout\_csv multi-workout (picker pre-chat)

\- \[x] Setup Claude Code + git

\---

&#x20;

\## Collegamenti / note (per non duplicare)

\- \*\*🗺️ SEQUENZA DI ESECUZIONE DECISA (16/06):\*\* (1) PACCHETTO landing+hero + profilo SLIM + layer privacy (rischio basso, NESSUNA dipendenza email) → solo-Google, col bottone "Crea account con email" nascosto/disabilitato finché l'OTP non è pronto (niente porta morta). (2) Flusso OTP email (1B) DOPO aver scelto e configurato il provider (Resend). In PARALLELO: la \*\*conversione MANUALE\*\* dei primi 1-3 trialist gira da subito e fa da \*\*GATE a Stripe\*\* (no Stripe prima del primo pagante a mano). \*\*🗺️ AGGIORNAMENTO 17/06:\*\* il pacchetto landing/privacy è QUASI CHIUSO — fatti Step 1 (pagine legali, `41e1b6d`), Step 2 (footer consenso, `304c891`), Step 3b (email/password + "Password dimenticata?" nascosti, login solo-Google, `a36d365`). \*\*🗺️ AGGIORNAMENTO 24/06: Step 4 (profilo SLIM) ✅ CHIUSO\*\* — la verifica sul codice ha trovato che è GIÀ implementato (form self-serve `profileScreen` = solo nickname; form completo = questionario di conversione in `onboardScreen`). \*\*Unico residuo pre-lancio del pacchetto landing/privacy = compilare i placeholder `[DATA]`/`[EMAIL-CONTATTO]` in `privacy.html`/`termini.html`.\*\* Sequenza aggiornata: (a) compila i placeholder legali → (b) \*\*lancio MVP italiano\*\* → (c) \*\*fase i18n\*\* (IT/EN/DE, STRADA A, prioritaria; ci sta dentro l'hero elaborato) → (d) \*\*OTP email\*\* come fase a sé (\*\*gate: scelta/config del provider transazionale, Resend\*\*).

\- \*\*💡 Idee strategiche\*\*: parcheggio NON operativo — elastici (livelli=colori fisici, assist/resist DA DECIDERE), inVictus, rebranding (CHIUSO 16/06: AILISTENICS confermato, COAICH scartato), workflow source-unico (ponte git), avatar coach. Si promuovono solo con decisione esplicita.

\- \*\*Funnel trial (1A) — ✅ COMPLETO E LIVE (13/06)\*\*: fork "self-serve vs approvazione admin" CHIUSO (IBRIDO). \*\*✅ FORK CHIUSI (12/06):\*\* N=3 (`TRIAL\_SESSIONS`); "sessione consumata" = riga in `sessions`; stato trial = RIUSO di `pending`. NON usa `\_isDemo` (le sessioni trial PERSISTONO). Parte SERVER (12/06) + le 3 parti residue ora chiuse: template di prova "Prova — Full Body", CTA `trial\_exhausted` (commit `5323bd3`), auto-assegnazione via \*\*trigger DB\*\* (`trg\_assign\_trial\_program`, non frontend). Verificato end-to-end (Test C, account Google nuovo). Lancio SOLO-GOOGLE; email/password = 1B (🟡).

\- \*\*Aggregatore compatto\*\* (1 riga/esercizio) è CONDIVISO tra "Mail resoconto AI" (🟡) e "Analisi AI progressioni" (🟢 GATED): si costruisce UNA volta. La mail è il banco di prova a basso rischio della periodizzazione (comunica, non applica).

\- \*\*Cron Vercel\*\* unico CONDIVISO tra "Notifica reminder" (🔴) e "Mail resoconto AI" (🟡): per ogni atleta decide reminder o resoconto. \*\*Provider email transazionale\*\* CONDIVISO con "Dominio email personalizzato" (🟢, gated rebranding).

\- \*\*Apps Script è in via di smontaggio\*\* (overhaul 🟡): NON costruirci sopra nuove feature; la dipendenza Gemini API è ora documentata in ARCHITECTURE; candidato sostituzione → Anthropic.

\- \*\*Logo/icona (🟡) = PASSO 1; PWA (🟢) = PASSO 2\*\* → Distribuzione app store (🟢 GATED). Il favicon (🟢) si chiude col passo 1.

\- \*\*Motore maxout/misto: FATTO\*\* — meccanismo = blocco PRECEDENZA + override di filosofia nei coach\_rules. È il punto dove si aggancia la filosofia del \*\*descrittore per-esercizio\*\* e (futuro) degli \*\*elastici\*\* (💡). Lato MUP restano i task UI (peso per-esercizio, isometrici): il lato PROMPT è già coperto.

\- \*\*RIR target per-programma\*\*: FATTO su tutti (BBR 0-3, gym \~3, maxout 0-1 via filosofia NW).

\- \*\*Refactor monolite\*\*: FASE 1 FATTA, fermato per decisione. Core sessione AI NON si estrae; estrazioni residue opzionali in 🟢.

\- \*\*Progressione programma\*\* (🟡 Media-Alta) è la SPINA DORSALE → collega "Multi-fase programmi", "Sblocco skill ad albero", "Fine sessione chiara", template. Fork aperto: carichi-nel-CSV vs auto-progressione.

\- \*\*Conteggio set X/Y\*\* + \*\*Fine sessione chiara\*\* ALIMENTANO "Progressione programma" (e la variante avanzata di "sessione consumata" del trial).

\- \*\*Peso per-esercizio\*\* = ✅ SHIPPED via colonna CSV `peso` (`weighted` per-esercizio, `currentWeighted`); `session\_type` ora ristretto al motore + DB. \*\*Resta\*\* il lato \*\*Logging isometrici\*\* (metric=time) del \*\*descrittore per-esercizio\*\*; il motore resta separato. Segue la \*\*migrazione colonna `peso`\*\* (🔴, gym pending) e abilita il \*\*prompt unico per-esercizio\*\* (💡).

\- \*\*Esercizio a tempo / isometrici\*\* (spec unificata: fonde i vecchi "Logging isometrici" + "Timer esercizio a tempo") = ✅ SHIPPED (giugno 2026), insieme al fix \*\*Timer recupero background\*\* (motore-timer unico a `Date.now()`, base condivisa col cronometro tenute). Stessa lezione del timer \*\*Breathwork\*\*.

\- \*\*Editor tabellare\*\* (🟡, ALZATO) è il PREREQUISITO del meccanismo di apply di \*\*Analisi AI progressioni\*\* (round-trip parse↔serialize = superficie di apply sicura).

\- \*\*Analisi AI progressioni\*\* (🟢 GATED) applica PER-ATLETA (copia, non template). Fork aperto: template-tiene-struttura vs carichi-personalizzati-su-copia.

\- \*\*Test session admin\*\* ("Prova") FATTO — si appoggia alla primitiva demo (`\_isDemo`). Il trial funnel (1A) NON la usa: persiste.

\- \*\*Breathwork\*\* (🟡) è frontend-only, NIENTE backend/DB/API. v2 e pranayama in 🟢.

\- \*\*Allenamento libero\*\* (🟡, log manuale) ≠ \*\*Opzione 4\*\* (🟢, l'AI genera). TENERLE SEPARATE.

\- \*\*skip\*\*, \*\*session\_drafts\*\*, \*\*Generatore prompt AI\*\*, \*\*CUE tecnica\*\*, \*\*REGOLA FINE / WORKOUT LOG nei coach\_rules\*\* RIMOSSI — non reintrodurli. La sessione demo (`\_isDemo`) NON è rimossa — è viva.

\- \*\*✅ Check coerenza doc↔repo (giugno 2026) FATTO — 31/36 OK.\*\* Residuo (a) \*\*`console.log` in `chat.js`\*\* → ✅ CHIUSO (12/06): rimossi i 3 con dati conversazione/profilo, resta solo `console.log('Error:', err.message)`. Residuo (b) \*\*`workouts` in `api/admin.js`\*\* → ✅ RISOLTO (14/06, commit `2618335`): NON era solo la destrutturazione morta in `repushTemplate` (\~riga 176) — c'erano anche 5 WRITER LIVE (`addProgram`/`editProgram`/`addTemplate`/`editTemplate`/`assignTemplate`) che scrivevano `workouts` nel DB, più 6 payload lato `admin-ui.js`. Tutto rimosso dal codice (Tempo 1). \*\*Tempo 2 — DROP colonna DB eseguito a mano nel SQL Editor (14/06):\*\* `workouts` rimossa da `programs` e `program\_templates` → voce CHIUSA.

\- \*\*Note 1A (13/06):\*\* sul `403 trial\_exhausted` il frontend ora mostra la CTA dedicata "Richiedi il coaching" (commit `5323bd3`; mailto a `calislackline@gmail.com` con nome+email precompilati) — non più l'errore generico. `admin-ui.js` su `401` fa alert generico "Sessione non valida" + logout al refresh token scaduto → robustezza/UX (voce 🟢, non sicurezza). Il client Supabase frontend si chiama `sb` (utile in console per i test).

&#x20;

