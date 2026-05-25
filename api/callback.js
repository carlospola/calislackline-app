export default async function handler(req, res) {
  const { code, type } = req.query;

  if (!code) return res.redirect(302, '/');

  if (type === 'recovery') {
    return res.redirect(302, `/reset?code=${code}`);
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=pkce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'apikey': ANON_KEY
      },
      body: new URLSearchParams({ code_verifier: '', auth_code: code }).toString()
    });

    const data = await r.json();
    if (!r.ok || !data.access_token) return res.redirect(302, '/?error=auth');

    return res.redirect(302, `/?access_token=${data.access_token}&refresh_token=${data.refresh_token}`);
  } catch(e) {
    return res.redirect(302, '/?error=auth');
  }
}
