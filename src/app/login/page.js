'use client';

import { useState } from 'react';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    email: '',
    city: '',
    country: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.password) {
      setError('Username and password are required');
      return;
    }

    setLoading(true);
    setError('');

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (data.success) {
        window.location.href = '/'; 
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <main style={{ 
      width: '100vw', minHeight: '100vh', 
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'url("https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2000&auto=format&fit=crop") center/cover no-repeat fixed',
      position: 'relative', padding: '40px 20px'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 1 }} />
      
      <div className="glass-panel" style={{
        position: 'relative', width: '100%', maxWidth: mode === 'signup' ? '500px' : '400px', padding: '40px',
        borderRadius: '24px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '24px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)', transition: 'max-width 0.3s ease'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px', color: '#fff', letterSpacing: '-1px' }}>POI Explorer</h1>
          <p style={{ opacity: 0.9, color: '#fff', fontWeight: 500 }}>
            {mode === 'login' ? 'Welcome back! Please sign in.' : 'Join the community of explorers.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: mode === 'signup' ? '1fr 1fr' : '1fr', gap: '16px' }}>
            <label style={{ display: 'block', gridColumn: mode === 'signup' ? 'span 2' : 'span 1' }}>
              <span style={{ fontSize: '0.85rem', opacity: 0.8, color: '#fff', marginBottom: '6px', display: 'block' }}>Username *</span>
              <input 
                name="name"
                type="text" 
                required
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., explorer_joe"
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--surface-border)', background: 'rgba(255,255,255,0.1)', color: '#fff' }}
              />
            </label>
            
            <label style={{ display: 'block', gridColumn: mode === 'signup' ? 'span 2' : 'span 1' }}>
              <span style={{ fontSize: '0.85rem', opacity: 0.8, color: '#fff', marginBottom: '6px', display: 'block' }}>Password *</span>
              <input 
                name="password"
                type="password" 
                required
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--surface-border)', background: 'rgba(255,255,255,0.1)', color: '#fff' }}
              />
            </label>

            {mode === 'signup' && (
              <>
                <label style={{ display: 'block', gridColumn: 'span 2' }}>
                  <span style={{ fontSize: '0.85rem', opacity: 0.8, color: '#fff', marginBottom: '6px', display: 'block' }}>Email (Optional)</span>
                  <input 
                    name="email"
                    type="email" 
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="joe@example.com"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--surface-border)', background: 'rgba(255,255,255,0.1)', color: '#fff' }}
                  />
                </label>

                <label style={{ display: 'block' }}>
                  <span style={{ fontSize: '0.85rem', opacity: 0.8, color: '#fff', marginBottom: '6px', display: 'block' }}>City</span>
                  <input 
                    name="city"
                    type="text" 
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Paris"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--surface-border)', background: 'rgba(255,255,255,0.1)', color: '#fff' }}
                  />
                </label>

                <label style={{ display: 'block' }}>
                  <span style={{ fontSize: '0.85rem', opacity: 0.8, color: '#fff', marginBottom: '6px', display: 'block' }}>Country</span>
                  <input 
                    name="country"
                    type="text" 
                    value={formData.country}
                    onChange={handleInputChange}
                    placeholder="France"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--surface-border)', background: 'rgba(255,255,255,0.1)', color: '#fff' }}
                  />
                </label>

                <label style={{ display: 'block', gridColumn: 'span 2' }}>
                  <span style={{ fontSize: '0.85rem', opacity: 0.8, color: '#fff', marginBottom: '6px', display: 'block' }}>Phone Number (Optional)</span>
                  <input 
                    name="phone"
                    type="tel" 
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+123 456 789"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--surface-border)', background: 'rgba(255,255,255,0.1)', color: '#fff' }}
                  />
                </label>
              </>
            )}
          </div>

          {error && <div style={{ color: '#ff4d4d', fontSize: '0.9rem', textAlign: 'center', background: 'rgba(255,0,0,0.1)', padding: '8px', borderRadius: '8px' }}>{error}</div>}

          <button 
            type="submit"
            disabled={loading}
            style={{
              padding: '14px', borderRadius: '12px', background: 'var(--primary)',
              color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600,
              fontSize: '1.1rem', marginTop: '8px', opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}
          >
            {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>

          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <p style={{ color: '#fff', fontSize: '0.9rem', opacity: 0.9 }}>
              {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
              <button 
                type="button"
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
                style={{ background: 'transparent', border: 'none', color: '#fff', fontWeight: 800, cursor: 'pointer', marginLeft: '8px', textDecoration: 'underline' }}
              >
                {mode === 'login' ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
