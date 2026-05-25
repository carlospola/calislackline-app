import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { action, userId } = req.body;

  try {
    if (action === 'updateProgram') {
      const { program_name, workouts, ai_prompt, status } = req.body;
      const { error } = await sb.from('profiles').update({
        program_name, workouts, ai_prompt, status
      }).eq('id', userId);
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    if (action === 'updateStatus') {
      const { status } = req.body;
      const { error } = await sb.from('profiles').update({ status }).eq('id', userId);
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    if (action === 'createUser') {
      const { email, password, name } = req.body;
      const { data, error } = await sb.auth.admin.createUser({
        email, password,
        email_confirm: true,
        user_metadata: { full_name: name }
      });
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ success: true, userId: data.user.id });
    }

    return res.status(400).json({ error: 'Action non valida' });

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
