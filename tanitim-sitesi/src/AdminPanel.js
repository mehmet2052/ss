import React, { useState, useEffect } from 'react';
import './AdminPanel.css';

const AdminPanel = () => {
  const [orders, setOrders] = useState([]);
  const [selectedFileByOrder, setSelectedFileByOrder] = useState({});
  const [uploadingOrderId, setUploadingOrderId] = useState(null);
  const [uploadMsgByOrder, setUploadMsgByOrder] = useState({});

  // Güncel tarih fonksiyonu
  const getCurrentDate = () => {
    return new Date();
  };

  // Sunucudan siparişleri yükle
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders');
        if (response.ok) {
          const ordersData = await response.json();
          const parsedOrders = ordersData.map(order => ({
            ...order,
            orderDate: new Date(order.orderDate)
          }));
          setOrders(parsedOrders);
        } else {
          console.error('Siparişler yüklenemedi:', response.statusText);
        }
      } catch (error) {
        console.error('Siparişler yüklenirken hata:', error);
      }
    };

    fetchOrders();
  }, []);

  // Siparişleri sunucuda güncelle
  const updateOrderOnServer = async (orderId, updates) => {
    try {
      const response = await fetch(`/api/orders?id=${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        console.error('Sipariş güncellenemedi:', response.statusText);
      }
    } catch (error) {
      console.error('Sipariş güncellenirken hata:', error);
    }
  };

  // Tarih formatlama
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };


  const handleOrderFileChange = (orderId, e) => {
    const file = e.target.files?.[0] || null;
    setSelectedFileByOrder(prev => ({ ...prev, [orderId]: file }));
    setUploadMsgByOrder(prev => ({ ...prev, [orderId]: undefined }));
  };

  const handleUploadForOrder = async (orderId) => {
    const file = selectedFileByOrder[orderId];
    if (!file) {
      setUploadMsgByOrder(prev => ({ ...prev, [orderId]: { type: 'error', text: 'Lütfen bir video dosyası seçin.' } }));
      return;
    }
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      setUploadMsgByOrder(prev => ({ ...prev, [orderId]: { type: 'error', text: 'Sadece mp4, mov veya webm kabul edilir.' } }));
      return;
    }
    // Dosya boyutu kontrolü (50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setUploadMsgByOrder(prev => ({ ...prev, [orderId]: { type: 'error', text: 'Dosya çok büyük! Maksimum 50MB olmalı.' } }));
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      setUploadingOrderId(orderId);
      setUploadMsgByOrder(prev => ({ ...prev, [orderId]: undefined }));
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Yükleme başarısız');
      }
      setUploadMsgByOrder(prev => ({ ...prev, [orderId]: { type: 'success', text: 'Video Telegram\'a gönderildi.' } }));
      setSelectedFileByOrder(prev => ({ ...prev, [orderId]: null }));
      
      // Sipariş durumunu sunucuda güncelle
      await updateOrderOnServer(orderId, { 
        status: 'pending_approval', 
        notes: 'Müşteri onayı bekleniyor' 
      });
      
      // Local state'i güncelle
      const updatedOrders = orders.map(order => 
        order.id === orderId 
          ? { ...order, status: 'pending_approval', notes: 'Müşteri onayı bekleniyor' }
          : order
      );
      setOrders(updatedOrders);
    } catch (err) {
      setUploadMsgByOrder(prev => ({ ...prev, [orderId]: { type: 'error', text: err?.message || 'Bir hata oluştu' } }));
    } finally {
      setUploadingOrderId(null);
    }
  };

  // Sipariş silme
  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Bu siparişi silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/orders?id=${orderId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          const updatedOrders = orders.filter(order => order.id !== orderId);
          setOrders(updatedOrders);
        } else {
          console.error('Sipariş silinemedi:', response.statusText);
        }
      } catch (error) {
        console.error('Sipariş silinirken hata:', error);
      }
    }
  };

  // Müşteri onayı
  const handleApprovePayment = async (orderId) => {
    try {
      await updateOrderOnServer(orderId, { 
        status: 'pending_approval', 
        notes: 'Müşteri onayı bekleniyor' 
      });
      
      const updatedOrders = orders.map(order => 
        order.id === orderId 
          ? { ...order, status: 'pending_approval', notes: 'Müşteri onayı bekleniyor' }
          : order
      );
      setOrders(updatedOrders);
    } catch (error) {
      console.error('Sipariş onaylanırken hata:', error);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Admin Panel - Sipariş Yönetimi</h1>
        <div className="stats">
          <div className="stat-item">
            <span className="stat-number">{orders.length}</span>
            <span className="stat-label">Toplam Sipariş</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{orders.filter(o => o.status === 'pending_payment').length}</span>
            <span className="stat-label">Video Bekleyen</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{orders.filter(o => o.status === 'pending_approval').length}</span>
            <span className="stat-label">Müşteri Onayı Bekleyen</span>
          </div>
        </div>
      </div>


      <div className="orders-container">
        {orders.map(order => (
          <div key={order.id} className="order-card">
            <div className="order-header">
              <h3>{order.productName}</h3>
              <span className={`status-badge ${order.status}`}>
                {order.status === 'pending_payment' ? 'Video Bekleniyor' : 
                 order.status === 'pending_approval' ? 'Müşteri Onayı Bekleniyor' : 
                 'Gönderildi'}
              </span>
            </div>
            
            <div className="order-details">
              <div className="detail-row">
                <strong>Müşteri:</strong> {order.customerName}
              </div>
              <div className="detail-row">
                <strong>Email:</strong> {order.email}
              </div>
              <div className="detail-row">
                <strong>Miktar:</strong> {order.quantity} adet
              </div>
              <div className="detail-row">
                <strong>Fiyat:</strong> {order.price.toLocaleString('tr-TR')} ₺
              </div>
              <div className="detail-row">
                <strong>Sipariş Tarihi:</strong> {formatDate(order.orderDate)}
              </div>
              <div className="detail-row">
                <strong>Açıklama:</strong> {order.description}
              </div>
              <div className="detail-row notes">
                <strong>Notlar:</strong> 
                <span className="red-note">{order.notes}</span>
              </div>
            </div>

            <div className="order-actions">
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                onChange={(e) => handleOrderFileChange(order.id, e)}
              />
              <button
                className="btn btn-approve"
                onClick={() => handleUploadForOrder(order.id)}
                disabled={uploadingOrderId === order.id}
              >
                {uploadingOrderId === order.id ? 'Gönderiliyor...' : 'Video Gönder'}
              </button>
              <button 
                className="btn btn-delete" 
                onClick={() => handleDeleteOrder(order.id)}
              >
                Sil
              </button>
              {order.status === 'pending_payment' && (
                <button 
                  className="btn btn-approve" 
                  onClick={() => handleApprovePayment(order.id)}
                >
                  Gönder
                </button>
              )}
            </div>
            {uploadMsgByOrder[order.id]?.text && (
              <div className={uploadMsgByOrder[order.id]?.type === 'success' ? 'upload-success' : 'upload-error'}>
                {uploadMsgByOrder[order.id]?.text}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPanel;
