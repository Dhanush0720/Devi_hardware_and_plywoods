import connectDB from '../../../lib/db';
import Product from '../../../lib/models/Product';
import Inventory from '../../../lib/models/Inventory';

export default async function handler(req, res) {
  await connectDB();

  if (req.method === 'GET') {
    const { category, search, activeOnly } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (activeOnly === 'true') filter.isActive = true;
    if (search) filter.$text = { $search: search };

    const products = await Product.find(filter).sort({ createdAt: -1 }).lean();
    const inventories = await Inventory.find({
      product: { $in: products.map((p) => p._id) }
    }).lean();
    const invMap = new Map(inventories.map((i) => [String(i.product), i]));

    const merged = products.map((p) => ({
      ...p,
      inventory: invMap.get(String(p._id)) || null
    }));

    return res.status(200).json({ products: merged });
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    if (!body.sku || !body.name || body.price == null) {
      return res.status(400).json({ error: 'sku, name, and price are required' });
    }

    const existing = await Product.findOne({ sku: body.sku });
    if (existing) {
      return res.status(409).json({ error: `SKU "${body.sku}" already exists` });
    }

    const product = await Product.create({
      sku: body.sku,
      name: body.name,
      description: body.description || '',
      category: body.category || 'Furniture',
      material: body.material || 'Polywood',
      color: body.color || '',
      dimensions: body.dimensions || {},
      price: body.price,
      images: body.images || [],
      reorderLevel: body.reorderLevel ?? 5
    });

    const inventory = await Inventory.create({
      product: product._id,
      availableQty: body.initialQty ?? 0,
      reorderLevel: body.reorderLevel ?? 5
    });

    return res.status(201).json({ product, inventory });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
