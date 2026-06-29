import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        router.push('/admin');
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <Head>
        <title>Admin Login - Devi hardware and plywoods</title>
      </Head>
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl p-8 transition-colors">
        <div className="text-center mb-8">
          <span className="text-2xl font-bold text-brand-700 dark:text-brand-300">Devi hardware and plywoods</span>
          <p className="text-sm text-gray-400 mt-1.5">Sign in to the Inventory & Sales panel</p>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-sm px-4 py-3 rounded-lg mb-5 border border-rose-100 dark:border-rose-900/40">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-3 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
