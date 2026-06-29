import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import StatusBadge from '../../components/StatusBadge';
import { X } from 'lucide-react';

export default function AdminInventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdjust, setShowAdjust] = useState(null); // product
  const [movements, setMovements] = useState([]);
  const [delta, setDelta] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  }

  async function openAdjust(product) {
    setShowAdjust(product);
    setDelta('');
    setNote('');
    setError('');
    const res = await fetch(`/api/inventory/${product._id}`);
    const data = await res.json();
    setMovements(data.movements || []);
  }

  async function submitAdjust(e) {
    e.preventDefault();
    setError('');
    const qty = Number(delta);
    if (!qty) {
      setError('Enter a non-zero quantity (positive to add, negative to remove)');
      return;
    }
    const res = await fetch(`/api/inventory/${showAdjust._id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantityChange: qty, note, actor: 'admin' })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to adjust stock');
      return;
    }
    setShowAdjust(null);
    load();
  }

  return (
    <AdminLayout title="Inventory">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <p className="p-6 text-gray-400">Loading...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50">
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Available</th>
                <th className="py-3 px-4">Reorder level</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const inv = p.inventory;
                const lowStock = inv && inv.availableQty <= inv.reorderLevel;
                return (
                  <tr key={p._id} className="border-b border-gray-100 dark:border-gray-800/60">
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-50">{p.name}</td>
                    <td className="py-3 px-4 text-gray-500">{p.sku}</td>
                    <td className="py-3 px-4">{inv?.availableQty ?? 0}</td>
                    <td className="py-3 px-4">{inv?.reorderLevel ?? 0}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={lowStock ? 'low_stock' : 'in_stock'}>
                        {lowStock ? 'Low stock' : 'In stock'}
                      </StatusBadge>
                    </td>
                    <td className="py-3 px-4">
                      <button onClick={() => openAdjust(p)} className="text-brand-600 dark:text-brand-300 text-xs font-medium">
                        Adjust stock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showAdjust && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-lg">{showAdjust.name}</h2>
              <button onClick={() => setShowAdjust(null)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-sm px-3 py-2 rounded-lg mb-3">
                {error}
              </div>
            )}

            <form onSubmit={submitAdjust} className="space-y-3 mb-6">
              <label className="block">
                <span className="text-xs text-gray-500">Quantity change (e.g. 10 to restock, -3 to remove)</span>
                <input
                  type="number"
                  value={delta}
                  onChange={(e) => setDelta(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500">Note (optional)</span>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm"
                  placeholder="e.g. Restocked from supplier batch #45"
                />
              </label>
              <button type="submit" className="w-full bg-brand-600 text-white py-2.5 rounded-lg font-medium hover:bg-brand-700">
                Apply adjustment
              </button>
            </form>

            <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Recent stock movements</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {movements.length === 0 ? (
                <p className="text-xs text-gray-400">No movements yet.</p>
              ) : (
                movements.map((m) => (
                  <div key={m._id} className="flex justify-between text-xs border-b border-gray-100 dark:border-gray-800 pb-1.5">
                    <span className="text-gray-500 capitalize">{m.type.replace('_', ' ')}</span>
                    <span className={m.quantityChange < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                      {m.quantityChange > 0 ? '+' : ''}
                      {m.quantityChange}
                    </span>
                    <span className="text-gray-400">{new Date(m.createdAt).toLocaleDateString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
