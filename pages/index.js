import { useEffect, useState } from 'react';
import StorefrontHeader from '../components/StorefrontHeader';
import ProductCard from '../components/ProductCard';
import { Search } from 'lucide-react';

const CATEGORIES = ['All', 'Furniture', 'Doors', 'Boards', 'Outdoor', 'Decking', 'Accessories', 'Other'];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    load();
  }, [category, search]);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ activeOnly: 'true' });
    if (category !== 'All') params.set('category', category);
    if (search) params.set('search', search);
    const res = await fetch(`/api/products?${params.toString()}`);
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <StorefrontHeader />

      <section className="bg-brand-800 text-white">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <h1 className="text-3xl md:text-4xl font-semibold">Durable Polywood Furniture & Boards</h1>
          <p className="text-brand-100 mt-2 max-w-xl">
            Weather-proof, low-maintenance polywood pieces built for indoor and outdoor living.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-6">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-6 px-6 sm:mx-0 sm:px-0 sm:flex-wrap">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  category === c
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-gray-400">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="text-gray-400">No products found.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
