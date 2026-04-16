'use client';

import { useState, useEffect, useRef } from 'react';
import MapComponent from './MapComponent';



export default function Home() {
  const [theme, setTheme] = useState('colored');
  const [isDroppingPin, setIsDroppingPin] = useState(false);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [pins, setPins] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryData, setNewCategoryData] = useState({ label: '', color: '#3b82f6' });
  const [formData, setFormData] = useState({ title: '', description: '', address: '', categoryId: 'pub', rating: 5, images: [] });
  const [editingPinId, setEditingPinId] = useState(null);
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Geocoding Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [flyToLocation, setFlyToLocation] = useState(null);
  const searchTimeoutRef = useRef(null);

  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [activePinIndex, setActivePinIndex] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const toggleCategoryFilter = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const THEMES = [
    { id: 'dark', label: '🌙 Dark Mode' },
    { id: 'light', label: '☀️ Light Mode' },
    { id: 'colored', label: '🗺️ Colored OSM' },
    { id: 'satellite', label: '🌍 Satellite' }
  ];

  // Apply theme to DOM
  useEffect(() => {
    if (theme === 'light' || theme === 'colored') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [theme]);

  // Load Pins and Initial Centering
  useEffect(() => {
    const locateUser = async () => {
      const fallbackToIP = async () => {
        try {
          const res = await fetch('https://ipapi.co/json/');
          const data = await res.json();
          if (data && data.latitude && data.longitude) {
            setFlyToLocation({ lat: data.latitude, lng: data.longitude });
          }
        } catch (e) {
          console.error("IP Geolocate error:", e);
        }
      };

      if (!('geolocation' in navigator)) {
        fallbackToIP();
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFlyToLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn("GPS Geolocation error or denied:", error);
          fallbackToIP();
        },
        { timeout: 5000, maximumAge: 60000 }
      );
    };

    const loadConfigs = async () => {
      try {
        const [catRes, pinRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/pins')
        ]);
        if (!pinRes.ok) {
          if (pinRes.status === 401) window.location.href = '/login';
          return;
        }

        const catData = await catRes.json();
        setCategories(catData);

        const data = await pinRes.json();
        setPins(data);

        if (data && data.length > 0) {
          const lastPin = data[data.length - 1];
          setFlyToLocation({ lat: lastPin.lat, lng: lastPin.lng });
        } else {
          locateUser();
        }
      } catch (e) {
        console.error(e);
        locateUser();
      }
    };

    loadConfigs();
  }, []);

  // Geocoding handler with Debounce
  const handleSearch = (val) => {
    setSearchQuery(val);

    if (val.length < 3) {
      setSearchResults([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(val)}`);
        const data = await res.json();
        if (data && data.results) {
          setSearchResults(data.results);
        } else {
          setSearchResults([]);
        }
      } catch (e) {
        console.error("Search error:", e);
      }
    }, 500);
  };

  const selectSearchResult = (result) => {
    setFlyToLocation({ lat: result.latitude, lng: result.longitude });
    setSearchQuery(`${result.name}${result.country ? ', ' + result.country : ''}`);
    setSearchResults([]);
  };

  const executeSearchAndGo = async () => {
    if (!searchQuery || searchQuery.length < 2) return;
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.results && data.results.length > 0) {
        selectSearchResult(data.results[0]);
      }
    } catch (e) {
      console.error("Execute search error:", e);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      executeSearchAndGo();
    }
  };

  const handleMapClick = (lngLat) => {
    setActivePinIndex(null);
    if (isDroppingPin) {
      setPendingLocation(lngLat);
      setIsDroppingPin(false);
    }
  };

  const clearPending = () => {
    setPendingLocation(null);
    setEditingPinId(null);
    setFormData({ title: '', description: '', address: '', categoryId: 'pub', rating: 5, images: [] });
  };

  const handleEditClick = (pin) => {
    setActivePinIndex(null);
    setEditingPinId(pin.id);
    setPendingLocation({ lat: pin.lat, lng: pin.lng });
    setFormData({ title: pin.title, description: pin.description || '', address: pin.address || '', rating: pin.rating || 5, categoryId: pin.categoryId, images: pin.images || [] });
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formPayload = new FormData();
    for (const f of files) {
      formPayload.append('file', f);
    }

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formPayload
      });
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, images: [...(prev.images || []), ...data.urls] }));
      } else {
        console.error("Upload failed");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePin = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this place?')) return;

    try {
      const res = await fetch(`/api/pins/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPins(prev => prev.filter(p => p.id !== id));
        if (editingPinId === id) clearPending();
      } else {
        const err = await res.json();
        alert("Failed to delete processing: " + err.error);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to delete place. Check console.");
    }
  };

  const handleSavePin = async () => {
    if (!formData.title) return;
    try {
      const url = editingPinId ? `/api/pins/${editingPinId}` : '/api/pins';
      const method = editingPinId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          address: formData.address,
          lat: pendingLocation.lat,
          lng: pendingLocation.lng,
          rating: formData.rating,
          categoryId: formData.categoryId,
          images: formData.images
        })
      });
      if (res.ok) {
        const savedPin = await res.json();
        if (editingPinId) {
          setPins(prev => prev.map(p => p.id === editingPinId ? savedPin : p));
        } else {
          setPins(prev => [...prev, savedPin]);
        }
        clearPending();
      } else {
        const err = await res.json();
        alert("Failed to save: " + (err.error || "Please run `npx prisma db push` to update the database schema."));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to save pin. Check console.");
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryData.label) return;
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategoryData)
      });
      if (res.ok) {
        const appended = await res.json();
        setCategories(prev => [...prev, appended]);
        setFormData(prev => ({ ...prev, categoryId: appended.id }));
        setIsCreatingCategory(false);
        setNewCategoryData({ label: '', color: '#3b82f6' });
      } else {
        const err = await res.json();
        alert("Failed to create category: " + err.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredPins = pins.filter(p => selectedCategories.length === 0 || selectedCategories.includes(p.categoryId));
  const nativeCategories = categories.filter(c => c.userId === null);
  const customCategories = categories.filter(c => c.userId !== null);

  return (
    <main style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>

      {/* Sidebar - Fixed to left */}
      <aside
        className="glass-panel"
        style={{
          width: '380px', flexShrink: 0, height: '100vh', display: 'flex', flexDirection: 'column',
          borderRight: '1px solid var(--surface-border)', zIndex: 20, position: 'relative',
          background: 'var(--surface)', backdropFilter: 'blur(32px)'
        }}
      >
        <div style={{ padding: '24px', borderBottom: '1px solid var(--surface-border)', background: 'var(--input-bg)' }}>
          <h1 style={{
            fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px',
            color: 'var(--primary)', letterSpacing: '-0.5px'
          }}>
            <span>✨</span> Places of Interest
          </h1>
          <p style={{ fontSize: '0.95rem', opacity: 0.85, fontWeight: 500, margin: 0 }}>Discover and share your places of interest.</p>
        </div>

        {/* Sidebar Body */}
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Top-Most: Drop Pin Action */}
          {!pendingLocation ? (
            <button
              onClick={() => setIsDroppingPin(!isDroppingPin)}
              style={{
                width: '100%', padding: '16px', background: isDroppingPin ? '#ef4444' : 'var(--primary)',
                color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer',
                fontWeight: '700', transition: 'background 0.2s', fontSize: '1.05rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              {isDroppingPin ? 'Cancel Pin Placement' : '📍 DROP NEW PIN'}
            </button>
          ) : (
            <div style={{ background: 'var(--input-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>{editingPinId ? 'Update Place' : 'Save New Place'}</h3>

              <label style={{ display: 'block', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.8rem', opacity: 0.8, display: 'block', marginBottom: '4px' }}>Category</span>
                <select
                  value={formData.categoryId}
                  onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--surface)', color: 'var(--foreground-dark)', border: '1px solid var(--surface-border)' }}
                >
                  {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </label>

              <label style={{ display: 'block', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.8rem', opacity: 0.8, display: 'block', marginBottom: '4px' }}>Title</span>
                <input
                  type="text"
                  placeholder="Name of this place"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--surface)', color: 'var(--foreground-dark)', border: '1px solid var(--surface-border)' }}
                />
              </label>

              <label style={{ display: 'block', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.8rem', opacity: 0.8, display: 'block', marginBottom: '4px' }}>Address (optional)</span>
                <input
                  type="text"
                  placeholder="Street, City, Zip"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--surface)', color: 'var(--foreground-dark)', border: '1px solid var(--surface-border)' }}
                />
              </label>

              <label style={{ display: 'block', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.8rem', opacity: 0.8, display: 'block', marginBottom: '4px' }}>Description (optional)</span>
                <textarea
                  rows={2}
                  placeholder="What's interesting about it?"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', resize: 'none', background: 'var(--surface)', color: 'var(--foreground-dark)', border: '1px solid var(--surface-border)' }}
                />
              </label>

              <label style={{ display: 'block', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.8rem', opacity: 0.8, display: 'block', marginBottom: '4px' }}>Photos (optional)</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  style={{ width: '100%', padding: '8px', color: 'var(--foreground-dark)', fontSize: '0.8rem' }}
                />
                {isUploading && <span style={{ fontSize: '0.8rem', color: '#3b82f6', marginTop: '4px', display: 'block' }}>Uploading...</span>}
                {formData.images && formData.images.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {formData.images.map((img, i) => (
                      <img key={i} src={img} alt={`Preview ${i}`} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--surface-border)' }} />
                    ))}
                  </div>
                )}
              </label>

              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.8rem', opacity: 0.8, display: 'block', marginBottom: '8px' }}>Your Rating</span>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      onClick={() => setFormData({ ...formData, rating: star })}
                      style={{
                        cursor: 'pointer',
                        fontSize: '1.5rem',
                        lineHeight: 1,
                        color: formData.rating >= star ? '#fbbf24' : 'var(--surface-border)',
                        transition: 'color 0.2s'
                      }}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  disabled={!formData.title}
                  onClick={handleSavePin}
                  style={{ flex: 1, padding: '10px', background: formData.title ? 'var(--primary)' : 'rgba(0,0,0,0.2)', color: 'white', border: 'none', borderRadius: '8px', cursor: formData.title ? 'pointer' : 'not-allowed', fontWeight: '600' }}
                >
                  {editingPinId ? '✏️ Update' : 'Save'}
                </button>
                <button
                  onClick={clearPending}
                  style={{ flex: 1, padding: '10px', background: 'transparent', color: 'var(--foreground-dark)', border: '1px solid var(--surface-border)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Conditional Layout Switching: Elements hide when editing */}
          {!pendingLocation && (
            <>
              {/* Native Filter Section */}
              <div>
                <h3 style={{ fontSize: '0.85rem', marginBottom: '12px', fontWeight: 600, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Categories</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {nativeCategories.map(c => {
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

              {/* Custom Filter Section */}
              <div style={{ padding: '20px 0', borderTop: '1px solid var(--surface-border)', borderBottom: '1px solid var(--surface-border)' }}>
                <h3 style={{ fontSize: '0.85rem', marginBottom: '12px', fontWeight: 600, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Custom Categories</h3>

                {customCategories.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                    {customCategories.map(c => {
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
                )}

                {isCreatingCategory ? (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <input type="text" placeholder="e.g. 🏎️ Race Track" value={newCategoryData.label} onChange={e => setNewCategoryData({ ...newCategoryData, label: e.target.value })} style={{ flex: 1, padding: '8px', borderRadius: '6px', background: 'var(--surface)', color: 'var(--foreground-dark)', border: '1px solid var(--surface-border)' }} />
                    <input type="color" value={newCategoryData.color} onChange={e => setNewCategoryData({ ...newCategoryData, color: e.target.value })} style={{ width: '40px', height: '36px', padding: '0', border: 'none', borderRadius: '6px', cursor: 'pointer' }} />
                    <button onClick={handleCreateCategory} disabled={!newCategoryData.label} style={{ padding: '0 12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Add</button>
                    <button onClick={() => setIsCreatingCategory(false)} style={{ padding: '0 12px', background: 'transparent', color: 'var(--foreground-dark)', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setIsCreatingCategory(true)} style={{ padding: '8px 16px', background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, width: '100%' }}>
                    + NEW CATEGORY
                  </button>
                )}
              </div>

              {filteredPins.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                    Saved Places ({filteredPins.length})
                  </h3>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {filteredPins.map((p, idx) => (
                      <li
                        key={p.id || idx}
                        onClick={() => setActivePinIndex(activePinIndex === idx ? null : idx)}
                        style={{
                          background: activePinIndex === idx ? 'rgba(99, 102, 241, 0.15)' : 'var(--input-bg)',
                          padding: '12px 16px', borderRadius: '12px', borderLeft: `4px solid ${p.category?.color}`,
                          cursor: 'pointer', transition: 'all 0.2s', border: activePinIndex === idx ? `1px solid ${p.category?.color}` : '1px solid var(--surface-border)',
                          boxShadow: activePinIndex === idx ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                        }}
                        onMouseOver={(e) => {
                          if (activePinIndex !== idx) e.currentTarget.style.background = 'var(--surface-border)';
                        }}
                        onMouseOut={(e) => {
                          if (activePinIndex !== idx) e.currentTarget.style.background = 'var(--input-bg)';
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ fontWeight: '600', fontSize: '1rem' }}>{p.title}</div>
                          {p.rating && (
                            <div style={{ color: '#fbbf24', fontSize: '0.9rem', letterSpacing: '-1px' }}>
                              {'★'.repeat(p.rating)}{'☆'.repeat(5 - p.rating)}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '2px', color: p.category?.color || '#a1a1aa' }}>{p.category?.label}</div>
                        {activePinIndex === idx && (
                          <div style={{ fontSize: '0.9rem', marginTop: '12px', padding: '12px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                            {p.description ? (
                              <div style={{ margin: 0, opacity: 1, color: 'var(--foreground-dark)' }} dangerouslySetInnerHTML={{ __html: p.description.replace(/\n/g, '<br/>') }} />
                            ) : (
                              <p style={{ margin: 0, opacity: 1, color: 'var(--foreground-dark)' }}>No description provided.</p>
                            )}

                            {p.address && (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', padding: '8px 12px', background: 'rgba(0,0,0,0.05)', borderRadius: '6px', border: '1px solid var(--surface-border)' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--foreground-dark)', opacity: 0.9, flex: 1, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.address}</span>
                                <button
                                  title="Copy Address"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(p.address);
                                    const btn = e.currentTarget;
                                    const original = btn.innerHTML;
                                    btn.innerHTML = '✅';
                                    setTimeout(() => btn.innerHTML = original, 1500);
                                  }}
                                  style={{ flexShrink: 0, padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.7, transition: 'opacity 0.2s', fontSize: '1.2rem', marginLeft: '8px' }}
                                  onMouseOver={e => e.currentTarget.style.opacity = 1}
                                  onMouseOut={e => e.currentTarget.style.opacity = 0.7}
                                >
                                  📋
                                </button>
                              </div>
                            )}

                            {p.images && p.images.length > 0 && (
                              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', overflowX: 'auto', paddingBottom: '6px' }}>
                                {p.images.map((img, i) => (
                                  <img key={i} src={img} alt="Detail" onClick={(e) => { e.stopPropagation(); setEnlargedImage(img); }} style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--surface-border)', flexShrink: 0 }} />
                                ))}
                              </div>
                            )}

                            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                              <button onClick={(e) => { e.stopPropagation(); handleEditClick(p); }} style={{ flex: 1, padding: '8px', background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Edit</button>
                              <button onClick={(e) => handleDeletePin(p.id, e)} style={{ flex: 1, padding: '8px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Delete</button>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </aside>

      {/* Map Area */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapComponent
          theme={theme}
          flyToLocation={flyToLocation}
          isDroppingPin={isDroppingPin}
          onMapClick={handleMapClick}
          pendingLocation={pendingLocation}
          pins={filteredPins}
          activePinIndex={activePinIndex}
        />

        {/* Top Navbar */}
        <nav
          className="glass-panel"
          style={{
            position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)',
            width: '90%', maxWidth: '800px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 24px', borderRadius: '100px', zIndex: 30, gap: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
          }}
        >
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <div style={{ display: 'flex', width: '100%', gap: '8px' }}>
              <input
                type="text"
                placeholder="Search for a city or place..."
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                  flex: 1, padding: '12px 20px', borderRadius: '24px',
                  border: '1px solid var(--surface-border)', outline: 'none',
                  background: 'var(--surface)', color: 'var(--foreground-dark)'
                }}
              />
              <button
                onClick={executeSearchAndGo}
                style={{
                  padding: '10px 24px', borderRadius: '24px', background: 'var(--primary)',
                  color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600,
                  transition: 'background 0.2s'
                }}
              >
                Go
              </button>
            </div>

            {searchResults.length > 0 && (
              <ul style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px',
                background: 'var(--surface)', backdropFilter: 'blur(16px)',
                border: '1px solid var(--surface-border)', borderRadius: '12px',
                listStyle: 'none', overflow: 'hidden', zIndex: 40,
                boxShadow: '0 12px 48px rgba(0,0,0,0.2)'
              }}>
                {searchResults.map((result, idx) => (
                  <li
                    key={result.id || idx}
                    onClick={() => selectSearchResult(result)}
                    style={{
                      padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--surface-border)',
                      fontSize: '0.9rem'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface-border)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {result.name}{result.admin1 ? `, ${result.admin1}` : ''}{result.country ? `, ${result.country}` : ''}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                style={{
                  padding: '10px 20px', borderRadius: '24px', background: 'var(--surface)',
                  color: 'var(--foreground-dark)', border: '1px solid var(--surface-border)', cursor: 'pointer', fontWeight: 600,
                  minWidth: '160px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--surface-border)'}
                onMouseOut={e => e.currentTarget.style.background = 'var(--surface)'}
              >
                <span>{THEMES.find(t => t.id === theme)?.label || 'Theme'}</span>
                <span style={{ fontSize: '0.8rem', marginLeft: '8px' }}>{isThemeDropdownOpen ? '▲' : '▼'}</span>
              </button>

              {isThemeDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: '8px', width: '100%',
                  background: 'var(--surface)', backdropFilter: 'blur(16px)',
                  border: '1px solid var(--surface-border)', borderRadius: '12px',
                  overflow: 'hidden', zIndex: 40, boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                }}>
                  {THEMES.map(t => (
                    <div
                      key={t.id}
                      onClick={() => { setTheme(t.id); setIsThemeDropdownOpen(false); }}
                      style={{
                        padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--surface-border)',
                        fontSize: '0.9rem', color: theme === t.id ? 'var(--primary)' : 'var(--foreground-dark)',
                        background: theme === t.id ? 'rgba(0,0,0,0.05)' : 'transparent', fontWeight: theme === t.id ? 'bold' : 'normal'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface-border)'}
                      onMouseOut={(e) => e.currentTarget.style.background = theme === t.id ? 'rgba(0,0,0,0.05)' : 'transparent'}
                    >
                      {t.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                window.location.href = '/login';
              }}
              style={{
                padding: '10px 20px', borderRadius: '24px', background: 'transparent',
                color: 'var(--foreground-dark)', border: '1px solid var(--surface-border)', cursor: 'pointer', fontWeight: 600,
                transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              Logout
            </button>
          </div>
        </nav>
      </div>

      {/* Enlarge Image Modal Popup */}
      {enlargedImage && (
        <div
          onClick={() => setEnlargedImage(null)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'zoom-out' }}
        >
          <img src={enlargedImage} alt="Enlarged" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }} />
          <div style={{ position: 'absolute', top: '24px', right: '32px', color: 'white', fontSize: '32px', fontWeight: 'bold' }}>✕</div>
        </div>
      )}
    </main>
  );
}
