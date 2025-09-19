const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = '8006450272:AAH9iIYsQNw5i2MLjlEzD0iCLScTDNFMYyI';
const TELEGRAM_CHAT_ID = '1105436506'; // Telegram kanal ID
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

app.use(cors());

// Increase timeout for large file uploads
app.use((req, res, next) => {
  req.setTimeout(600000); // 10 minutes
  res.setTimeout(600000); // 10 minutes
  next();
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB (Telegram limiti)
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['video/mp4', 'video/quicktime', 'video/webm'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Geçersiz dosya türü'));
  }
});

// Chat ID'yi almak için endpoint
app.get('/api/get-chat-id', async (req, res) => {
  try {
    const response = await axios.get(`${TELEGRAM_API_URL}/getUpdates`);
    const updates = response.data.result;
    
    if (updates.length > 0) {
      const lastUpdate = updates[updates.length - 1];
      const chatId = lastUpdate.message?.chat?.id;
      
      if (chatId) {
        return res.json({ 
          chatId: chatId.toString(),
          message: 'Chat ID bulundu! Bu değeri server.js dosyasındaki TELEGRAM_CHAT_ID değişkenine yapıştırın.'
        });
      }
    }
    
    res.json({ 
      message: 'Henüz mesaj yok. Bot\'a @nezlesirtab_bot ile konuşmaya başlayın ve tekrar deneyin.' 
    });
  } catch (error) {
    res.status(500).json({ error: 'Chat ID alınamadı: ' + error.message });
  }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('Dosya bulunamadı');
    }

    // Dosya boyutu kontrolü (50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (req.file.size > maxSize) {
      return res.status(400).send('Dosya çok büyük! Maksimum 50MB olmalı.');
    }

    if (TELEGRAM_CHAT_ID === 'YOUR_CHAT_ID') {
      return res.status(400).send('Telegram Chat ID ayarlanmamış. Önce /api/get-chat-id endpoint\'ini çağırın.');
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
      return res.status(200).send('Video Telegram\'a gönderildi!');
    }
    
    return res.status(500).send('Telegram gönderimi başarısız: ' + JSON.stringify(response.data));
  } catch (err) {
    console.error('Telegram upload error:', err.response?.data || err.message);
    const message = err?.response?.data?.description || err?.message || 'Sunucu hatası';
    return res.status(500).send('Telegram hatası: ' + message);
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`Upload proxy server listening on http://localhost:${port}`);
});
