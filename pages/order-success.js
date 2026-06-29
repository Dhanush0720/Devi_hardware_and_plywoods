import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import StorefrontHeader from '../components/StorefrontHeader';
import { CheckCircle2, Download, MapPin, CreditCard, ShoppingBag } from 'lucide-react';

export default function OrderSuccess() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/orders/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Order not found');
        return res.json();
      })
      .then((data) => {
        setOrder(data.order || null);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      <StorefrontHeader />
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <CheckCircle2 className="mx-auto text-emerald-500 mb-4" size={56} />
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">Order Confirmed!</h1>
          {order && (
            <p className="text-sm text-gray-500 mt-2">
              Order number: <span className="font-semibold text-gray-800 dark:text-gray-200">{order.orderNumber}</span>
            </p>
          )}
          <p className="text-gray-400 text-xs mt-1">
            A confirmation with your PDF invoice has been prepared.
          </p>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-center text-gray-400">
            Loading order details...
          </div>
        ) : !order ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-center text-gray-400">
            <p>Could not retrieve order details.</p>
            <Link href="/" className="text-brand-600 dark:text-brand-300 font-medium mt-4 inline-block">
              Continue shopping →
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Download Invoice Button */}
            {order.invoice?.pdfUrl && (
              <a
                href={order.invoice.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-3 px-4 rounded-xl text-sm transition-colors shadow-sm"
              >
                <Download size={18} />
                Download PDF Invoice
              </a>
            )}

            {/* Order Items card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
              <h2 className="font-semibold text-base mb-4 flex items-center gap-2">
                <ShoppingBag size={18} className="text-brand-500" />
                Items Purchased
              </h2>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {order.items.map((item) => (
                  <div key={item.product} className="flex justify-between py-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{item.name}</p>
                      <p className="text-xs text-gray-400">SKU: {item.sku} | Qty: {item.quantity}</p>
                    </div>
                    <span className="font-medium">₹{item.lineTotal.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 dark:border-gray-800 mt-4 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>₹{order.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>GST (18%)</span>
                  <span>₹{order.tax.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-semibold text-base text-gray-900 dark:text-gray-50 pt-2 border-t border-dashed border-gray-100 dark:border-gray-800">
                  <span>Total Amount</span>
                  <span>₹{order.total.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Delivery address details */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                  <MapPin size={16} className="text-brand-500" />
                  Delivery Address
                </h3>
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <p className="font-medium text-gray-800 dark:text-gray-200">{order.customer?.name}</p>
                  <p>{order.shippingAddress?.line1}</p>
                  {order.shippingAddress?.line2 && <p>{order.shippingAddress.line2}</p>}
                  <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                  <CreditCard size={16} className="text-brand-500" />
                  Contact Info
                </h3>
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <p className="font-medium text-gray-800 dark:text-gray-200">Phone (WhatsApp)</p>
                  <p>{order.customer?.phone}</p>
                  {order.customer?.email && (
                    <>
                      <p className="font-medium text-gray-800 dark:text-gray-200 mt-2">Email Address</p>
                      <p>{order.customer.email}</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="text-center pt-4">
              <Link
                href="/"
                className="text-brand-600 dark:text-brand-300 hover:text-brand-700 font-medium text-sm transition-colors"
              >
                ← Back to storefront
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
