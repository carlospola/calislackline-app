import { createClient } from '@supabase/supabase-js';

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

    const { access_token, refresh_token } = data.session;
    const type = data.user?.user_metadata?.type || data.session?.user?.user_metadata?.type;

    // Controlla se è un recovery (reset password)
    // Supabase mette 'recovery' nell'AMR (Authentication Methods References)
    const amr = data.session?.user?.factors || [];
    const isRecovery = data.user?.recovery_sent_at && !data.session?.user?.email_confirmed_at
      ? false
      : (req.query.type === 'recovery' || false);

    // Metodo più affidabile: controlla l'AMR nella sessione
    const sessionStr = JSON.stringify(data.session);
    const hasRecovery = sessionStr.includes('"recovery"') || req.query.type === 'recovery';

    if (hasRecovery) {
      return res.redirect(302, `/?access_token=${access_token}&refresh_token=${refresh_token}&type=recovery`);
    }

    return res.redirect(302, `/?access_token=${access_token}&refresh_token=${refresh_token}`);
    
  } catch(e) {
    return res.redirect(302, '/?error=auth');
  }
}
