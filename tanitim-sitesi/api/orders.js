// Orders API - Server-side data storage
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

export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Tüm siparişleri getir
      return res.status(200).json(orders);
    }

    if (req.method === 'POST') {
      // Yeni sipariş oluştur
      const newOrder = {
        id: Math.max(...orders.map(o => o.id), 0) + 1,
        ...req.body,
        orderDate: new Date().toISOString(),
        status: 'pending_payment'
      };
      orders.push(newOrder);
      return res.status(201).json(newOrder);
    }

    if (req.method === 'PUT') {
      // Sipariş güncelle
      const { id } = req.query;
      const orderIndex = orders.findIndex(order => order.id === parseInt(id));
      
      if (orderIndex === -1) {
        return res.status(404).json({ error: 'Sipariş bulunamadı' });
      }

      orders[orderIndex] = { ...orders[orderIndex], ...req.body };
      return res.status(200).json(orders[orderIndex]);
    }

    if (req.method === 'DELETE') {
      // Sipariş sil
      const { id } = req.query;
      const orderIndex = orders.findIndex(order => order.id === parseInt(id));
      
      if (orderIndex === -1) {
        return res.status(404).json({ error: 'Sipariş bulunamadı' });
      }

      orders.splice(orderIndex, 1);
      return res.status(200).json({ message: 'Sipariş silindi' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Orders API error:', error);
    return res.status(500).json({ error: 'Sunucu hatası: ' + error.message });
  }
}
