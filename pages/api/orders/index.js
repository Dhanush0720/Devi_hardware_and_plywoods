import connectDB from '../../../lib/db';
import Product from '../../../lib/models/Product';
import Customer from '../../../lib/models/Customer';
import Order from '../../../lib/models/Order';
import Invoice from '../../../lib/models/Invoice';
import { decrementStockForItems, restoreStock } from '../../../lib/services/stockService';
import { generateInvoicePdf } from '../../../lib/services/invoiceService';
import { sendOrderConfirmationWhatsApp } from '../../../lib/services/whatsappService';
import { nextOrderNumber, nextInvoiceNumber } from '../../../lib/utils/sequence';

export default async function handler(req, res) {
  await connectDB();

  if (req.method === 'GET') {
    return listOrders(req, res);
  }

  if (req.method === 'POST') {
    return createOrder(req, res);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}

async function listOrders(req, res) {
  const { status, limit = 50, analytics, range = '7d' } = req.query;

  if (analytics === 'true') {
    let startDate = new Date();
    let groupFormat = '%Y-%m-%d';

    if (range === '7d') {
      startDate.setDate(startDate.getDate() - 7);
      groupFormat = '%Y-%m-%d';
    } else if (range === '30d') {
      startDate.setDate(startDate.getDate() - 30);
      groupFormat = '%Y-%m-%d';
    } else if (range === '12m') {
      startDate.setMonth(startDate.getMonth() - 12);
      groupFormat = '%Y-%m';
    }

    try {
      const salesOverTime = await Order.aggregate([
        {
          $match: {
            status: { $ne: 'cancelled' },
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
            totalSales: { $sum: '$total' },
            orderCount: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      const categoryBreakdown = await Order.aggregate([
        {
          $match: {
            status: { $ne: 'cancelled' },
            createdAt: { $gte: startDate }
          }
        },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'products',
            localField: 'items.product',
            foreignField: '_id',
            as: 'productInfo'
          }
        },
        { $unwind: '$productInfo' },
        {
          $group: {
            _id: '$productInfo.category',
            value: { $sum: '$items.lineTotal' }
          }
        },
        { $sort: { value: -1 } }
      ]);

      return res.status(200).json({ salesOverTime, categoryBreakdown });
    } catch (err) {
      console.error('[orders] analytics failed', err);
      return res.status(500).json({ error: 'Failed to compute analytics', detail: err.message });
    }
  }

  const filter = {};
  if (status) filter.status = status;

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    const matchingCustomers = await Customer.find({
      $or: [
        { name: searchRegex },
        { phone: searchRegex }
      ]
    });
    const customerIds = matchingCustomers.map((c) => c._id);
    filter.$or = [
      { orderNumber: searchRegex },
      { customer: { $in: customerIds } }
    ];
  }

  const orders = await Order.find(filter)
    .populate('customer')
    .populate('invoice')
    .sort({ createdAt: -1 })
    .limit(Number(limit));

  return res.status(200).json({ orders });
}

async function createOrder(req, res) {
  const { customer: customerInput, items, shippingAddress } = req.body || {};

  if (!customerInput?.name || !customerInput?.phone) {
    return res.status(400).json({ error: 'Customer name and phone are required' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must contain at least one item' });
  }

  // Step 1: Resolve / create customer.
  let customer = await Customer.findOne({ phone: customerInput.phone });
  if (!customer) {
    customer = await Customer.create({
      name: customerInput.name,
      phone: customerInput.phone,
      email: customerInput.email || '',
      address: shippingAddress || {}
    });
  }

  // Step 2: Load products and validate, build line items with price snapshots.
  const productIds = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds }, isActive: true });
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  const lineItems = [];
  for (const i of items) {
    const product = productMap.get(String(i.productId));
    if (!product) {
      return res.status(400).json({ error: `Product ${i.productId} not found or inactive` });
    }
    const quantity = Number(i.quantity);
    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: `Invalid quantity for product ${product.name}` });
    }
    const lineTotal = Number((product.price * quantity).toFixed(2));
    lineItems.push({
      product: product._id,
      name: product.name,
      sku: product.sku,
      unitPrice: product.price,
      quantity,
      lineTotal
    });
  }

  const subtotal = lineItems.reduce((sum, i) => sum + i.lineTotal, 0);
  const tax = Number((subtotal * 0.18).toFixed(2)); // adjust GST rate as needed
  const total = Number((subtotal + tax).toFixed(2));

  // Step 3: Atomically check & decrement stock for every item.
  // decrementStockForItems rolls back any partial decrements on failure.
  let stockDecremented = false;
  try {
    await decrementStockForItems(
      lineItems.map((i) => ({ product: i.product, quantity: i.quantity })),
      { actor: 'system' }
    );
    stockDecremented = true;
  } catch (err) {
    return res.status(409).json({
      error: 'One or more items are out of stock. Order was not placed.',
      detail: err.message
    });
  }

  try {
    // Step 4: Create the order record.
    const orderNumber = await nextOrderNumber();
    const order = await Order.create({
      orderNumber,
      customer: customer._id,
      items: lineItems,
      subtotal,
      tax,
      total,
      status: 'confirmed',
      shippingAddress: shippingAddress || customer.address
    });

    // Step 5 & 6: Generate PDF invoice and store its URL.
    const invoiceNumber = await nextInvoiceNumber();
    const { pdfUrl } = await generateInvoicePdf({ invoiceNumber, order, customer });
    const invoice = await Invoice.create({
      invoiceNumber,
      order: order._id,
      customer: customer._id,
      total: order.total,
      pdfUrl
    });
    order.invoice = invoice._id;
    await order.save();

    // Step 7 & 8: Send WhatsApp confirmation and record status.
    const whatsappResult = await sendOrderConfirmationWhatsApp({ order, customer, invoice });
    order.whatsappStatus = whatsappResult.ok ? 'sent' : whatsappResult.skipped ? 'not_sent' : 'failed';
    if (whatsappResult.providerMessageId) {
      order.whatsappMessageId = whatsappResult.providerMessageId;
    }
    await order.save();

    const populatedOrder = await Order.findById(order._id).populate('customer').populate('invoice');

    return res.status(201).json({
      order: populatedOrder,
      whatsapp: {
        skipped: !!whatsappResult.skipped,
        ok: !!whatsappResult.ok,
        message: whatsappResult.skipped
          ? 'WhatsApp not configured yet — message was logged but not sent.'
          : whatsappResult.ok
          ? 'WhatsApp confirmation sent.'
          : `WhatsApp send failed: ${whatsappResult.errorMessage}`
      }
    });
  } catch (err) {
    // Step failure after stock was already decremented — restore it so
    // inventory stays consistent (order creation/invoice/whatsapp failures
    // should never silently leave stock reduced for a non-existent order).
    if (stockDecremented) {
      for (const i of lineItems) {
        await restoreStock(i.product, i.quantity, {
          type: 'cancellation',
          note: 'Rollback after order processing failure'
        });
      }
    }
    console.error('[orders] creation failed', err);
    return res.status(500).json({ error: 'Failed to process order', detail: err.message });
  }
}
