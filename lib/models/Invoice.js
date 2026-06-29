import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true }, // e.g. INV-2026-00001
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    total: { type: Number, required: true },
    pdfUrl: { type: String, required: true }, // public URL or storage path
    issuedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);
