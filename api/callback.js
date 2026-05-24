export default async function handler(req, res) {
  const { code } = req.query;
  if (code) {
    res.redirect(302, `/?code=${code}`);
  } else {
    res.redirect(302, '/');
  }
}
