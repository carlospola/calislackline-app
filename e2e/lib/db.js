// e2e/lib/db.js
// Modulo seed/teardown per l'E2E del funnel trial. CommonJS, eseguito con Node.
// Usa la SERVICE ROLE (bypassa RLS) e opera SOLO su email di test riservate
// (RESERVED_RE). Ogni delete passa per assertTestEmail come safety-net.
//
// RECON colonne (da index.html persistSetsWrite, riga ~1249):
//   sessions INSERT app: { user_id, workout_name, log_data }  (+ id/created_at default DB)
//   -> owner column su sessions = user_id ; NON esiste program_id su sessions
//      (il riferimento al programma vive DENTRO log_data.programId).
//   programs: owner = user_id ; nome programma = program_name ; + template_id
//
// NB: non stampa MAI valori di secret/password.

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '.env.local'), quiet: true });

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  throw new Error('Manca NEXT_PUBLIC_SUPABASE_URL in .env.local (valore non stampato).');
}
if (!SERVICE_KEY) {
  throw new Error('Manca SUPABASE_SERVICE_ROLE_KEY in .env.local (valore non stampato).');
}

// Client admin (service role) — niente sessione persistita lato modulo.
const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Nome esatto del template trial auto-assegnato dal trigger DB (em-dash U+2014).
const TRIAL_PROGRAM_NAME = 'Prova — Full Body';

// Solo email di test riservate: e2e+<qualcosa>@ailistenics.test
const RESERVED_RE = /^e2e\+[^@]+@ailistenics\.test$/;

function assertTestEmail(email) {
  if (typeof email !== 'string' || !RESERVED_RE.test(email)) {
    throw new Error('Refusing to operate on non-test email');
  }
}

function randomPassword() {
  // password lunga e casuale; non viene mai stampata.
  return 'E2e!' + crypto.randomBytes(24).toString('hex') + '#Aa9';
}

// Crea un trialist: utente auth confermato + riga profiles (athlete/pending).
// Il trigger DB trg_assign_trial_program scatta sull'INSERT in profiles e
// auto-assegna il template "Prova — Full Body".
async function createTrialist() {
  const email = 'e2e+' + Date.now() + '@ailistenics.test';
  const password = randomPassword();

  const cu = await admin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true
  });
  if (cu.error) {
    // Non ripiegare in silenzio: se il dominio .test viene rifiutato, riportalo.
    throw new Error('createUser ha rifiutato (email ' + email + '): ' + cu.error.message);
  }
  const userId = cu.data && cu.data.user && cu.data.user.id;
  if (!userId) {
    throw new Error('createUser non ha restituito un user id per ' + email);
  }

  const ip = await admin.from('profiles').insert({
    id: userId,
    email: email,
    name: 'E2E Trial',
    role: 'athlete',
    status: 'pending'
  });
  if (ip.error) {
    throw new Error('insert profiles fallito per ' + email + ': ' + ip.error.message);
  }

  return { userId: userId, email: email, password: password };
}

// Ritorna la riga del programma assegnato all'utente (per l'assert "Prova — Full Body").
// owner column su programs = user_id. Ritorna la prima riga (o null).
async function getAssignedProgram(userId) {
  const r = await admin
    .from('programs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (r.error) {
    throw new Error('select programs fallito per ' + userId + ': ' + r.error.message);
  }
  return (r.data && r.data[0]) || null;
}

// Inserisce 3 sessioni "vecchie" (created_at = 25h fa) cosi' il gate trial le conta
// tutte (la finestra "Riprendi" sottrae solo la piu' recente se < 24h).
// sessions NON ha una colonna program_id: programId va dentro log_data.
// Ritorna gli id inseriti.
async function seedExhaustedSessions(userId, programId) {
  const oldIso = new Date(Date.now() - 25 * 3600 * 1000).toISOString();
  const rows = [];
  for (let i = 0; i < 3; i++) {
    rows.push({
      user_id: userId,
      workout_name: 'E2E seeded ' + (i + 1),
      log_data: { workout: 'E2E', programId: programId || null, chosenWorkout: null, exercises: [] },
      created_at: oldIso
    });
  }
  const r = await admin.from('sessions').insert(rows).select('id');
  if (r.error) {
    throw new Error('insert sessions (seed) fallito per ' + userId + ': ' + r.error.message);
  }
  return (r.data || []).map(function (x) { return x.id; });
}

// Conta le righe sessions dell'utente (count exact, senza scaricare i dati).
async function countSessions(userId) {
  const r = await admin
    .from('sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (r.error) {
    throw new Error('count sessions fallito per ' + userId + ': ' + r.error.message);
  }
  return r.count || 0;
}

// Teardown idempotente: assertTestEmail PRIMA di tutto, poi delete in ordine
// sessions -> programs -> profiles -> auth user.
async function teardown(userId, email) {
  assertTestEmail(email);

  if (userId) {
    const ds = await admin.from('sessions').delete().eq('user_id', userId);
    if (ds.error) throw new Error('delete sessions fallito: ' + ds.error.message);

    const dp = await admin.from('programs').delete().eq('user_id', userId);
    if (dp.error) throw new Error('delete programs fallito: ' + dp.error.message);

    const dpr = await admin.from('profiles').delete().eq('id', userId);
    if (dpr.error) throw new Error('delete profiles fallito: ' + dpr.error.message);

    const du = await admin.auth.admin.deleteUser(userId);
    // deleteUser su utente gia' assente puo' dare errore "not found": idempotente, lo ignoriamo.
    if (du.error && !/not.?found/i.test(du.error.message || '')) {
      throw new Error('deleteUser fallito: ' + du.error.message);
    }
  }
}

// Ripulisce run crashati: lista gli utenti auth, filtra SOLO le email riservate
// (RESERVED_RE) e fa teardown di ciascuna. Itera le pagine di listUsers.
async function preSweep() {
  const perPage = 200;
  let page = 1;
  let swept = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const lu = await admin.auth.admin.listUsers({ page: page, perPage: perPage });
    if (lu.error) {
      throw new Error('listUsers fallito (page ' + page + '): ' + lu.error.message);
    }
    const users = (lu.data && lu.data.users) || [];
    for (const u of users) {
      if (u && u.email && RESERVED_RE.test(u.email)) {
        await teardown(u.id, u.email);
        swept++;
      }
    }
    if (users.length < perPage) break;
    page++;
  }
  return swept;
}

// Login programmatico come utente (client ANON, niente sessione persistita).
// Ritorna { access_token, refresh_token } per iniettare la sessione nel browser
// dell'E2E via window.sb.auth.setSession. NON logga MAI i token.
async function signInAsUser(email, password) {
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );
  const r = await anon.auth.signInWithPassword({ email: email, password: password });
  if (r.error || !(r.data && r.data.session)) {
    throw new Error('signInAsUser fallito: ' + (r.error && r.error.message));
  }
  return {
    access_token: r.data.session.access_token,
    refresh_token: r.data.session.refresh_token
  };
}

module.exports = {
  admin: admin,
  RESERVED_RE: RESERVED_RE,
  TRIAL_PROGRAM_NAME: TRIAL_PROGRAM_NAME,
  assertTestEmail: assertTestEmail,
  createTrialist: createTrialist,
  getAssignedProgram: getAssignedProgram,
  seedExhaustedSessions: seedExhaustedSessions,
  countSessions: countSessions,
  teardown: teardown,
  preSweep: preSweep,
  signInAsUser: signInAsUser
};
