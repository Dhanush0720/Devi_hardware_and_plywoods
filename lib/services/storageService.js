import fs from 'fs';
import path from 'path';

/**
 * Uploads a file from a local temporary path.
 * 
 * @param {string} tempPath - Absolute path to the temporary file.
 * @param {string} fileName - Original file name with extension.
 * @param {string} folder - Destination folder name (mainly for Cloudinary).
 * @returns {Promise<string>} Public URL of the uploaded file.
 */
export async function uploadFile(tempPath, fileName, folder = 'products') {
  // 1. Vercel Blob
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { put } = await import('@vercel/blob');
      const fileStream = fs.createReadStream(tempPath);
      const blob = await put(`${folder}/${fileName}`, fileStream, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      // Clean up temp file
      try { fs.unlinkSync(tempPath); } catch (_) {}
      return blob.url;
    } catch (err) {
      console.error('[storageService] Vercel Blob upload failed:', err);
      throw err;
    }
  }

  // 2. Cloudinary
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    try {
      const { v2: cloudinary } = await import('cloudinary');
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      const result = await cloudinary.uploader.upload(tempPath, {
        folder,
        use_filename: true,
      });
      // Clean up temp file
      try { fs.unlinkSync(tempPath); } catch (_) {}
      return result.secure_url;
    } catch (err) {
      console.error('[storageService] Cloudinary upload failed:', err);
      throw err;
    }
  }

  // 3. Fallback: Local Filesystem (only works in writeable environments)
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const destPath = path.join(uploadDir, fileName);
    fs.copyFileSync(tempPath, destPath);
    try { fs.unlinkSync(tempPath); } catch (_) {}
    
    // Return relative URL
    return `/uploads/${fileName}`;
  } catch (err) {
    console.error('[storageService] Local file write failed:', err);
    throw new Error(
      'Failed to save file locally. The filesystem might be read-only (like Vercel production). ' +
      'Please configure a cloud storage provider (e.g. BLOB_READ_WRITE_TOKEN or CLOUDINARY_CLOUD_NAME).'
    );
  }
}

/**
 * Uploads a Buffer (e.g. for PDFs).
 * 
 * @param {Buffer} buffer - File content buffer.
 * @param {string} fileName - Destination file name with extension.
 * @param {string} folder - Destination folder name.
 * @returns {Promise<string>} Public URL of the uploaded file.
 */
export async function uploadBuffer(buffer, fileName, folder = 'invoices') {
  // 1. Vercel Blob
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { put } = await import('@vercel/blob');
      const blob = await put(`${folder}/${fileName}`, buffer, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      return blob.url;
    } catch (err) {
      console.error('[storageService] Vercel Blob buffer upload failed:', err);
      throw err;
    }
  }

  // 2. Cloudinary
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    try {
      const { v2: cloudinary } = await import('cloudinary');
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            public_id: fileName.replace(/\.[^/.]+$/, ""), // strip extension
          },
          (error, result) => {
            if (error) {
              console.error('[storageService] Cloudinary buffer upload failed:', error);
              return reject(error);
            }
            resolve(result.secure_url);
          }
        );
        uploadStream.end(buffer);
      });
    } catch (err) {
      console.error('[storageService] Cloudinary buffer import/config failed:', err);
      throw err;
    }
  }

  // 3. Fallback: Local Filesystem (only works in writeable environments)
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'invoices');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    return `${baseUrl}/invoices/${fileName}`;
  } catch (err) {
    console.error('[storageService] Local buffer write failed:', err);
    throw new Error(
      'Failed to save PDF locally. The filesystem might be read-only (like Vercel production). ' +
      'Please configure a cloud storage provider (e.g. BLOB_READ_WRITE_TOKEN or CLOUDINARY_CLOUD_NAME).'
    );
  }
}
