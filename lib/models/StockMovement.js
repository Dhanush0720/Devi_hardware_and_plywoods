import mongoose from 'mongoose';

const StockMovementSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    type: {
      type: String,
      required: true,
      enum: ['sale', 'return', 'manual_increase', 'manual_decrease', 'cancellation', 'restock']
    },
    quantityChange: { type: Number, required: true }, // negative for decreases
    quantityBefore: { type: Number, required: true },
    quantityAfter: { type: Number, required: true },
    relatedOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    note: { type: String, default: '' },
    actor: { type: String, default: 'system' } // 'system' | 'admin' | admin email
  },
  { timestamps: true }
);

StockMovementSchema.index({ product: 1, createdAt: -1 });

export default mongoose.models.StockMovement ||
  mongoose.model('StockMovement', StockMovementSchema);
