# Polywood Living — Inventory & Sales Management App

Full-stack inventory + sales management system for a polywood shop, built with
Next.js (App Router not used — Pages Router for simplicity), Tailwind CSS,
MongoDB/Mongoose, PDF invoicing, and WhatsApp Business Cloud API integration.

## Tech stack

- **Frontend:** Next.js (Pages Router) + React, Tailwind CSS, `next-themes` for dark mode
- **Backend:** Next.js API routes (Node.js)
- **Database:** MongoDB + Mongoose
- **PDF invoices:** `pdfkit`, generated server-side per order
- **WhatsApp:** Meta WhatsApp Business Cloud API (utility template messages)
- **Charts/UI:** `recharts`, `lucide-react`

## Project structure

```
polywood-shop/
├── lib/
│   ├── db.js                     # Mongoose connection (cached across requests)
│   ├── models/                   # Product, Inventory, Customer, Order, Invoice,
│   │                              # StockMovement, WhatsAppLog
│   ├── services/
│   │   ├── stockService.js       # Atomic stock increment/decrement + audit log
│   │   ├── invoiceService.js     # PDF generation + storage
│   │   └── whatsappService.js    # WhatsApp Cloud API integration (stub mode supported)
│   └── utils/sequence.js         # Order/invoice number generators
├── pages/
│   ├── index.js                  # Storefront — browse, filter, search
│   ├── product/[id].js           # Product detail
│   ├── cart.js
│   ├── checkout.js
│   ├── order-success.js
│   ├── admin/
│   │   ├── index.js              # Dashboard: stats, low-stock alerts, recent orders
│   │   ├── products.js           # Product CRUD
│   │   ├── orders.js             # Order list, status updates, invoice/WhatsApp status
│   │   └── inventory.js          # Stock levels + manual adjustments + movement log
│   └── api/
│       ├── products/             # GET/POST list+create, GET/PUT/DELETE by id
│       ├── inventory/[id].js     # Manual stock adjustment + movement history
│       └── orders/                # GET/POST list+create (full order workflow), GET/PATCH by id
├── components/                   # AdminLayout, StorefrontHeader, ProductCard, StatusBadge
├── context/CartContext.js        # Client-side cart (localStorage-backed)
├── scripts/seed.js                # Sample product seeder
└── .env.example
```

## MongoDB collections

| Collection       | Purpose                                                                 |
|------------------|--------------------------------------------------------------------------|
| `products`       | Catalog: SKU, name, category, material, color, dimensions, price, images |
| `inventories`    | One doc per product: `availableQty`, `reservedQty`, `reorderLevel`       |
| `stockmovements` | Append-only audit log of every stock change (sale, return, manual, cancel) |
| `customers`      | Name, phone (WhatsApp number), email, address                            |
| `orders`         | Line items, totals, status, linked invoice, WhatsApp delivery status     |
| `invoices`       | Invoice number, linked order, PDF URL                                    |
| `whatsapplogs`   | Every WhatsApp send attempt with status (sent/failed/skipped) and payload |

## How overselling is prevented

`lib/services/stockService.js` decrements stock using a **conditional atomic
update**:

```js
Inventory.findOneAndUpdate(
  { product: productId, availableQty: { $gte: qty } },
  { $inc: { availableQty: -qty } },
  { new: true }
);
```

MongoDB guarantees this is atomic at the document level, so two concurrent
orders for the last unit can never both succeed — whichever request loses
the race gets `null` back and the order creation API returns `409 Conflict`
without ever decrementing past zero. Every change (sale, return, manual
adjustment, cancellation) is also written to `stockmovements` for a full audit
trail, as requested.

For multi-item orders, `decrementStockForItems` decrements each item in turn
and **rolls back** any already-applied decrements if a later item fails,
so partial orders never leave inventory inconsistent.

## Order workflow (implemented exactly as specified)

`pages/api/orders/index.js` → `createOrder()`:

1. Resolve or create the customer record
2. Validate products + build price-snapshotted line items
3. Atomically check & decrement stock for every item (abort + 409 if any item is short)
4. Create the order record
5. Generate the PDF invoice
6. Store the invoice URL
7. Send the WhatsApp confirmation (or log it as skipped if WhatsApp isn't configured yet)
8. Save the WhatsApp send status on the order
9. Admin dashboard reflects updated stock immediately (next fetch)

## Getting started locally

```bash
cd polywood-shop
npm install
cp .env.example .env.local
# edit .env.local — at minimum set MONGODB_URI

npm run dev
# storefront: http://localhost:3000
# admin:      http://localhost:3000/admin

# optional: seed a few sample products
node scripts/seed.js
```

## WhatsApp setup (when you're ready)

You don't have Meta WhatsApp Business API credentials yet — that's fine. The
app runs in **stub mode** by default (`WHATSAPP_ENABLED=false`): every order
still completes normally, and the would-be WhatsApp message is logged to the
`whatsapplogs` collection with status `skipped_not_configured` so you can see
exactly what *would* have been sent.

When you're ready to go live:

1. Create a Meta Business account → set up a WhatsApp Business app in
   [Meta for Developers](https://developers.facebook.com/).
2. Get a permanent access token + your Phone Number ID from the WhatsApp
   Cloud API dashboard.
3. Submit a **utility-category** message template (e.g.
   `order_confirmation_invoice`) for approval — utility templates are the
   correct category for order/invoice notifications per Meta's policy.
4. Set in `.env.local`:
   ```
   WHATSAPP_ENABLED=true
   WHATSAPP_PHONE_NUMBER_ID=...
   WHATSAPP_ACCESS_TOKEN=...
   WHATSAPP_ORDER_TEMPLATE_NAME=order_confirmation_invoice
   ```
5. Update the template parameter order in `lib/services/whatsappService.js`
   to match your approved template's exact placeholder structure.

No other code changes are needed — the order flow already calls this service.

## Invoice storage note

PDFs are written to `public/invoices/` by default (`INVOICE_STORAGE=local`),
which works for local dev but **not** for Vercel production, since Vercel's
filesystem is read-only/ephemeral there. Before deploying:

- Swap `saveBuffer()` in `lib/services/invoiceService.js` for an upload to
  S3, Cloudinary, or another object store, and set `INVOICE_STORAGE` to a
  matching value (e.g. `s3`).

## Google APIs

Per the spec, Google APIs (Maps/Places) are intended only for shop location
and business details — e.g. embedding a map or "Find us" link on the
storefront — and are never used in stock or order logic. No Maps integration
is wired up yet since it wasn't core to the workflow; add a Google Maps embed
component using `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` whenever you want a "Visit
our shop" section.

## Deployment (Vercel + MongoDB Atlas)

1. **MongoDB Atlas:** create a free or M10+ cluster, add a database user,
   allow network access from Vercel (or `0.0.0.0/0` for simplicity early on),
   copy the connection string into `MONGODB_URI`.
2. **Vercel:**
   - Import this repo into a new Vercel project.
   - Add all variables from `.env.example` under Project Settings → Environment Variables.
   - Set `INVOICE_STORAGE` to your chosen cloud storage option (see note above) before going to production.
   - Deploy. Vercel auto-detects the Next.js app.
3. **Admin auth:** the current admin pages have no login wall — they're meant
   for trusted local/internal use during development. Before exposing this
   publicly, add real authentication (e.g. NextAuth, or a simple middleware
   checking a session cookie against `ADMIN_EMAIL`/`ADMIN_PASSWORD`).

## What's intentionally left simple (extend as needed)

- Admin dashboard has no login/auth yet — add this before production.
- No image upload — products take direct image URLs; wire up an uploader
  (Cloudinary, S3, or Vercel Blob) when ready.
- Tax is a flat 18% GST in the order API — adjust the rate or make it
  per-category if needed.
- No pagination on product/order lists yet — fine for a single shop's
  catalog size, but add it if the catalog grows large.
