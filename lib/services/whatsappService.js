import axios from 'axios';
import WhatsAppLog from '../models/WhatsAppLog';

const TEMPLATE_NAME = process.env.WHATSAPP_ORDER_TEMPLATE_NAME || 'order_confirmation_invoice';

/**
 * Sends a WhatsApp utility message confirming the order + invoice.
 *
 * Until WHATSAPP_ENABLED=true and real Meta credentials are set, this
 * runs in "stub mode": it logs the would-be message to WhatsAppLog with
 * status `skipped_not_configured` instead of calling the API, so the
 * rest of the order flow (stock, invoice, dashboard) works end to end
 * before WhatsApp is wired up.
 *
 * Expects an APPROVED WhatsApp message template (utility category) with
 * placeholders matching the order: {{1}} customer name, {{2}} order number,
 * {{3}} total amount, {{4}} invoice link. Adjust to match your actual
 * approved template's component structure in Meta Business Manager.
 */
export async function sendOrderConfirmationWhatsApp({ order, customer, invoice }) {
  const payloadSnapshot = {
    templateName: TEMPLATE_NAME,
    to: customer.phone,
    params: [customer.name, order.orderNumber, String(order.total), invoice.pdfUrl]
  };

  const enabled = process.env.WHATSAPP_ENABLED === 'true';
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v20.0';

  if (!enabled || !phoneNumberId || !accessToken) {
    const log = await WhatsAppLog.create({
      order: order._id,
      customerPhone: customer.phone,
      templateName: TEMPLATE_NAME,
      status: 'skipped_not_configured',
      payloadSnapshot
    });
    return { ok: false, skipped: true, log };
  }

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  const body = {
    messaging_product: 'whatsapp',
    to: normalizePhone(customer.phone),
    type: 'template',
    template: {
      name: TEMPLATE_NAME,
      language: { code: 'en' },
      components: [
        {
          type: 'body',
          parameters: payloadSnapshot.params.map((text) => ({ type: 'text', text }))
        }
      ]
    }
  };

  try {
    const response = await axios.post(url, body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const providerMessageId = response.data?.messages?.[0]?.id || null;

    const log = await WhatsAppLog.create({
      order: order._id,
      customerPhone: customer.phone,
      templateName: TEMPLATE_NAME,
      status: 'sent',
      providerMessageId,
      payloadSnapshot
    });

    return { ok: true, log, providerMessageId };
  } catch (err) {
    const errorMessage = err.response?.data?.error?.message || err.message;

    const log = await WhatsAppLog.create({
      order: order._id,
      customerPhone: customer.phone,
      templateName: TEMPLATE_NAME,
      status: 'failed',
      errorMessage,
      payloadSnapshot
    });

    return { ok: false, log, errorMessage };
  }
}

function normalizePhone(phone) {
  // Meta's API expects digits only, with country code, no leading "+".
  return phone.replace(/[^\d]/g, '');
}

export async function sendLowStockAlertAdmin(product, availableQty) {
  const adminPhone = process.env.ADMIN_PHONE || '919876543210';
  const templateName = 'low_stock_admin_alert';

  const payloadSnapshot = {
    templateName,
    to: adminPhone,
    params: [product.name, product.sku, String(availableQty), String(product.reorderLevel)]
  };

  const enabled = process.env.WHATSAPP_ENABLED === 'true';
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v20.0';

  if (!enabled || !phoneNumberId || !accessToken) {
    const log = await WhatsAppLog.create({
      order: null,
      customerPhone: adminPhone,
      templateName,
      status: 'skipped_not_configured',
      payloadSnapshot
    });
    return { ok: false, skipped: true, log };
  }

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  const body = {
    messaging_product: 'whatsapp',
    to: adminPhone.replace(/[^\d]/g, ''),
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'en' },
      components: [
        {
          type: 'body',
          parameters: payloadSnapshot.params.map((text) => ({ type: 'text', text }))
        }
      ]
    }
  };

  try {
    const response = await axios.post(url, body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const providerMessageId = response.data?.messages?.[0]?.id || null;

    const log = await WhatsAppLog.create({
      order: null,
      customerPhone: adminPhone,
      templateName,
      status: 'sent',
      providerMessageId,
      payloadSnapshot
    });

    return { ok: true, log, providerMessageId };
  } catch (err) {
    const errorMessage = err.response?.data?.error?.message || err.message;

    const log = await WhatsAppLog.create({
      order: null,
      customerPhone: adminPhone,
      templateName,
      status: 'failed',
      errorMessage,
      payloadSnapshot
    });

    return { ok: false, log, errorMessage };
  }
}
