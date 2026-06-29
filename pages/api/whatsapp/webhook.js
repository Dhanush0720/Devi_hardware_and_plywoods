import connectDB from '../../../lib/db';
import Order from '../../../lib/models/Order';
import WhatsAppLog from '../../../lib/models/WhatsAppLog';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'polywood_verify_token_123';

    if (mode === 'subscribe' && token === verifyToken) {
      res.setHeader('Content-Type', 'text/plain');
      return res.status(200).send(challenge);
    }
    return res.status(403).json({ error: 'Verification token mismatch' });
  }

  if (req.method === 'POST') {
    const { object, entry } = req.body || {};

    if (object === 'whatsapp_business_account' && Array.isArray(entry)) {
      await connectDB();

      for (const ent of entry) {
        if (!Array.isArray(ent.changes)) continue;
        for (const change of ent.changes) {
          const value = change.value;
          if (!value || !Array.isArray(value.statuses)) continue;

          for (const statusObj of value.statuses) {
            const { id: messageId, status, errors } = statusObj;

            if (['sent', 'delivered', 'read', 'failed'].includes(status)) {
              // Find matching order
              const order = await Order.findOne({ whatsappMessageId: messageId });
              if (order) {
                order.whatsappStatus = status;
                await order.save();

                let phone = 'unknown';
                if (order.customer) {
                  const populated = await Order.findById(order._id).populate('customer');
                  phone = populated?.customer?.phone || 'unknown';
                }

                // Log the webhook status callback
                await WhatsAppLog.create({
                  order: order._id,
                  customerPhone: phone,
                  templateName: 'webhook_callback',
                  status: status,
                  providerMessageId: messageId,
                  errorMessage: errors ? JSON.stringify(errors) : null,
                  payloadSnapshot: statusObj
                });
              }
            }
          }
        }
      }
      return res.status(200).json({ success: true });
    }

    return res.status(200).json({ status: 'ignored' });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
