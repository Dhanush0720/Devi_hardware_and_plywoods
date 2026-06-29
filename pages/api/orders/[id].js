import connectDB from '../../../lib/db';
import Order from '../../../lib/models/Order';
import { restoreStock } from '../../../lib/services/stockService';

export default async function handler(req, res) {
  await connectDB();
  const { id } = req.query;

  if (req.method === 'GET') {
    const order = await Order.findById(id).populate('customer').populate('invoice');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    return res.status(200).json({ order });
  }

  if (req.method === 'PATCH') {
    const { status } = req.body || {};
    if (!['pending', 'confirmed', 'cancelled', 'fulfilled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const wasCancelled = order.status === 'cancelled';
    const willBeCancelled = status === 'cancelled';

    // Restore stock only on the transition INTO cancelled (avoid double restock
    // if someone calls this endpoint twice).
    if (willBeCancelled && !wasCancelled) {
      for (const item of order.items) {
        await restoreStock(item.product, item.quantity, {
          orderId: order._id,
          type: 'cancellation',
          actor: 'admin',
          note: `Order ${order.orderNumber} cancelled`
        });
      }
    }

    order.status = status;
    await order.save();

    return res.status(200).json({ order });
  }

  res.setHeader('Allow', ['GET', 'PATCH']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
