const TRIAL_SESSIONS = 3;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // --- Auth gate: solo un utente Supabase autenticato puo' chiamare questo proxy ---
  // Verifica il JWT del chiamante (stessa logica di api/admin.js, ma SENZA il check
  // del ruolo: qui basta essere loggati). Senza questo gate /api/chat e' un proxy
  // aperto verso Anthropic e chiunque puo' consumare ANTHROPIC_API_KEY.
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return res.status(401).json({ error: 'Autenticazione richiesta' });
  try {
    const uRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${token}` }
    });
    if (!uRes.ok) return res.status(401).json({ error: 'Sessione non valida' });
    const u = await uRes.json();
    if (!u || !u.id) return res.status(401).json({ error: 'Sessione non valida' });
    // --- Status gate (additivo, DOPO il gate JWT): solo i profili 'active' possono
    // usare la chat AI. 'pending'/'inactive' -> 403. Stessa service role di admin.js,
    // qui si legge profiles.status invece di profiles.role.
    const pRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${u.id}&select=status`,
      { headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` } }
    );
    const rows = await pRes.json();
    const status = (Array.isArray(rows) && rows[0]) ? rows[0].status : null;
    if (status === 'active') {
      // profilo attivo -> passa (invariato)
    } else if (status === 'pending') {
      // --- Gate trial: un profilo 'pending' puo' usare la chat per le prime
      // TRIAL_SESSIONS sessioni. Conta le righe di `sessions` dell'utente
      // VERIFICATO DAL JWT (u.id), con la service role, count exact via HEAD
      // (nessuna colonna nuova, nessun filtro sul contenuto, mai valori dal client).
      const cRes = await fetch(
        `${SUPABASE_URL}/rest/v1/sessions?user_id=eq.${u.id}&select=created_at&order=created_at.desc`,
        {
          headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`
          }
        }
      );
      let used = NaN;
      if (cRes.ok) {
        const rows = await cRes.json();
        if (Array.isArray(rows)) {
          used = rows.length;
          if (used > 0 && (Date.now() - new Date(rows[0].created_at).getTime()) < 24 * 60 * 60 * 1000) {
            used -= 1; // la sessione piu' recente e' "in corso" (finestra Riprendi): non si conta
          }
        }
      }
      if (!(Number.isFinite(used) && used < TRIAL_SESSIONS)) {
        return res.status(403).json({ error: 'trial_exhausted' });
      }
      // entro la soglia -> passa
    } else {
      // 'inactive' o status sconosciuto -> 403 generico invariato
      return res.status(403).json({ error: 'account_not_active' });
    }
  } catch (e) {
    return res.status(401).json({ error: 'Autenticazione fallita' });
  }

  // session_type dal frontend ('bodyweight' | 'gym'), default 'bodyweight' se assente.
  const sessionType = (req.body && typeof req.body.session_type === 'string')
    ? req.body.session_type
    : 'bodyweight';

  // --- Motore prompt del coach (additivo, DOPO i gate auth/status, PRIMA di Anthropic) ---
  // Legge da settings DUE righe con la service role (stessa dei gate sopra):
  // il comune (coach_prompt_global) + il delta per tipo sessione
  // (coach_prompt_gym | coach_prompt_bodyweight). typeKey e' hardcoded -> no injection.
  // Se la query fallisce o i valori sono vuoti, motor resta '' e il comportamento
  // e' invariato (finalSystem = body.system).
  const typeKey = (sessionType === 'gym') ? 'coach_prompt_gym' : 'coach_prompt_bodyweight';
  let motor = '';
  try {
    const sRes = await fetch(
      `${SUPABASE_URL}/rest/v1/settings?key=in.(coach_prompt_global,${typeKey})&select=key,value`,
      { headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` } }
    );
    const sRows = await sRes.json();
    const map = {};
    if (Array.isArray(sRows)) {
      for (const row of sRows) {
        if (row && typeof row.value === 'string') map[row.key] = row.value.trim();
      }
    }
    motor = [map['coach_prompt_global'], map[typeKey]]
      .filter(p => p)
      .join('\n\n');
  } catch (e) {
    motor = '';
  }

  try {
    const body = req.body;

    // system finale: se il motor (prefisso statico comune+delta) e' non vuoto, lo
    // mandiamo come ARRAY di blocchi text con un cache_control ephemeral (5 min) sul
    // blocco motor, cosi' la porzione ripetuta del system prompt viene cachata
    // (Leva 2 - prompt caching). Il system del frontend (variabile) resta un blocco
    // separato SENZA cache_control. Se il motor e' vuoto, system resta ESATTAMENTE
    // la stringa body.system di prima -> comportamento invariato (fallback).
    let finalSystem;
    if (motor) {
      finalSystem = [
        { type: 'text', text: motor, cache_control: { type: 'ephemeral' } }
      ];
      if (body.system) {
        finalSystem.push({ type: 'text', text: body.system });
      }
    } else {
      finalSystem = body.system;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1000,
        system: finalSystem,
        messages: body.messages
      })
    });

    const text = await response.text();
    return res.status(200).json(JSON.parse(text));

  } catch(err) {
    console.log('Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
