import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminPanel from './AdminPanel';
import NewOrder from './NewOrder';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (email === 'nezlesirtan@hub.com' && password === 'nezlesirtan') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Hatalı kullanıcı adı veya şifre');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1 className="login-title">Admin Panel Giriş</h1>
          <form onSubmit={handleLogin} className="login-form">
            <div className="login-group">
              <label>E-posta</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nezlesirtan@hub.com"
                required
              />
            </div>
            <div className="login-group">
              <label>Şifre</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {error && <div className="login-error">{error}</div>}
            <button className="login-button" type="submit">Giriş Yap</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/new-order" element={<NewOrder />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
