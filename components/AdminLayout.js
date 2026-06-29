import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Boxes,
  Sun,
  Moon,
  Store,
  LogOut
} from 'lucide-react';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { href: '/admin/inventory', label: 'Inventory', icon: Boxes }
];

export default function AdminLayout({ children, title }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <aside className="w-64 shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <span className="text-lg font-semibold text-brand-700 dark:text-brand-300">Devi hardware and plywoods</span>
          <p className="text-xs text-gray-400 mt-0.5">Admin Dashboard</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = router.pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 mt-4"
          >
            <Store size={18} />
            View Storefront
          </Link>
        </nav>
        <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-800 space-y-1">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-8 py-4">
          <h1 className="text-xl font-semibold">{title}</h1>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
