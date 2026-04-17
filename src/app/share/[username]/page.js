'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import MapComponent from '../../MapComponent';

export default function SharedMap() {
  const { username } = useParams();
  const [pins, setPins] = useState([]);
  const [categories, setCategories] = useState([]);
  const [flyToLocation, setFlyToLocation] = useState(null);
  const [activePinIndex, setActivePinIndex] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSharedData = async () => {
      try {
        const [pinRes, catRes] = await Promise.all([
          fetch(`/api/public/${username}/pins`),
          fetch(`/api/public/${username}/categories`)
        ]);

        if (!pinRes.ok) {
          setError(await pinRes.json());
          return;
        }

        const pData = await pinRes.json();
        const cData = await catRes.json();

        setPins(pData);
        setCategories(cData);

        if (pData.length > 0) {
          setFlyToLocation({ lat: pData[0].lat, lng: pData[0].lng });
        }
      } catch (e) {
        console.error(e);
        setError({ error: 'Failed to load map' });
      }
    };
    if (username) fetchSharedData();
  }, [username]);

  const toggleCategoryFilter = (categoryId) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
    );
  };

  if (error) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
      <h1>Map Not Found 🛑</h1>
      <p style={{ opacity: 0.7 }}>{error.error}</p>
    </div>;
  }

  const filteredPins = pins.filter(p => selectedCategories.length === 0 || selectedCategories.includes(p.categoryId));

  return (
    <main style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      
      {/* Sidebar - Read Only */}
      <aside 
        className="glass-panel"
        style={{ 
          width: '380px', flexShrink: 0, height: '100vh', display: 'flex', flexDirection: 'column', 
          borderRight: '1px solid var(--surface-border)', zIndex: 20, position: 'relative',
          background: 'var(--surface)', backdropFilter: 'blur(32px)'
        }}
      >
        <div style={{ padding: '24px', borderBottom: '1px solid var(--surface-border)', background: 'var(--input-bg)' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', letterSpacing: '-0.5px' }}>
            <span>✨</span> {username}'s Places
          </h1>
          <p style={{ fontSize: '0.95rem', opacity: 0.85, fontWeight: 500, margin: 0 }}>Exploring {username}'s public map!</p>
        </div>

        {categories.length > 0 && (
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--surface-border)' }}>
            <h3 style={{ fontSize: '0.85rem', marginBottom: '12px', fontWeight: 600, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Filter Categories</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
               {categories.map(c => {
                 const active = selectedCategories.includes(c.id);
                 return (
                   <button
                     key={c.id}
                     onClick={() => toggleCategoryFilter(c.id)}
                     style={{ padding: '6px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 600, background: active ? c.color : 'transparent', color: active ? '#fff' : 'var(--foreground-dark)', border: `1px solid ${active ? c.color : 'var(--surface-border)'}`, cursor: 'pointer', transition: 'all 0.2s' }}
                   >{c.label}</button>
                 )
               })}
            </div>
          </div>
        )}

        {/* POI List Read Only */}
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
          {filteredPins.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredPins.map((p, idx) => (
                <li 
                  key={p.id}
                  onClick={() => setActivePinIndex(activePinIndex === idx ? null : idx)} 
                  style={{ background: activePinIndex === idx ? 'rgba(99, 102, 241, 0.15)' : 'var(--input-bg)', padding: '12px 16px', borderRadius: '12px', borderLeft: `4px solid ${p.category?.color}`, cursor: 'pointer', transition: 'all 0.2s', border: activePinIndex === idx ? `1px solid ${p.category?.color}` : '1px solid var(--surface-border)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: '600', fontSize: '1rem' }}>{p.title}</div>
                    {p.rating && <div style={{ color: '#fbbf24', fontSize: '0.9rem', letterSpacing: '-1px' }}>{'★'.repeat(p.rating)}{'☆'.repeat(5 - p.rating)}</div>}
                  </div>
                   <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '2px', color: p.category?.color || '#a1a1aa' }}>{p.category?.label}</div>
                  
                  {activePinIndex === idx && (
                    <div style={{ fontSize: '0.9rem', marginTop: '12px', padding: '12px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                       {p.description ? <div style={{ margin: 0, opacity: 1, color: 'var(--foreground-dark)', whiteSpace: 'pre-wrap' }}>{p.description}</div> : <p style={{ margin: 0, opacity: 1, color: 'var(--foreground-dark)' }}>No description.</p>}
                       {p.address && (
                         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', padding: '8px 12px', background: 'rgba(0,0,0,0.05)', borderRadius: '6px', border: '1px solid var(--surface-border)' }}>
                           <span style={{ fontSize: '0.85rem', color: 'var(--foreground-dark)', opacity: 0.9, flex: 1, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.address}</span>
                           <button onClick={(e) => { 
                              e.stopPropagation(); 
                              if (navigator.clipboard) {
                                navigator.clipboard.writeText(p.address); 
                                const btn = e.currentTarget; 
                                const original = btn.innerHTML; 
                                btn.innerHTML = '✅'; 
                                setTimeout(() => btn.innerHTML = original, 1500); 
                              } else {
                                alert("Copying is blocked on insecure connections.");
                              }
                            }} style={{ flexShrink: 0, padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.7, fontSize: '1.2rem', marginLeft: '8px' }}>📋</button>
                         </div>
                       )}
                       {p.images && p.images.length > 0 && (
                         <div style={{ display: 'flex', gap: '8px', marginTop: '12px', overflowX: 'auto', paddingBottom: '6px' }}>
                           {p.images.map((img, i) => ( <img key={i} src={img} alt="Detail" onClick={(e) => { e.stopPropagation(); setEnlargedImage(img); }} style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--surface-border)', flexShrink: 0 }} /> ))}
                         </div>
                       )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ opacity: 0.7, textAlign: 'center', marginTop: '40px' }}>No public places found.</p>
          )}
        </div>
      </aside>

      {/* Map Area */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapComponent 
          theme="colored"
          flyToLocation={flyToLocation}
          isDroppingPin={false} 
          onMapClick={() => { setActivePinIndex(null); }}
          pendingLocation={null}
          pins={filteredPins}
          activePinIndex={activePinIndex}
        />
        
        <nav style={{ position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', padding: '12px 24px', borderRadius: '100px', zIndex: 30, background: 'var(--surface)', border: '1px solid var(--surface-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', fontWeight: 600 }}>
          <a href="/" style={{ textDecoration: 'none', color: 'var(--primary)' }}>Return Home</a>
        </nav>
      </div>

      {enlargedImage && (
        <div onClick={() => setEnlargedImage(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'zoom-out' }}>
          <img src={enlargedImage} alt="Enlarged" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }} />
          <div style={{ position: 'absolute', top: '24px', right: '32px', color: 'white', fontSize: '32px', fontWeight: 'bold' }}>✕</div>
        </div>
      )}
    </main>
  );
}
