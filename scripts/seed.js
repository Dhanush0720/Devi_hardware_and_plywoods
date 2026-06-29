/**
 * Run with: node scripts/seed.js
 * Populates a few sample polywood products + inventory for local testing.
 */
require('dotenv').config({ path: '.env.local' });
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const ProductSchema = new mongoose.Schema({}, { strict: false });
  const InventorySchema = new mongoose.Schema({}, { strict: false });
  const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema, 'products');
  const Inventory = mongoose.models.Inventory || mongoose.model('Inventory', InventorySchema, 'inventories');

  const samples = [
    { sku: 'PW-CH-001', name: 'Adirondack Polywood Chair', category: 'Outdoor', price: 8499, qty: 12 },
    { sku: 'PW-DR-002', name: 'Classic Polywood Door Panel', category: 'Doors', price: 14999, qty: 6 },
    { sku: 'PW-BD-003', name: 'Polywood Decking Board 4ft', category: 'Decking', price: 1299, qty: 40 },
    { sku: 'PW-TB-004', name: 'Polywood Dining Table', category: 'Furniture', price: 22999, qty: 4 },
    { sku: 'PW-BN-005', name: 'Garden Bench - Polywood', category: 'Outdoor', price: 11499, qty: 8 }
  ];

  for (const s of samples) {
    let product = await Product.findOne({ sku: s.sku });
    if (!product) {
      product = await Product.create({
        sku: s.sku,
        name: s.name,
        description: `${s.name} crafted from premium recycled polywood material.`,
        category: s.category,
        material: 'Polywood',
        color: 'Teak Brown',
        dimensions: { length: 120, width: 60, height: 80 },
        price: s.price,
        images: [],
        isActive: true,
        reorderLevel: 5
      });
      await Inventory.create({ product: product._id, availableQty: s.qty, reservedQty: 0, reorderLevel: 5 });
      console.log(`Created ${s.name}`);
    } else {
      console.log(`Skipped (exists): ${s.name}`);
    }
  }

  await mongoose.disconnect();
  console.log('Seed complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
