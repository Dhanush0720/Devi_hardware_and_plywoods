import Order from '../models/Order';
import Invoice from '../models/Invoice';

export async function nextOrderNumber() {
  const year = new Date().getFullYear();
  const count = await Order.countDocuments({
    createdAt: { $gte: new Date(`${year}-01-01`), $lt: new Date(`${year + 1}-01-01`) }
  });
  const seq = String(count + 1).padStart(5, '0');
  return `PW-${year}-${seq}`;
}

export async function nextInvoiceNumber() {
  const year = new Date().getFullYear();
  const count = await Invoice.countDocuments({
    createdAt: { $gte: new Date(`${year}-01-01`), $lt: new Date(`${year + 1}-01-01`) }
  });
  const seq = String(count + 1).padStart(5, '0');
  return `INV-${year}-${seq}`;
}
