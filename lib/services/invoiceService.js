import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const SHOP_NAME = 'Devi hardware and plywoods';
const SHOP_ADDRESS = '5-1k, Beside anjaneya swami temple, Nuzvid road, Mylavaram - 521230';
const SHOP_GSTIN = 'GSTIN: 22AAAAA0000A1Z5';
const SHOP_PHONE = '+91 91828 78083';

/**
 * Renders an invoice PDF to a buffer, then persists it according to
 * INVOICE_STORAGE (local disk under /public/invoices for now; swap the
 * `saveBuffer` implementation for S3/Cloudinary/etc. in production since
 * Vercel's filesystem is ephemeral/read-only at runtime).
 *
 * Returns { pdfUrl, filePath }.
 */
export async function generateInvoicePdf({ invoiceNumber, order, customer }) {
  const buffer = await renderInvoiceBuffer({ invoiceNumber, order, customer });
  return saveBuffer(invoiceNumber, buffer);
}

function renderInvoiceBuffer({ invoiceNumber, order, customer }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).fillColor('#46301c').text(SHOP_NAME, { continued: false });
    doc.fontSize(9).fillColor('#555').text(SHOP_ADDRESS);
    doc.text(`${SHOP_GSTIN}  |  Phone: ${SHOP_PHONE}`);
    doc.moveDown(1);

    doc
      .fontSize(14)
      .fillColor('#000')
      .text('TAX INVOICE', { align: 'right' });
    doc.fontSize(10).fillColor('#333');
    doc.text(`Invoice No: ${invoiceNumber}`, { align: 'right' });
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, { align: 'right' });
    doc.text(`Order No: ${order.orderNumber}`, { align: 'right' });

    doc.moveDown(1);
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor('#bd9a66')
      .stroke();
    doc.moveDown(0.8);

    // Bill to
    doc.fontSize(11).fillColor('#000').text('Bill To:', { underline: true });
    doc.fontSize(10).fillColor('#333');
    doc.text(customer.name);
    doc.text(customer.phone);
    if (customer.address?.line1) {
      const addr = customer.address;
      doc.text(
        [addr.line1, addr.line2, addr.city, addr.state, addr.pincode]
          .filter(Boolean)
          .join(', ')
      );
    }
    doc.moveDown(1);

    // Table header
    const tableTop = doc.y;
    const colX = { item: 50, sku: 230, qty: 330, price: 390, total: 470 };
    doc.fontSize(10).fillColor('#fff');
    doc.rect(50, tableTop, 495, 22).fill('#46301c');
    doc.fillColor('#fff');
    doc.text('Item', colX.item + 5, tableTop + 6);
    doc.text('SKU', colX.sku, tableTop + 6);
    doc.text('Qty', colX.qty, tableTop + 6);
    doc.text('Price', colX.price, tableTop + 6);
    doc.text('Total', colX.total, tableTop + 6);

    let y = tableTop + 22;
    doc.fillColor('#333');
    order.items.forEach((item, idx) => {
      const rowBg = idx % 2 === 0 ? '#f4f0ea' : '#ffffff';
      doc.rect(50, y, 495, 20).fill(rowBg);
      doc.fillColor('#333');
      doc.fontSize(9).text(item.name, colX.item + 5, y + 5, { width: 170 });
      doc.text(item.sku, colX.sku, y + 5, { width: 90 });
      doc.text(String(item.quantity), colX.qty, y + 5);
      doc.text(formatCurrency(item.unitPrice), colX.price, y + 5);
      doc.text(formatCurrency(item.lineTotal), colX.total, y + 5);
      y += 20;
    });

    y += 10;
    doc.fontSize(10).fillColor('#000');
    doc.text(`Subtotal: ${formatCurrency(order.subtotal)}`, 350, y, { align: 'right', width: 195 });
    y += 16;
    doc.text(`Tax: ${formatCurrency(order.tax)}`, 350, y, { align: 'right', width: 195 });
    y += 16;
    doc.fontSize(12).fillColor('#46301c');
    doc.text(`Total: ${formatCurrency(order.total)}`, 350, y, { align: 'right', width: 195 });

    doc.moveDown(3);
    doc
      .fontSize(8)
      .fillColor('#888')
      .text(
        'This is a system-generated invoice. Thank you for shopping with us.',
        50,
        doc.y,
        { align: 'center', width: 495 }
      );

    doc.end();
  });
}

function formatCurrency(value) {
  return `Rs. ${Number(value).toFixed(2)}`;
}

async function saveBuffer(invoiceNumber, buffer) {
  const storageMode = process.env.INVOICE_STORAGE || 'local';
  const filename = `${invoiceNumber}.pdf`;

  if (storageMode === 'local') {
    const dir = path.join(process.cwd(), 'public', 'invoices');
    await fs.promises.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, filename);
    await fs.promises.writeFile(filePath, buffer);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    return { pdfUrl: `${baseUrl}/invoices/${filename}`, filePath };
  }

  // Placeholder for cloud storage providers (S3 / Cloudinary / GCS).
  // Implement upload here and return the public URL, e.g.:
  //
  // const url = await uploadToS3(filename, buffer);
  // return { pdfUrl: url, filePath: null };
  throw new Error(
    `INVOICE_STORAGE="${storageMode}" is not implemented yet. Add your cloud upload logic in lib/services/invoiceService.js`
  );
}
