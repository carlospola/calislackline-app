// e2e/scripts/probe-auth.js
// PROBE: verifica che un trialist creato via service-role possa loggarsi con
// signInWithPassword sul client ANON (precondizione per l'iniezione sessione
// nell'E2E). Crea + seed via db.js, poi teardown. NON stampa MAI token/password.

const db = require('../lib/db'); // require carica dotenv (env gia' disponibile)
const { createClient } = require('@supabase/supabase-js');

const anon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

async function main() {
  let user = null;
  try {
    await db.preSweep();
    user = await db.createTrialist();

    const r = await anon.auth.signInWithPassword({ email: user.email, password: user.password });
    const ok = !r.error && !!(r.data && r.data.session && r.data.session.access_token);
    console.log('signInWithPassword ok:', ok);
    if (r.error) console.log('error code/msg:', r.error.status, r.error.message);
    console.log('ha refresh_token:', !!(r.data && r.data.session && r.data.session.refresh_token));
  } finally {
    if (user) {
      await db.teardown(user.userId, user.email);
      console.log('teardown ok');
    }
  }
}

main().catch(function (e) {
  console.log('ERRORE non gestito:', e.message);
  process.exit(1);
});
