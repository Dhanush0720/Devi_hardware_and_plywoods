import connectDB from '../../../lib/db';
import Product from '../../../lib/models/Product';
import Inventory from '../../../lib/models/Inventory';

export default async function handler(req, res) {
  await connectDB();
  const { id } = req.query;

  if (req.method === 'GET') {
    const product = await Product.findById(id).lean();
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const inventory = await Inventory.findOne({ product: id }).lean();
    return res.status(200).json({ product, inventory });
  }

  if (req.method === 'PUT') {
    const body = req.body || {};
    const product = await Product.findByIdAndUpdate(
      id,
      {
        name: body.name,
        description: body.description,
        category: body.category,
        material: body.material,
        color: body.color,
        dimensions: body.dimensions,
        price: body.price,
        images: body.images,
        isActive: body.isActive,
        reorderLevel: body.reorderLevel
      },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });

    if (body.reorderLevel != null) {
      await Inventory.findOneAndUpdate({ product: id }, { reorderLevel: body.reorderLevel });
    }

    return res.status(200).json({ product });
  }

  if (req.method === 'DELETE') {
    // Soft delete preferred so historical orders keep valid references.
    const product = await Product.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    return res.status(200).json({ product, message: 'Product deactivated' });
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
