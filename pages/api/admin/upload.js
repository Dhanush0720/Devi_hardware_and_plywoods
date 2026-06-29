import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024,
  });

  return new Promise((resolve) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('[upload] Error parsing form', err);
        res.status(500).json({ error: 'Error uploading file' });
        return resolve();
      }

      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!file) {
        res.status(400).json({ error: 'No file uploaded' });
        return resolve();
      }

      const filename = path.basename(file.filepath || file.path);
      const fileUrl = `/uploads/${filename}`;

      res.status(200).json({ url: fileUrl });
      return resolve();
    });
  });
}
