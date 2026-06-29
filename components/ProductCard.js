import Link from 'next/link';
import { useCart } from '../context/CartContext';
import { Plus } from 'lucide-react';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const lowStock = product.inventory && product.inventory.availableQty <= product.inventory.reorderLevel;
  const outOfStock = product.inventory && product.inventory.availableQty <= 0;

  return (
    <div className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/product/${product._id}`}>
        <div className="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <span className="text-gray-400 text-sm">No image</span>
          )}
        </div>
      </Link>
      <div className="p-4">
        <p className="text-xs text-gray-400 uppercase tracking-wide">{product.category}</p>
        <Link href={`/product/${product._id}`}>
          <h3 className="font-medium text-gray-900 dark:text-gray-50 mt-1 line-clamp-1">{product.name}</h3>
        </Link>
        <div className="flex items-center justify-between mt-3">
          <span className="text-lg font-semibold text-brand-700 dark:text-brand-300">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          {outOfStock ? (
            <span className="text-xs text-rose-600 font-medium">Out of stock</span>
          ) : (
            <button
              onClick={() => addItem(product, 1)}
              className="flex items-center gap-1 text-sm bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700"
            >
              <Plus size={14} /> Add
            </button>
          )}
        </div>
        {lowStock && !outOfStock && (
          <p className="text-xs text-amber-600 mt-2">Only {product.inventory.availableQty} left</p>
        )}
      </div>
    </div>
  );
}
