'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [pois, setPois] = useState([]);
  const [userQuery, setUserQuery] = useState('');
  const [poiQuery, setPoiQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/user/me')
      .then(res => res.json())
      .then(data => {
        if (!data || data.role !== 'ADMIN') {
          router.push('/');
        } else {
          setIsAdmin(true);
          setLoading(false);
        }
      })
      .catch(() => router.push('/'));
  }, [router]);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchUsers = async () => {
      const res = await fetch(`/api/admin/users?q=${userQuery}`);
      if (res.ok) setUsers(await res.json());
    };
    fetchUsers();
  }, [isAdmin, userQuery]);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchPois = async () => {
      const res = await fetch(`/api/admin/pois?q=${poiQuery}`);
      if (res.ok) setPois(await res.json());
    };
    fetchPois();
  }, [isAdmin, poiQuery]);

  const toggleUserDisable = async (id, currentStatus) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disabled: !currentStatus })
    });
    if (res.ok) {
      setUsers(users.map(u => u.id === id ? { ...u, disabled: !currentStatus } : u));
    }
  };

  const deleteUser = async (id) => {
    if (!confirm("Are you sure? This deletes everything belonging to the user!")) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const togglePoiDisable = async (id, currentStatus) => {
    const res = await fetch(`/api/admin/pois/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disabled: !currentStatus })
    });
    if (res.ok) {
      setPois(pois.map(p => p.id === id ? { ...p, disabled: !currentStatus } : p));
    }
  };

  const deletePoi = async (id) => {
    if (!confirm("Are you sure? This drops the POI for everyone!")) return;
    const res = await fetch(`/api/admin/pois/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setPois(pois.filter(p => p.id !== id));
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Admin Portal...</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif', color: '#111' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: '0 0 8px 0', color: '#000' }}>Security Center</h1>
          <p style={{ color: '#4b5563', margin: 0 }}>System-wide administration access.</p>
        </div>
        <button onClick={() => router.push('/')} style={{ padding: '8px 16px', background: '#e5e7eb', color: '#111', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Back to Map</button>
      </header>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab('users')} 
          style={{ padding: '12px 24px', background: activeTab === 'users' ? '#111' : '#f3f4f6', color: activeTab === 'users' ? '#fff' : '#111', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
        >
          Manage Users
        </button>
        <button 
          onClick={() => setActiveTab('pois')} 
          style={{ padding: '12px 24px', background: activeTab === 'pois' ? '#111' : '#f3f4f6', color: activeTab === 'pois' ? '#fff' : '#111', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
        >
          Manage Saved Places
        </button>
      </div>

      <main style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        
        {activeTab === 'users' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <input 
                type="text" 
                placeholder="Search users by name..." 
                value={userQuery} 
                onChange={e => setUserQuery(e.target.value)} 
                style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem', color: '#111' }}
              />
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#111' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '12px' }}>Name</th>
                  <th style={{ padding: '12px' }}>Role</th>
                  <th style={{ padding: '12px' }}>Activity</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '16px 12px', fontWeight: '500' }}>{u.name}</td>
                    <td style={{ padding: '16px 12px' }}><span style={{ padding: '4px 8px', background: u.role==='ADMIN'?'#fef08a':'#f3f4f6', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>{u.role}</span></td>
                    <td style={{ padding: '16px 12px', fontSize: '0.9rem', color: '#4b5563' }}>{u._count.pois} POIs, {u._count.comments} Comments</td>
                    <td style={{ padding: '16px 12px' }}>
                      {u.disabled ? <span style={{ color: '#ef4444', fontWeight: '600', fontSize: '0.9rem' }}>Disabled</span> : <span style={{ color: '#10b981', fontWeight: '600', fontSize: '0.9rem' }}>Active</span>}
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                      <button onClick={() => toggleUserDisable(u.id, u.disabled)} style={{ marginRight: '8px', padding: '6px 12px', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>{u.disabled ? 'Enable' : 'Disable'}</button>
                      <button onClick={() => deleteUser(u.id)} style={{ padding: '6px 12px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'pois' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <input 
                type="text" 
                placeholder="Search saved places by title..." 
                value={poiQuery} 
                onChange={e => setPoiQuery(e.target.value)} 
                style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem', color: '#111' }}
              />
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#111' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '12px' }}>Title</th>
                  <th style={{ padding: '12px' }}>Author</th>
                  <th style={{ padding: '12px' }}>Location</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pois.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '16px 12px', fontWeight: '500' }}>{p.title}</td>
                    <td style={{ padding: '16px 12px', color: '#4b5563', fontSize: '0.9rem' }}>{p.user?.name}</td>
                    <td style={{ padding: '16px 12px', color: '#4b5563', fontSize: '0.9rem' }}>{p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}</td>
                    <td style={{ padding: '16px 12px' }}>
                      {p.disabled ? <span style={{ color: '#ef4444', fontWeight: '600', fontSize: '0.9rem' }}>Disabled</span> : <span style={{ color: '#10b981', fontWeight: '600', fontSize: '0.9rem' }}>Active</span>}
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                      <button onClick={() => togglePoiDisable(p.id, p.disabled)} style={{ marginRight: '8px', padding: '6px 12px', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>{p.disabled ? 'Enable' : 'Disable'}</button>
                      <button onClick={() => deletePoi(p.id)} style={{ padding: '6px 12px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </main>
    </div>
  );
}
