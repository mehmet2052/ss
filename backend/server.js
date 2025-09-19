require('dotenv').config();
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// CORS configuration for production
const corsOptions = {
  origin: function (origin, callback) {
    // Development
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL,
      'https://ss-gamma-liart.vercel.app',
      'https://ss-5ixvu4kps-nezlesirtan-3690s-projects.vercel.app',
      /^https:\/\/.*\.vercel\.app$/
    ];
    
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

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

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ 
    ok: true, 
    message: 'Backend server is running',
    timestamp: new Date().toISOString()
  });
});

// Chat ID'yi almak için endpoint
app.get('/api/get-chat-id', async (req, res) => {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      return res.status(500).json({ error: 'Telegram bot token not configured' });
    }

    const response = await axios.get(`${TELEGRAM_API_URL}/getUpdates`);
    const updates = response.data.result;
    
    if (updates.length > 0) {
      const lastUpdate = updates[updates.length - 1];
      const chatId = lastUpdate.message?.chat?.id;
      
      if (chatId) {
        return res.json({ 
          chatId: chatId.toString(),
          message: 'Chat ID bulundu! Bu değeri environment variable olarak ayarlayın.'
        });
      }
    }
    
    res.json({ 
      message: 'Henüz mesaj yok. Bot\'a @nezlesirtab_bot ile konuşmaya başlayın ve tekrar deneyin.' 
    });
  } catch (error) {
    console.error('Get chat ID error:', error);
    res.status(500).json({ error: 'Chat ID alınamadı: ' + error.message });
  }
});

// Video upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Dosya bulunamadı' });
    }

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      return res.status(500).json({ error: 'Telegram configuration missing' });
    }

    // Dosya boyutu kontrolü (50MB)
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
  } catch (err) {
    console.error('Telegram upload error:', err.response?.data || err.message);
    const message = err?.response?.data?.description || err?.message || 'Sunucu hatası';
    return res.status(500).json({ error: 'Telegram hatası: ' + message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
