import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import StorefrontHeader from '../../components/StorefrontHeader';
import { useCart } from '../../context/CartContext';

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState(null);
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();

  useEffect(() => {
    if (!id) return;
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then(setData);
  }, [id]);

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <StorefrontHeader />
        <p className="p-8 text-gray-400">Loading...</p>
      </div>
    );
  }

  const { product, inventory } = data;
  const outOfStock = !inventory || inventory.availableQty <= 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <StorefrontHeader />
      <div className="max-w-5xl mx-auto px-6 py-10 grid md:grid-cols-2 gap-10">
        <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden flex items-center justify-center">
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-400">No image</span>
          )}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">{product.category}</p>
          <h1 className="text-2xl font-semibold mt-1 text-gray-900 dark:text-gray-50">{product.name}</h1>
          <p className="text-2xl font-semibold text-brand-700 dark:text-brand-300 mt-3">
            ₹{product.price.toLocaleString('en-IN')}
          </p>

          <dl className="grid grid-cols-2 gap-3 mt-6 text-sm">
            <div>
              <dt className="text-gray-400">Material</dt>
              <dd className="text-gray-800 dark:text-gray-200">{product.material}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Color</dt>
              <dd className="text-gray-800 dark:text-gray-200">{product.color || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-400">SKU</dt>
              <dd className="text-gray-800 dark:text-gray-200">{product.sku}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Dimensions</dt>
              <dd className="text-gray-800 dark:text-gray-200">
                {product.dimensions?.length || '—'} x {product.dimensions?.width || '—'} x{' '}
                {product.dimensions?.height || '—'} cm
              </dd>
            </div>
          </dl>

          {product.description && (
            <p className="mt-6 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{product.description}</p>
          )}

          <div className="mt-8 flex items-center gap-4">
            {!outOfStock && (
              <div className="flex items-center border border-gray-200 dark:border-gray-800 rounded-lg">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2">
                  −
                </button>
                <span className="px-3">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(inventory.availableQty, q + 1))}
                  className="px-3 py-2"
                >
                  +
                </button>
              </div>
            )}
            <button
              disabled={outOfStock}
              onClick={() => addItem(product, qty)}
              className="flex-1 bg-brand-600 disabled:bg-gray-300 disabled:dark:bg-gray-700 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-brand-700"
            >
              {outOfStock ? 'Out of stock' : 'Add to cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
