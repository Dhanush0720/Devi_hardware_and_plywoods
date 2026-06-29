import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true }, // E.164 format, e.g. +919876543210
    email: { type: String, default: '', trim: true, lowercase: true },
    address: {
      line1: { type: String, default: '' },
      line2: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
      country: { type: String, default: 'India' }
    }
  },
  { timestamps: true }
);

CustomerSchema.index({ phone: 1 });

export default mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
