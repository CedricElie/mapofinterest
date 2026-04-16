'use client';

import { useState } from 'react';

export default function Login() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!name || !password) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password })
      });

      if (!res.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await res.json();
      if (data.success) {
        window.location.href = '/'; 
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <main style={{ 
      width: '100vw', height: '100vh', 
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'url("https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2000&auto=format&fit=crop") center/cover no-repeat',
      position: 'relative'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)' }} />
      
      <div className="glass-panel" style={{
        position: 'relative', width: '90%', maxWidth: '400px', padding: '40px',
        borderRadius: '24px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '24px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>POI Explorer</h1>
          <p style={{ opacity: 0.8 }}>Please sign in to view your maps.</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <label style={{ display: 'block' }}>
            <span style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '6px', display: 'block' }}>Username</span>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., cedric"
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}
            />
          </label>
          
          <label style={{ display: 'block' }}>
            <span style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '6px', display: 'block' }}>Password</span>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}
            />
          </label>

          {error && <div style={{ color: '#ef4444', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}

          <button 
            type="submit"
            disabled={loading}
            style={{
              padding: '14px', borderRadius: '12px', background: 'var(--primary)',
              color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600,
              fontSize: '1rem', marginTop: '8px', opacity: loading ? 0.7 : 1,
              transition: 'background 0.2s'
            }}
          >
            {loading ? 'Authenticating...' : 'Enter Map'}
          </button>
        </form>
      </div>
    </main>
  );
}
