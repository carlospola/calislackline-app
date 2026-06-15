// e2e/scripts/validate-seed.js
// Smoke di validazione del modulo seed/teardown (e2e/lib/db.js) CONTRO il DB reale.
// Esecuzione manuale: `node scripts/validate-seed.js` da dentro e2e/.
// Non viene wire-ato in Playwright; serve a validare seed/teardown in isolamento.
// NON stampa mai password ne' secret.
//
// Flusso: preSweep -> createTrialist -> assert programma "Prova — Full Body"
//   -> seedExhaustedSessions -> assert countSessions === 3 -> (finally) teardown
//   -> best-effort assert "clean" (programma vuoto + countSessions === 0).

const db = require('../lib/db');

const results = [];
function check(name, cond) {
  results.push({ name: name, pass: !!cond });
  console.log((cond ? 'PASS' : 'FAIL') + ' — ' + name);
}

async function main() {
  let user = null;
  try {
    const swept = await db.preSweep();
    console.log('preSweep: ripuliti ' + swept + ' utenti di test residui.');

    user = await db.createTrialist();
    console.log('createTrialist: creato utente di test (id ' + user.userId + ').');

    const prog = await db.getAssignedProgram(user.userId);
    check('programma trial assegnato esiste', !!prog);
    check(
      'program_name === "' + db.TRIAL_PROGRAM_NAME + '"',
      prog && prog.program_name === db.TRIAL_PROGRAM_NAME
    );

    if (prog) {
      const ids = await db.seedExhaustedSessions(user.userId, prog.id);
      console.log('seedExhaustedSessions: inserite ' + ids.length + ' righe.');
      const n = await db.countSessions(user.userId);
      check('countSessions === 3 dopo seed', n === 3);
    } else {
      check('countSessions === 3 dopo seed', false);
    }
  } finally {
    if (user) {
      await db.teardown(user.userId, user.email);
      console.log('teardown completato.');

      // best-effort: il teardown ha davvero ripulito?
      try {
        const progAfter = await db.getAssignedProgram(user.userId);
        check('clean: nessun programma dopo teardown', !progAfter);
        const nAfter = await db.countSessions(user.userId);
        check('clean: countSessions === 0 dopo teardown', nAfter === 0);
      } catch (e) {
        check('clean: verifica post-teardown senza errori', false);
        console.log('verifica clean fallita: ' + e.message);
      }
    }
  }

  const failed = results.filter(function (r) { return !r.pass; });
  console.log('');
  console.log('Riepilogo: ' + (results.length - failed.length) + '/' + results.length + ' PASS.');
  if (failed.length) {
    console.log('FALLITI: ' + failed.map(function (r) { return r.name; }).join('; '));
    process.exit(1);
  }
}

main().catch(function (e) {
  console.log('ERRORE non gestito: ' + e.message);
  process.exit(1);
});
