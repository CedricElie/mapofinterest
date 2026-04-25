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

  // Detail Modal States
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPoi, setSelectedPoi] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

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

  const viewUserDetails = async (id) => {
    setDetailLoading(true);
    const res = await fetch(`/api/admin/users/${id}`);
    if (res.ok) {
      setSelectedUser(await res.json());
    }
    setDetailLoading(false);
  };

  const viewPoiDetails = async (id) => {
    setDetailLoading(true);
    const res = await fetch(`/api/admin/pois/${id}`);
    if (res.ok) {
      setSelectedPoi(await res.json());
    }
    setDetailLoading(false);
  };

  const toggleUserDisable = async (e, id, currentStatus) => {
    e.stopPropagation();
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disabled: !currentStatus })
    });
    if (res.ok) {
      setUsers(users.map(u => u.id === id ? { ...u, disabled: !currentStatus } : u));
    }
  };

  const deleteUser = async (e, id) => {
    e.stopPropagation();
    if (!confirm("Are you sure? This deletes everything belonging to the user!")) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const togglePoiDisable = async (e, id, currentStatus) => {
    e.stopPropagation();
    const res = await fetch(`/api/admin/pois/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disabled: !currentStatus })
    });
    if (res.ok) {
      setPois(pois.map(p => p.id === id ? { ...p, disabled: !currentStatus } : p));
    }
  };

  const deletePoi = async (e, id) => {
    e.stopPropagation();
    if (!confirm("Are you sure? This drops the POI for everyone!")) return;
    const res = await fetch(`/api/admin/pois/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setPois(pois.filter(p => p.id !== id));
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Admin Portal...</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif', color: '#111', position: 'relative' }}>
      
      {/* Detail Modal Overlay */}
      {(selectedUser || selectedPoi || detailLoading) && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <button onClick={() => { setSelectedUser(null); setSelectedPoi(null); }} style={{ position: 'absolute', top: '16px', right: '16px', background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>✕</button>
            
            {detailLoading && <p style={{ textAlign: 'center', padding: '20px' }}>Loading details...</p>}
            
            {selectedUser && (
              <div style={{ color: '#000' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', fontWeight: '800' }}>User: {selectedUser.name}</h2>
                <p style={{ color: '#111', marginBottom: '24px', fontWeight: '500' }}>Member since: {new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', borderBottom: '1px solid #ddd', paddingBottom: '8px', fontWeight: '700' }}>Friends ({selectedUser.friends.length})</h3>
                  {selectedUser.friends.length === 0 ? <p style={{ fontSize: '0.9rem', color: '#333' }}>No friends yet.</p> : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedUser.friends.map(f => (
                        <span key={f.id} style={{ background: '#e5e7eb', color: '#000', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>{f.name}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', borderBottom: '1px solid #ddd', paddingBottom: '8px', fontWeight: '700' }}>Saved Places ({selectedUser.pois.length})</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {selectedUser.pois.length === 0 ? <p style={{ fontSize: '0.9rem', color: '#333' }}>No places saved.</p> : selectedUser.pois.map(p => (
                      <div key={p.id} style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb' }}>
                        <div>
                          <p style={{ fontWeight: '700', margin: 0, color: '#000' }}>{p.title}</p>
                          <p style={{ fontSize: '0.85rem', color: '#111', margin: 0, fontWeight: '500' }}>{p.category.label}</p>
                        </div>
                        <span style={{ fontSize: '0.85rem', color: '#333', fontWeight: '600' }}>{new Date(p.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedPoi && (
              <div style={{ color: '#000' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', fontWeight: '800' }}>Place: {selectedPoi.title}</h2>
                <p style={{ color: '#111', marginBottom: '16px', fontWeight: '600' }}>Author: {selectedPoi.user?.name} ({selectedPoi.user?.email || 'No email'})</p>
                
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                  <span style={{ background: selectedPoi.category.color + '33', color: selectedPoi.category.color, padding: '6px 14px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: '800', border: `1px solid ${selectedPoi.category.color}` }}>{selectedPoi.category.label}</span>
                  <span style={{ background: '#fffbeb', color: '#92400e', padding: '6px 14px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: '800', border: '1px solid #fde68a' }}>⭐ {selectedPoi.rating || 0} / 5</span>
                </div>

                <div style={{ marginBottom: '20px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                  <p style={{ fontWeight: '800', marginBottom: '4px', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: '#4b5563' }}>Address</p>
                  <p style={{ fontSize: '1rem', margin: 0, color: '#000', fontWeight: '500' }}>{selectedPoi.address || 'No address provided'}</p>
                </div>

                <div style={{ marginBottom: '20px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                  <p style={{ fontWeight: '800', marginBottom: '4px', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: '#4b5563' }}>Description</p>
                  <p style={{ fontSize: '1rem', margin: 0, color: '#000', fontWeight: '500', whiteSpace: 'pre-wrap' }}>{selectedPoi.description || 'No description provided'}</p>
                </div>

                {selectedPoi.images && JSON.parse(selectedPoi.images).length > 0 && (
                  <div>
                    <p style={{ fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: '#4b5563' }}>Images</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
                      {JSON.parse(selectedPoi.images).map((img, idx) => (
                        <img key={idx} src={img} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '12px', border: '2px solid #f3f4f6' }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

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
                list="user-suggestions"
                placeholder="Search users by name..." 
                value={userQuery} 
                onChange={e => setUserQuery(e.target.value)} 
                style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem', color: '#111' }}
              />
              <datalist id="user-suggestions">
                {users.map(u => <option key={u.id} value={u.name} />)}
              </datalist>
            </div>
            <div style={{ maxHeight: '500px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#111' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 1, color: '#000', fontWeight: '800' }}>
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
                    <tr onClick={() => viewUserDetails(u.id)} key={u.id} style={{ borderBottom: '1px solid #e5e7eb', cursor: 'pointer', transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                      <td style={{ padding: '16px 12px', fontWeight: '500' }}>{u.name}</td>
                      <td style={{ padding: '16px 12px' }}><span style={{ padding: '4px 8px', background: u.role==='ADMIN'?'#fef08a':'#f3f4f6', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>{u.role}</span></td>
                      <td style={{ padding: '16px 12px', fontSize: '0.95rem', color: '#000', fontWeight: '500' }}>{u._count.pois} POIs, {u._count.comments} Comments</td>
                      <td style={{ padding: '16px 12px' }}>
                        {u.disabled ? <span style={{ color: '#ef4444', fontWeight: '600', fontSize: '0.9rem' }}>Disabled</span> : <span style={{ color: '#10b981', fontWeight: '600', fontSize: '0.9rem' }}>Active</span>}
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                        <button onClick={(e) => toggleUserDisable(e, u.id, u.disabled)} style={{ marginRight: '8px', padding: '6px 12px', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', color: '#111' }}>{u.disabled ? 'Enable' : 'Disable'}</button>
                        <button onClick={(e) => deleteUser(e, u.id)} style={{ padding: '6px 12px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'pois' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <input 
                type="text" 
                list="poi-suggestions"
                placeholder="Search saved places by title..." 
                value={poiQuery} 
                onChange={e => setPoiQuery(e.target.value)} 
                style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem', color: '#111' }}
              />
              <datalist id="poi-suggestions">
                {pois.map(p => <option key={p.id} value={p.title} />)}
              </datalist>
            </div>
            <div style={{ maxHeight: '500px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#111' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 1 }}>
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
                    <tr onClick={() => viewPoiDetails(p.id)} key={p.id} style={{ borderBottom: '1px solid #e5e7eb', cursor: 'pointer', transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                      <td style={{ padding: '16px 12px', fontWeight: '500' }}>{p.title}</td>
                      <td style={{ padding: '16px 12px', color: '#111', fontSize: '0.95rem', fontWeight: '500' }}>{p.user?.name}</td>
                      <td style={{ padding: '16px 12px', color: '#111', fontSize: '0.95rem', fontWeight: '500' }}>{p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}</td>
                      <td style={{ padding: '16px 12px' }}>
                        {p.disabled ? <span style={{ color: '#ef4444', fontWeight: '600', fontSize: '0.9rem' }}>Disabled</span> : <span style={{ color: '#10b981', fontWeight: '600', fontSize: '0.9rem' }}>Active</span>}
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                        <button onClick={(e) => togglePoiDisable(e, p.id, p.disabled)} style={{ marginRight: '8px', padding: '6px 12px', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', color: '#111' }}>{p.disabled ? 'Enable' : 'Disable'}</button>
                        <button onClick={(e) => deletePoi(e, p.id)} style={{ padding: '6px 12px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
