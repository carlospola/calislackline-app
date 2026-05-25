export default async function handler(req, res) {
  const { code, type } = req.query;
  if (!code) return res.redirect(302, '/');
  if (type === 'recovery') return res.redirect(302, `/reset?code=${code}`);
  return res.redirect(302, `/?code=${code}`);
}
