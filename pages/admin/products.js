import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import StatusBadge from '../../components/StatusBadge';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

const CATEGORIES = ['Furniture', 'Doors', 'Boards', 'Outdoor', 'Decking', 'Accessories', 'Other'];
const EMPTY_FORM = {
  sku: '',
  name: '',
  description: '',
  category: 'Furniture',
  material: 'Polywood',
  color: '',
  price: '',
  initialQty: 0,
  reorderLevel: 5,
  images: []
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
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

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError('');
    setShowForm(true);
  }

  function openEdit(p) {
    setForm({
      sku: p.sku,
      name: p.name,
      description: p.description || '',
      category: p.category,
      material: p.material,
      color: p.color || '',
      price: p.price,
      initialQty: p.inventory?.availableQty ?? 0,
      reorderLevel: p.reorderLevel ?? 5,
      images: p.images || []
    });
    setEditingId(p._id);
    setError('');
    setShowForm(true);
  }

  function generateSKU() {
    const categoryMap = {
      'Furniture': 'FUR',
      'Doors': 'DR',
      'Boards': 'BD',
      'Outdoor': 'OUT',
      'Decking': 'DEC',
      'Accessories': 'ACC',
      'Other': 'OTH'
    };
    const prefix = categoryMap[form.category] || 'GEN';
    const random = Math.floor(100 + Math.random() * 900);
    setForm((f) => ({ ...f, sku: `PW-${prefix}-${random}` }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const payload = {
      ...form,
      price: Number(form.price),
      initialQty: Number(form.initialQty),
      reorderLevel: Number(form.reorderLevel),
      images: form.images
    };

    const res = await fetch(editingId ? `/api/products/${editingId}` : '/api/products', {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to save product');
      return;
    }

    setShowForm(false);
    load();
  }

  async function handleDeactivate(id) {
    if (!confirm('Deactivate this product? It will be hidden from the storefront.')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <AdminLayout title="Products">
      <div className="flex justify-between items-center mb-5">
        <p className="text-sm text-gray-400">{products.length} products</p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700"
        >
          <Plus size={16} /> Add product
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <p className="p-6 text-gray-400">Loading...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50">
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const lowStock = p.inventory && p.inventory.availableQty <= p.inventory.reorderLevel;
                return (
                  <tr key={p._id} className="border-b border-gray-100 dark:border-gray-800/60">
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-50">{p.name}</td>
                    <td className="py-3 px-4 text-gray-500">{p.sku}</td>
                    <td className="py-3 px-4 text-gray-500">{p.category}</td>
                    <td className="py-3 px-4">₹{p.price.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={lowStock ? 'low_stock' : 'in_stock'}>
                        {p.inventory?.availableQty ?? 0} units
                      </StatusBadge>
                    </td>
                    <td className="py-3 px-4">
                      {p.isActive ? (
                        <span className="text-emerald-600 text-xs font-medium">Active</span>
                      ) : (
                        <span className="text-gray-400 text-xs font-medium">Inactive</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-brand-600">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDeactivate(p._id)} className="p-1.5 text-gray-400 hover:text-rose-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-lg">{editingId ? 'Edit product' : 'Add product'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-sm px-3 py-2 rounded-lg mb-3">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3 items-end">
                <div className="block">
                  <span className="text-xs text-gray-500">SKU</span>
                  <div className="flex gap-1.5 mt-1">
                    <input
                      required
                      value={form.sku}
                      onChange={(e) => setForm({ ...form, sku: e.target.value })}
                      disabled={!!editingId}
                      placeholder="e.g. PW-FUR-101"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:opacity-60"
                    />
                    {!editingId && (
                      <button
                        type="button"
                        onClick={generateSKU}
                        className="px-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold shrink-0 border border-gray-200 dark:border-gray-800 transition-colors"
                      >
                        Gen
                      </button>
                    )}
                  </div>
                </div>
                <Select
                  label="Category"
                  value={form.category}
                  onChange={(v) => setForm({ ...form, category: v })}
                  options={CATEGORIES}
                />
              </div>
              <Input label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
              <Input
                label="Description"
                value={form.description}
                onChange={(v) => setForm({ ...form, description: v })}
                textarea
              />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Material" value={form.material} onChange={(v) => setForm({ ...form, material: v })} />
                <Input label="Color" value={form.color} onChange={(v) => setForm({ ...form, color: v })} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input label="Price (₹)" type="number" value={form.price} onChange={(v) => setForm({ ...form, price: v })} required />
                <Input
                  label={editingId ? 'Current stock' : 'Initial stock'}
                  type="number"
                  value={form.initialQty}
                  onChange={(v) => setForm({ ...form, initialQty: v })}
                  disabled={!!editingId}
                />
                <Input
                  label="Reorder level"
                  type="number"
                  value={form.reorderLevel}
                  onChange={(v) => setForm({ ...form, reorderLevel: v })}
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500">Product Images</span>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {(form.images || []).map((url, index) => (
                    <div key={url} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
                      <img src={url} alt={`Preview ${index}`} className="object-cover w-full h-full" />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...form.images];
                          updated.splice(index, 1);
                          setForm({ ...form, images: updated });
                        }}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity text-xs font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-brand-500 dark:hover:border-brand-400 flex flex-col items-center justify-center cursor-pointer transition-colors text-gray-400 hover:text-brand-600">
                    <Plus size={20} />
                    <span className="text-[10px] font-medium mt-1">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append('file', file);

                        try {
                          const res = await fetch('/api/admin/upload', {
                            method: 'POST',
                            body: formData
                          });
                          const data = await res.json();
                          if (res.ok && data.url) {
                            setForm({ ...form, images: [...(form.images || []), data.url] });
                          } else {
                            alert(data.error || 'Upload failed');
                          }
                        } catch (err) {
                          alert('Upload error');
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
              {editingId && (
                <p className="text-xs text-gray-400">
                  To change stock quantity, use the Inventory page instead — it keeps the stock movement log accurate.
                </p>
              )}
              <button type="submit" className="w-full bg-brand-600 text-white py-2.5 rounded-lg font-medium hover:bg-brand-700 mt-2">
                {editingId ? 'Save changes' : 'Create product'}
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function Input({ label, textarea, ...props }) {
  const Tag = textarea ? 'textarea' : 'input';
  return (
    <label className="block">
      <span className="text-xs text-gray-500">{label}</span>
      <Tag
        {...props}
        onChange={(e) => props.onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:opacity-60"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="text-xs text-gray-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
