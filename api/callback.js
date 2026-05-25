import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const { code, type } = req.query;

  if (!code) return res.redirect(302, '/');

  // Se è un recovery, manda direttamente a /reset con il code
  if (type === 'recovery') {
    return res.redirect(302, `/reset?code=${code}`);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.session) return res.redirect(302, '/?error=auth');
    const { access_token, refresh_token } = data.session;
    return res.redirect(302, `/?access_token=${access_token}&refresh_token=${refresh_token}`);
  } catch(e) {
    return res.redirect(302, '/?error=auth');
  }
}
