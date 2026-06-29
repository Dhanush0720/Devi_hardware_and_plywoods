const STYLES = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  fulfilled: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  cancelled: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  sent: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  not_sent: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  failed: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  low_stock: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  in_stock: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
};

export default function StatusBadge({ status, children }) {
  const cls = STYLES[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>
      {children || status}
    </span>
  );
}
