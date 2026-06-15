// e2e/specs/trial-funnel.spec.js
// E2E del funnel trial: un trialist che ha gia' "consumato" 3 sessioni, al 4o
// avvio riceve 403 trial_exhausted da /api/chat e vede la CTA "Richiedi il coaching".
//
// Prereq: dev server su http://localhost:3000 (vercel dev via .\dev.ps1) — la config
// non lo avvia (baseURL gia' impostata). Gira sul DB Supabase REALE: seed+teardown
// sono isolati su email riservate (vedi e2e/lib/db.js). NON stampa token/password.
//
// RECON (index.html):
//  - dashboard programmi: ogni programma e' una .program-item con .program-item-name
//    (= "Prova — Full Body") e un bottone .program-start-btn ("Inizia →") il cui
//    onclick chiama startSessionWithPrompt(...) (index.html ~921-922).
//  - "Prova — Full Body" e' a workout singolo (orderedWorkouts.length < 2) -> niente
//    picker: startSessionWithPrompt va dritto a beginSession -> aiSend -> POST /api/chat
//    (index.html ~966-975).
//  - window.sb e' globale (var sb top-level, index.html ~720); al load init() fa
//    getSession() -> handleSession -> loadProfile -> showDash (#dashScreen attivo).

const { test, expect } = require('@playwright/test');
const db = require('../lib/db');

test.describe('Trial funnel — gate esaurimento', () => {
  let user = null;
  let session = null;
  let program = null;

  test.beforeAll(async () => {
    await db.preSweep();
    user = await db.createTrialist();
    program = await db.getAssignedProgram(user.userId);
    if (!program) throw new Error('trigger non ha assegnato il programma trial');
    session = await db.signInAsUser(user.email, user.password);
    await db.seedExhaustedSessions(user.userId, program.id);
  });

  test.afterAll(async () => {
    if (user) await db.teardown(user.userId, user.email);
  });

  test('4o avvio -> 403 trial_exhausted + CTA', async ({ page }) => {
    test.setTimeout(30000);

    // 1) carica l'app e attendi che il client Supabase globale sia pronto
    await page.goto('/');
    await page.waitForFunction(() => typeof window.sb !== 'undefined' && !!window.sb.auth);

    // 2) inietta la sessione del trialist (bypassa la UI Google), poi ricarica
    await page.evaluate(async (s) => {
      await window.sb.auth.setSession({ access_token: s.at, refresh_token: s.rt });
    }, { at: session.access_token, rt: session.refresh_token });
    await page.reload();

    // 3) dashboard del trialist pronto: nome programma + bottone "Inizia"
    await expect(page.locator('.program-item-name', { hasText: db.TRIAL_PROGRAM_NAME }))
      .toBeVisible();
    const startBtn = page.locator('.program-start-btn');
    await expect(startBtn).toBeVisible();

    // 4) avvio sessione -> il primo POST /api/chat colpisce il gate trial (403)
    //    (workout singolo -> nessun picker da gestire)
    const respP = page.waitForResponse(
      (r) => r.url().includes('/api/chat') && r.request().method() === 'POST'
    );
    await startBtn.click();
    const resp = await respP;
    expect(resp.status()).toBe(403);

    // 5) la CTA dedicata e' visibile
    await expect(page.getByRole('button', { name: 'Richiedi il coaching' }))
      .toBeVisible();
  });
});
