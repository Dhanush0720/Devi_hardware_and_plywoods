import { useEffect, useState } from 'react';
import Link from 'next/link';
import StorefrontHeader from '../components/StorefrontHeader';
import { useCart } from '../context/CartContext';
import { Trash2 } from 'lucide-react';

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const [stockMap, setStockMap] = useState({});

  useEffect(() => {
    fetch('/api/products?activeOnly=true')
      .then((res) => res.json())
      .then((data) => {
        const map = {};
        if (Array.isArray(data.products)) {
          data.products.forEach((p) => {
            map[p._id] = p.inventory?.availableQty ?? 0;
          });
        }
        setStockMap(map);
      })
      .catch((err) => console.error('[cart] failed to fetch stock', err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <StorefrontHeader />
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mb-6">Your Cart</h1>

        {items.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p>Your cart is empty.</p>
            <Link href="/" className="text-brand-600 dark:text-brand-300 font-medium mt-2 inline-block">
              Continue shopping →
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shrink-0">
                      {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-50 text-sm sm:text-base">{item.name}</p>
                      <p className="text-sm text-gray-400">₹{item.price.toLocaleString('en-IN')}</p>
                      {stockMap[item.productId] !== undefined && stockMap[item.productId] <= 5 && (
                        <p className="text-[10px] font-semibold text-rose-600 mt-0.5">
                          {stockMap[item.productId] === 0 ? 'Out of stock' : `Only ${stockMap[item.productId]} units left`}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-800/60">
                    <div className="flex items-center border border-gray-200 dark:border-gray-800 rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="px-2.5 py-1"
                      >
                        −
                      </button>
                      <span className="px-3 text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={stockMap[item.productId] !== undefined && item.quantity >= stockMap[item.productId]}
                        className="px-2.5 py-1 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                    <p className="font-medium w-20 text-right text-gray-900 dark:text-gray-50 text-sm sm:text-base">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </p>
                    <button onClick={() => removeItem(item.productId)} className="text-gray-400 hover:text-rose-600 p-1">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-8 border-t border-gray-200 dark:border-gray-800 pt-6">
              <div>
                <p className="text-sm text-gray-400">Subtotal</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-50">
                  ₹{subtotal.toLocaleString('en-IN')}
                </p>
              </div>
              <Link
                href="/checkout"
                className="bg-brand-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-brand-700"
              >
                Proceed to checkout
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
