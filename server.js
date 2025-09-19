const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = '8006450272:AAH9iIYsQNw5i2MLjlEzD0iCLScTDNFMYyI';
const TELEGRAM_CHAT_ID = '1105436506'; // Telegram kanal ID
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

app.use(cors());
app.use(express.json());

// Orders data storage
let orders = [
  {
    id: 1,
    productName: "Domalma Am Parmaklama",
    customerName: "Arsz Sikici",
    email: "Dümdük9@email.com",
    quantity: 1,
    price: 18000,
    orderDate: new Date().toISOString(),
    status: "pending_payment",
    description: "Domalarak Am Parmaklama Popo Ayırma 5 Dakika Ayakta Am Parmaklama 5dk",
    notes: "Müşteri onay verirse ödeme yapılacak"
  },
  {
    id: 2,
    productName: "Meme Okşama",
    customerName: "Dümdük9",
    email: "Dümdük9@email.com",
    quantity: 2,
    price: 6950,
    orderDate: new Date().toISOString(),
    status: "pending_payment",
    description: "Öne Doğru Eğilerek Meme Okşama Efeksiz 5 Dakika",
    notes: "Müşteri onay verirse ödeme yapılacak"
  },
  {
    id: 3,
    productName: "Boşalma",
    customerName: "Cookiee",
    email: "Cookie82@email.com",
    quantity: 1,
    price: 13500,
    orderDate: new Date().toISOString(),
    status: "pending_payment",
    description: "Zevk Suyum Gelene Kadar Am Parmaklayarak Boşalma",
    notes: "Müşteri onay verirse ödeme yapılacak"
  }
];

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

// Orders API endpoints
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const newOrder = {
    id: Math.max(...orders.map(o => o.id), 0) + 1,
    ...req.body,
    orderDate: new Date().toISOString(),
    status: 'pending_payment'
  };
  orders.push(newOrder);
  res.status(201).json(newOrder);
});

app.put('/api/orders', (req, res) => {
  const { id } = req.query;
  const orderIndex = orders.findIndex(order => order.id === parseInt(id));
  
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Sipariş bulunamadı' });
  }

  orders[orderIndex] = { ...orders[orderIndex], ...req.body };
  res.json(orders[orderIndex]);
});

app.delete('/api/orders', (req, res) => {
  const { id } = req.query;
  const orderIndex = orders.findIndex(order => order.id === parseInt(id));
  
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Sipariş bulunamadı' });
  }

  orders.splice(orderIndex, 1);
  res.json({ message: 'Sipariş silindi' });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'build')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
