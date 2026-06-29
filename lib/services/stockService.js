import mongoose from 'mongoose';
import Inventory from '../models/Inventory';
import StockMovement from '../models/StockMovement';
import Product from '../models/Product';
import { sendLowStockAlertAdmin } from './whatsappService';

/**
 * Atomically decrements stock for a single product.
 * Uses a conditional update (availableQty >= qty) so concurrent requests
 * can never push availableQty below zero — MongoDB guarantees the
 * findOneAndUpdate is atomic at the document level.
 *
 * Throws InsufficientStockError if not enough stock is available.
 */
export class InsufficientStockError extends Error {
  constructor(productId) {
    super(`Insufficient stock for product ${productId}`);
    this.name = 'InsufficientStockError';
    this.productId = productId;
  }
}

export async function decrementStock(productId, qty, { orderId = null, actor = 'system' } = {}) {
  const updated = await Inventory.findOneAndUpdate(
    { product: productId, availableQty: { $gte: qty } },
    { $inc: { availableQty: -qty } },
    { new: true }
  );

  if (!updated) {
    throw new InsufficientStockError(productId);
  }

  await StockMovement.create({
    product: productId,
    type: 'sale',
    quantityChange: -qty,
    quantityBefore: updated.availableQty + qty,
    quantityAfter: updated.availableQty,
    relatedOrder: orderId,
    actor
  });

  if (updated.availableQty <= updated.reorderLevel) {
    (async () => {
      try {
        const product = await Product.findById(productId);
        if (product) {
          await sendLowStockAlertAdmin(product, updated.availableQty);
        }
      } catch (err) {
        console.error('[stockService] failed to send low stock alert:', err);
      }
    })();
  }

  return updated;
}

/**
 * Restores stock — used for cancellations/returns. Also atomic via $inc,
 * and always allowed (no lower-bound check needed when adding stock back).
 */
export async function restoreStock(productId, qty, { orderId = null, type = 'cancellation', actor = 'system', note = '' } = {}) {
  const updated = await Inventory.findOneAndUpdate(
    { product: productId },
    { $inc: { availableQty: qty } },
    { new: true }
  );

  if (!updated) {
    throw new Error(`Inventory record not found for product ${productId}`);
  }

  await StockMovement.create({
    product: productId,
    type,
    quantityChange: qty,
    quantityBefore: updated.availableQty - qty,
    quantityAfter: updated.availableQty,
    relatedOrder: orderId,
    actor,
    note
  });

  return updated;
}

/**
 * Manual stock adjustment from the admin dashboard (restock, correction, etc).
 * `qty` can be positive or negative.
 */
export async function adjustStockManually(productId, qty, { actor = 'admin', note = '' } = {}) {
  if (qty === 0) throw new Error('Quantity change cannot be zero');

  const filter = { product: productId };
  if (qty < 0) {
    filter.availableQty = { $gte: Math.abs(qty) };
  }

  const updated = await Inventory.findOneAndUpdate(
    filter,
    { $inc: { availableQty: qty } },
    { new: true }
  );

  if (!updated) {
    throw new InsufficientStockError(productId);
  }

  await StockMovement.create({
    product: productId,
    type: qty > 0 ? 'manual_increase' : 'manual_decrease',
    quantityChange: qty,
    quantityBefore: updated.availableQty - qty,
    quantityAfter: updated.availableQty,
    actor,
    note
  });

  return updated;
}

/**
 * Decrements stock for an entire order's line items.
 * If any single item fails (insufficient stock), every already-applied
 * decrement in this call is rolled back before throwing, so the order
 * creation flow can safely abort without leaving inventory inconsistent.
 *
 * Note: for true multi-document ACID transactions, wrap this in a
 * MongoDB session/transaction when running against a replica set
 * (MongoDB Atlas supports this out of the box).
 */
export async function decrementStockForItems(items, { orderId = null, actor = 'system' } = {}) {
  const applied = [];

  try {
    for (const item of items) {
      const result = await decrementStock(item.product, item.quantity, { orderId, actor });
      applied.push({ product: item.product, quantity: item.quantity });
    }
  } catch (err) {
    // Roll back everything already decremented in this batch.
    for (const a of applied) {
      await restoreStock(a.product, a.quantity, {
        orderId,
        type: 'cancellation',
        actor,
        note: 'Rollback after failed multi-item stock decrement'
      });
    }
    throw err;
  }

  return true;
}

export async function withTransactionIfSupported(fn) {
  // Helper for environments where a replica-set connection is available
  // (MongoDB Atlas always is). Falls back to running without a session
  // if transactions aren't supported by the deployment.
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } catch (err) {
    if (String(err.message || '').includes('Transaction numbers')) {
      // Standalone Mongo without replica set — run without a session.
      return fn(null);
    }
    throw err;
  } finally {
    session.endSession();
  }
}
