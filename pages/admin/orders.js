import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import StatusBadge from '../../components/StatusBadge';

const STATUSES = ['all', 'pending', 'confirmed', 'fulfilled', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handler = setTimeout(() => {
      load();
    }, 300);
    return () => clearTimeout(handler);
  }, [filter, search]);

  async function load() {
    setLoading(true);
    const paramsList = [];
    if (filter !== 'all') paramsList.push(`status=${filter}`);
    if (search) paramsList.push(`search=${encodeURIComponent(search)}`);
    const query = paramsList.length > 0 ? `?${paramsList.join('&')}` : '';
    const res = await fetch(`/api/orders${query}`);
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  }

  async function updateStatus(id, status) {
    await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    load();
  }

  return (
    <AdminLayout title="Orders">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-5">
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border capitalize ${
                filter === s
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search orders..."
          className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <p className="p-6 text-gray-400">Loading...</p>
        ) : orders.length === 0 ? (
          <p className="p-6 text-gray-400">No orders found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">WhatsApp</th>
                <th className="py-3 px-4">Invoice</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id} className="border-b border-gray-100 dark:border-gray-800/60 align-top">
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-50">{o.orderNumber}</td>
                  <td className="py-3 px-4">
                    <p className="text-gray-800 dark:text-gray-200">{o.customer?.name}</p>
                    <p className="text-gray-400 text-xs">{o.customer?.phone}</p>
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                    {o.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}
                  </td>
                  <td className="py-3 px-4">₹{o.total.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={o.whatsappStatus} />
                  </td>
                  <td className="py-3 px-4">
                    {o.invoice?.pdfUrl ? (
                      <a href={o.invoice.pdfUrl} target="_blank" rel="noreferrer" className="text-brand-600 dark:text-brand-300">
                        View PDF
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {o.status !== 'cancelled' && o.status !== 'fulfilled' && (
                      <div className="flex gap-2">
                        {o.status === 'confirmed' && (
                          <button
                            onClick={() => updateStatus(o._id, 'fulfilled')}
                            className="text-xs text-emerald-600 font-medium"
                          >
                            Mark fulfilled
                          </button>
                        )}
                        <button
                          onClick={() => updateStatus(o._id, 'cancelled')}
                          className="text-xs text-rose-600 font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
