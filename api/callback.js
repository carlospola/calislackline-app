export default async function handler(req, res) {
  const { code, type } = req.query;

  if (!code) return res.redirect(302, '/');

  if (type === 'recovery') {
    return res.redirect(302, `/reset?code=${code}`);
  }

  // Passa il code al frontend — il client Supabase farà il code exchange
  // perché ha il code_verifier salvato in localStorage
  return res.redirect(302, `/?code=${code}`);
}
