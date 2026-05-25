export default async function handler(req, res) {
  const { code, type } = req.query;

  if (!code) return res.redirect(302, '/');

  if (type === 'recovery') {
    return res.redirect(302, `/reset?code=${code}`);
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=pkce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`
      },
      body: JSON.stringify({ code_verifier: code, auth_code: code })
    });
    const data = await r.json();
    if (!r.ok || !data.access_token) return res.redirect(302, '/?error=auth');
    return res.redirect(302, `/?access_token=${data.access_token}&refresh_token=${data.refresh_token || ''}`);
  } catch(e) {
    return res.redirect(302, '/?error=auth');
  }
}
