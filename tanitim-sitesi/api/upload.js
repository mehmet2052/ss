const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['video/mp4', 'video/quicktime', 'video/webm'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Geçersiz dosya türü'));
  }
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      return res.status(500).json({ error: 'Telegram configuration missing' });
    }

    // Handle file upload
    upload.single('file')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Dosya bulunamadı' });
      }

      // File size check (50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (req.file.size > maxSize) {
        return res.status(400).json({ error: 'Dosya çok büyük! Maksimum 50MB olmalı.' });
      }

      const form = new FormData();
      form.append('chat_id', TELEGRAM_CHAT_ID);
      form.append('video', req.file.buffer, {
        filename: req.file.originalname || 'video.mp4',
        contentType: req.file.mimetype
      });
      form.append('caption', '🎥 Yeni video yüklendi!');

      const response = await axios.post(`${TELEGRAM_API_URL}/sendVideo`, form, {
        headers: form.getHeaders(),
        timeout: 600000, // 10 minutes timeout
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      if (response.data.ok) {
        return res.status(200).json({ message: 'Video Telegram\'a gönderildi!' });
      }
      
      return res.status(500).json({ error: 'Telegram gönderimi başarısız: ' + JSON.stringify(response.data) });
    });

  } catch (err) {
    console.error('Upload error:', err);
    const message = err?.response?.data?.description || err?.message || 'Sunucu hatası';
    return res.status(500).json({ error: 'Upload hatası: ' + message });
  }
}
