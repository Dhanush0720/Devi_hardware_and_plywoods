import Link from 'next/link';
import { useTheme } from 'next-themes';
import { ShoppingCart, Sun, Moon, TreePine } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function StorefrontHeader() {
  const { theme, setTheme } = useTheme();
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-gray-950/90 backdrop-blur border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <TreePine className="text-brand-600 dark:text-brand-300" size={22} />
          <span className="text-lg font-semibold text-gray-900 dark:text-gray-50">Devi hardware and plywoods</span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link
            href="/cart"
            className="relative flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700"
          >
            <ShoppingCart size={16} />
            Cart
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-rose-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
