import { createClient } = '@supabase/supabase-js';

export default async function handler(req, res) {
  const { code } = req.query;
  
  if (!code) {
    return res.redirect(302, '/');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error || !data.session) {
      return res.redirect(302, '/?error=auth');
    }

    // Manda i token al frontend via query params
    const { access_token, refresh_token } = data.session;
    return res.redirect(302, `/?access_token=${access_token}&refresh_token=${refresh_token}`);
    
  } catch(e) {
    return res.redirect(302, '/?error=auth');
  }
}
