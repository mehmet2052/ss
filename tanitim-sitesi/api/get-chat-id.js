import axios from 'axios';

// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
}
