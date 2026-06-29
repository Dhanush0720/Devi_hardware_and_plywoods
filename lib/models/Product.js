import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      required: true,
      enum: ['Furniture', 'Doors', 'Boards', 'Outdoor', 'Decking', 'Accessories', 'Other'],
      default: 'Furniture'
    },
    material: { type: String, default: 'Polywood' },
    color: { type: String, default: '' },
    dimensions: {
      length: { type: Number, default: null }, // cm
      width: { type: Number, default: null },
      height: { type: Number, default: null }
    },
    price: { type: Number, required: true, min: 0 },
    images: [{ type: String }],
    isActive: { type: Boolean, default: true },
    reorderLevel: { type: Number, default: 5, min: 0 }
  },
  { timestamps: true }
);

ProductSchema.index({ name: 'text', sku: 'text', category: 1 });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
