import connectDB from '../../../lib/db';
import { adjustStockManually, InsufficientStockError } from '../../../lib/services/stockService';
import Inventory from '../../../lib/models/Inventory';
import StockMovement from '../../../lib/models/StockMovement';

export default async function handler(req, res) {
  await connectDB();
  const { id } = req.query; // product id

  if (req.method === 'GET') {
    const inventory = await Inventory.findOne({ product: id });
    const movements = await StockMovement.find({ product: id }).sort({ createdAt: -1 }).limit(50);
    return res.status(200).json({ inventory, movements });
  }

  if (req.method === 'POST') {
    const { quantityChange, note, actor } = req.body || {};
    if (!quantityChange || typeof quantityChange !== 'number') {
      return res.status(400).json({ error: 'quantityChange (non-zero number) is required' });
    }
    try {
      const inventory = await adjustStockManually(id, quantityChange, {
        actor: actor || 'admin',
        note: note || ''
      });
      return res.status(200).json({ inventory });
    } catch (err) {
      if (err instanceof InsufficientStockError) {
        return res.status(409).json({ error: 'Not enough stock to remove that quantity' });
      }
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
