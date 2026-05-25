export default async function handler(req, res) {
  const { code, type } = req.query;
  if (type === 'recovery' && code) {
    return res.redirect(302, `/reset?code=${code}`);
  }
  // Per tutto il resto lascia gestire al client Supabase
  return res.redirect(302, '/');
}
