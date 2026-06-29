import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import StatusBadge from '../../components/StatusBadge';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Package, ClipboardList, AlertTriangle, IndianRupee } from 'lucide-react';

const COLORS = ['#a87c45', '#8c6332', '#704d27', '#583c20', '#bd9a66', '#d3bd97', '#e6dcc9'];

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [range, setRange] = useState('7d');
  const [salesData, setSalesData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/orders?limit=10').then((r) => r.json()),
      fetch('/api/products').then((r) => r.json())
    ]).then(([ordersData, productsData]) => {
      setOrders(ordersData.orders || []);
      setProducts(productsData.products || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetch(`/api/orders?analytics=true&range=${range}`)
      .then((r) => r.json())
      .then((data) => {
        setSalesData(data.salesOverTime || []);
        setCategoryData(data.categoryBreakdown || []);
      });
  }, [range]);

  const lowStockProducts = products.filter(
    (p) => p.inventory && p.inventory.availableQty <= p.inventory.reorderLevel
  );
  
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <AdminLayout title="Dashboard">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard icon={ClipboardList} label="Recent orders" value={orders.length} />
        <StatCard icon={Package} label="Active products" value={products.length} />
        <StatCard
          icon={AlertTriangle}
          label="Low stock items"
          value={lowStockProducts.length}
          accent={lowStockProducts.length > 0 ? 'rose' : 'emerald'}
        />
        <StatCard icon={IndianRupee} label="Revenue (recent)" value={`₹${totalRevenue.toLocaleString('en-IN')}`} />
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">Analytics Overview</h2>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="12m">Last 12 Months</option>
        </select>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <h3 className="font-medium mb-4 text-sm text-gray-700 dark:text-gray-300">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a87c45" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#a87c45" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
              <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']} />
              <Area type="monotone" dataKey="totalSales" stroke="#a87c45" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 flex flex-col justify-between">
          <h3 className="font-medium mb-4 text-sm text-gray-700 dark:text-gray-300">Sales by Category</h3>
          {categoryData.length === 0 ? (
            <p className="text-sm text-gray-400 my-auto text-center">No category data available.</p>
          ) : (
            <div className="flex flex-col items-center justify-center my-auto">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-4 text-xs w-full">
                {categoryData.slice(0, 4).map((entry, index) => (
                  <div key={entry._id} className="flex items-center gap-1.5 truncate">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-gray-600 dark:text-gray-400 truncate">{entry._id || 'Uncategorized'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium">Recent orders</h2>
            <Link href="/admin/orders" className="text-brand-600 dark:text-brand-300 text-sm font-medium">
              View all →
            </Link>
          </div>
          <OrdersTable orders={orders.slice(0, 6)} compact />
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <h2 className="font-medium mb-4 flex items-center gap-2 text-rose-600">
            <AlertTriangle size={16} /> Low stock alerts
          </h2>
          {lowStockProducts.length === 0 ? (
            <p className="text-sm text-gray-400">All products are sufficiently stocked.</p>
          ) : (
            <ul className="space-y-2">
              {lowStockProducts.slice(0, 6).map((p) => (
                <li key={p._id} className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300 truncate max-w-[180px]">{p.name}</span>
                  <span className="text-rose-600 font-medium shrink-0">{p.inventory.availableQty} left</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/inventory" className="text-brand-600 dark:text-brand-300 text-sm font-medium mt-4 inline-block">
            View inventory →
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium">Recent orders</h2>
          <Link href="/admin/orders" className="text-brand-600 dark:text-brand-300 text-sm font-medium">
            View all →
          </Link>
        </div>
        <OrdersTable orders={orders.slice(0, 6)} compact />
      </div>
    </AdminLayout>
  );
}

const ACCENT_CLASSES = {
  brand: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
};

function StatCard({ icon: Icon, label, value, accent = 'brand' }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 flex items-center gap-4">
      <div className={`p-2.5 rounded-lg ${ACCENT_CLASSES[accent]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-xl font-semibold text-gray-900 dark:text-gray-50">{value}</p>
      </div>
    </div>
  );
}

export function OrdersTable({ orders, compact }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-400 border-b border-gray-200 dark:border-gray-800">
            <th className="py-2 pr-4">Order #</th>
            <th className="py-2 pr-4">Customer</th>
            <th className="py-2 pr-4">Total</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2 pr-4">WhatsApp</th>
            {!compact && <th className="py-2 pr-4">Invoice</th>}
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o._id} className="border-b border-gray-100 dark:border-gray-800/60">
              <td className="py-2.5 pr-4 font-medium">{o.orderNumber}</td>
              <td className="py-2.5 pr-4">{o.customer?.name}</td>
              <td className="py-2.5 pr-4">₹{o.total.toLocaleString('en-IN')}</td>
              <td className="py-2.5 pr-4">
                <StatusBadge status={o.status} />
              </td>
              <td className="py-2.5 pr-4">
                <StatusBadge status={o.whatsappStatus} />
              </td>
              {!compact && (
                <td className="py-2.5 pr-4">
                  {o.invoice?.pdfUrl ? (
                    <a href={o.invoice.pdfUrl} target="_blank" rel="noreferrer" className="text-brand-600 dark:text-brand-300">
                      View PDF
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
