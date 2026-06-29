import { useState } from 'react';
import { useRouter } from 'next/router';
import StorefrontHeader from '../components/StorefrontHeader';
import { useCart } from '../context/CartContext';

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name: form.name, phone: form.phone, email: form.email },
          shippingAddress: {
            line1: form.line1,
            line2: form.line2,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
            country: 'India'
          },
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity }))
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong placing your order.');
        setSubmitting(false);
        return;
      }

      clearCart();
      router.push(`/order-success?id=${data.order._id}`);
    } catch (err) {
      setError('Network error. Please try again.');
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <StorefrontHeader />
        <p className="p-8 text-gray-400">Your cart is empty.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <StorefrontHeader />
      <div className="max-w-3xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="md:col-span-2 space-y-4">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mb-2">Checkout</h1>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <Field label="Full name" value={form.name} onChange={set('name')} required />
          <Field
            label="WhatsApp / phone number"
            value={form.phone}
            onChange={set('phone')}
            placeholder="+91 98765 43210"
            required
          />
          <Field label="Email (optional)" value={form.email} onChange={set('email')} type="email" />
          <Field label="Address line 1" value={form.line1} onChange={set('line1')} required />
          <Field label="Address line 2" value={form.line2} onChange={set('line2')} />
          <div className="grid grid-cols-3 gap-4">
            <Field label="City" value={form.city} onChange={set('city')} required />
            <Field label="State" value={form.state} onChange={set('state')} required />
            <Field label="Pincode" value={form.pincode} onChange={set('pincode')} required />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-600 disabled:opacity-60 text-white font-medium py-3 rounded-lg hover:bg-brand-700 mt-4"
          >
            {submitting ? 'Placing order...' : 'Place order'}
          </button>
        </form>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 h-fit">
          <h2 className="font-medium mb-3 text-gray-900 dark:text-gray-50">Order Summary</h2>
          {items.map((i) => (
            <div key={i.productId} className="flex justify-between text-sm py-1.5 text-gray-600 dark:text-gray-300">
              <span>
                {i.name} × {i.quantity}
              </span>
              <span>₹{(i.price * i.quantity).toLocaleString('en-IN')}</span>
            </div>
          ))}
          <div className="border-t border-gray-200 dark:border-gray-800 mt-3 pt-3 flex justify-between font-semibold text-gray-900 dark:text-gray-50">
            <span>Subtotal</span>
            <span>₹{subtotal.toLocaleString('en-IN')}</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">Tax (GST) calculated at order confirmation.</p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type = 'text', ...props }) {
  return (
    <label className="block">
      <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>
      <input
        type={type}
        {...props}
        className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400"
      />
    </label>
  );
}
