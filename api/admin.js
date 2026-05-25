export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const { action, userId } = req.body;

  async function supabaseRequest(method, path, body) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: body ? JSON.stringify(body) : undefined
    });
    return r;
  }

  try {
    if (action === 'updateProgram') {
      const { program_name, workouts, ai_prompt, status } = req.body;
      await supabaseRequest('PATCH', `profiles?id=eq.${userId}`, {
        program_name, workouts, ai_prompt, status
      });
      return res.status(200).json({ success: true });
    }

    if (action === 'resetProgram') {
      await supabaseRequest('PATCH', `profiles?id=eq.${userId}`, {
        program_name: null,
        workouts: null,
        ai_prompt: null,
        status: 'pending'
      });
      return res.status(200).json({ success: true });
    }

    if (action === 'updateStatus') {
      const { status } = req.body;
      await supabaseRequest('PATCH', `profiles?id=eq.${userId}`, { status });
      return res.status(200).json({ success: true });
    }

    if (action === 'createUser') {
      const { email, password, name } = req.body;
      const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`
        },
        body: JSON.stringify({
          email, password,
          email_confirm: true,
          user_metadata: { full_name: name }
        })
      });
      const data = await r.json();
      if (!r.ok) return res.status(400).json({ error: data.message || data.error });

      await supabaseRequest('POST', 'profiles', {
        id: data.user.id,
        email,
        name,
        role: 'athlete',
        status: 'pending'
      });

      return res.status(200).json({ success: true, userId: data.user.id });
    }

    return res.status(400).json({ error: 'Action non valida' });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
