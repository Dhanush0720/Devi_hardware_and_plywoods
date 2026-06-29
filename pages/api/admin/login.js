export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const { email, password } = req.body || {};

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'change_this_password';
  const sessionSecret = process.env.ADMIN_SESSION_SECRET || 'change_this_to_a_long_random_string';

  if (email === adminEmail && password === adminPassword) {
    const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader(
      'Set-Cookie',
      `admin_token=${sessionSecret}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400${secureFlag}`
    );
    return res.status(200).json({ success: true });
  }

  return res.status(401).json({ error: 'Invalid email or password' });
}
