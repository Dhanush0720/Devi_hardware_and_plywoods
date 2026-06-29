import mongoose from 'mongoose';

const WhatsAppLogSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    customerPhone: { type: String, required: true },
    templateName: { type: String, required: true },
    status: {
      type: String,
      enum: ['queued', 'sent', 'delivered', 'read', 'failed', 'skipped_not_configured'],
      default: 'queued'
    },
    providerMessageId: { type: String, default: null },
    errorMessage: { type: String, default: null },
    payloadSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export default mongoose.models.WhatsAppLog ||
  mongoose.model('WhatsAppLog', WhatsAppLogSchema);
