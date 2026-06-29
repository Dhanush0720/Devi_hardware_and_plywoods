export default async function handler(req, res) {
  res.setHeader(
    'Set-Cookie',
    'admin_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
  );
  return res.status(200).json({ success: true });
}
