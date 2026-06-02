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
    if (!Array.isArray(rows) || !rows[0] || rows[0].status !== 'active') {
      return res.status(403).json({ error: 'account_not_active' });
    }
  } catch (e) {
    return res.status(401).json({ error: 'Autenticazione fallita' });
  }

  try {
    const body = req.body;
    console.log('Request received, messages count:', body?.messages?.length);
    console.log('API Key present:', !!process.env.ANTHROPIC_API_KEY);

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
        system: body.system,
        messages: body.messages
      })
    });

    const text = await response.text();
    console.log('Anthropic raw response:', text.substring(0, 200));
    
    return res.status(200).json(JSON.parse(text));

  } catch(err) {
    console.log('Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
