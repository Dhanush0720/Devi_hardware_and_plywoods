import mongoose from 'mongoose';

// One inventory document per product. `availableQty` is the source of truth
// used for atomic stock decrements (see lib/services/stockService.js).
const InventorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      unique: true
    },
    availableQty: { type: Number, required: true, default: 0, min: 0 },
    reservedQty: { type: Number, required: true, default: 0, min: 0 },
    reorderLevel: { type: Number, required: true, default: 5, min: 0 }
  },
  { timestamps: true }
);

InventorySchema.virtual('isLowStock').get(function () {
  return this.availableQty <= this.reorderLevel;
});

InventorySchema.set('toJSON', { virtuals: true });

export default mongoose.models.Inventory || mongoose.model('Inventory', InventorySchema);
