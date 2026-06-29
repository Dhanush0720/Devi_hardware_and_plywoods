import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true }, // snapshot at purchase time
    sku: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true }
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true }, // e.g. PW-2026-00001
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'fulfilled'],
      default: 'pending'
    },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', default: null },
    whatsappStatus: {
      type: String,
      enum: ['not_sent', 'sent', 'delivered', 'read', 'failed'],
      default: 'not_sent'
    },
    whatsappMessageId: { type: String, default: null },
    shippingAddress: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      country: String
    }
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
