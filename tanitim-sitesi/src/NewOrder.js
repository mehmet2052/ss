import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './NewOrder.css';

const NewOrder = () => {
  const navigate = useNavigate();
  const [newOrder, setNewOrder] = useState({
    productName: '',
    customerName: '',
    email: '',
    quantity: 1,
    price: 0,
    description: '',
    notes: 'Müşteri onay verirse ödeme yapılacak'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewOrder(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'quantity' ? Number(value) : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Burada siparişi localStorage'a kaydedebiliriz veya API'ye gönderebiliriz
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = {
      id: Math.max(...orders.map(o => o.id), 0) + 1,
      ...newOrder,
      orderDate: new Date(),
      status: 'pending_payment'
    };
    orders.unshift(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Admin paneline yönlendir
    navigate('/admin');
  };

  return (
    <div className="new-order-page">
      <div className="new-order-container">
        <div className="new-order-header">
          <h1>Yeni Sipariş Ekle</h1>
          <button 
            className="btn btn-secondary" 
            onClick={() => navigate('/admin')}
          >
            ← Admin Paneli
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="new-order-form">
          <div className="form-section">
            <h3>Ürün Bilgileri</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Ürün Adı *</label>
                <input
                  type="text"
                  name="productName"
                  value={newOrder.productName}
                  onChange={handleChange}
                  placeholder="Ürün adını girin"
                  required
                />
              </div>
              <div className="form-group">
                <label>Fiyat (₺) *</label>
                <input
                  type="number"
                  name="price"
                  value={newOrder.price}
                  onChange={handleChange}
                  min="0"
                  placeholder="0"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Açıklama</label>
              <textarea
                name="description"
                value={newOrder.description}
                onChange={handleChange}
                rows="3"
                placeholder="Ürün açıklaması..."
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Müşteri Bilgileri</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Müşteri Adı *</label>
                <input
                  type="text"
                  name="customerName"
                  value={newOrder.customerName}
                  onChange={handleChange}
                  placeholder="Müşteri adını girin"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={newOrder.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Sipariş Detayları</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Miktar *</label>
                <input
                  type="number"
                  name="quantity"
                  value={newOrder.quantity}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>
              <div className="form-group">
                <label>Toplam Tutar</label>
                <input
                  type="text"
                  value={`${(newOrder.price * newOrder.quantity).toLocaleString('tr-TR')} ₺`}
                  disabled
                  className="total-amount"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Notlar</label>
              <textarea
                name="notes"
                value={newOrder.notes}
                onChange={handleChange}
                rows="2"
                placeholder="Sipariş notları..."
              />
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-cancel" 
              onClick={() => navigate('/admin')}
            >
              İptal
            </button>
            <button type="submit" className="btn btn-save">
              Sipariş Ekle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewOrder;
