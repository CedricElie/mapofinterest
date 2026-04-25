'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Safe escaping for HTML injection prevention
const escapeHTML = (str) => {
  if (!str) return '';
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
};

const getMapLibreStyle = (theme) => {
  if (theme === 'satellite') {
    return {
      version: 8,
      sources: {
        'esri-satellite': {
          type: 'raster',
          tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
          tileSize: 256,
          maxzoom: 22,
          attribution: 'Tiles &copy; Esri'
        },
        'esri-roads': {
          type: 'raster',
          tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}'],
          tileSize: 256,
          maxzoom: 22
        },
        'esri-labels': {
          type: 'raster',
          tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'],
          tileSize: 256,
          maxzoom: 22
        }
      },
      layers: [
        {
          id: 'satellite-layer',
          type: 'raster',
          source: 'esri-satellite',
          minzoom: 0,
          maxzoom: 22
        },
        {
          id: 'roads-layer',
          type: 'raster',
          source: 'esri-roads',
          minzoom: 0,
          maxzoom: 22
        },
        {
          id: 'labels-layer',
          type: 'raster',
          source: 'esri-labels',
          minzoom: 0,
          maxzoom: 22
        }
      ]
    };
  }
  
  if (theme === 'colored') {
    return {
      version: 8,
      sources: {
        'osm': {
          type: 'raster',
          tiles: [
            'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          maxzoom: 19,
          attribution: '&copy; OpenStreetMap contributors'
        }
      },
      layers: [
        {
          id: 'osm-layer',
          type: 'raster',
          source: 'osm',
          minzoom: 0,
          maxzoom: 19
        }
      ]
    };
  }

  if (theme === 'transport') {
    return {
      version: 8,
      sources: {
        'transport': {
          type: 'raster',
          tiles: ['https://tile.memomaps.de/tilegen/{z}/{x}/{y}.png'],
          tileSize: 256,
          maxzoom: 19,
          attribution: '&copy; <a href="http://memomaps.de">ÖPNV-Karte</a> contributors'
        }
      },
      layers: [
        {
          id: 'transport-layer',
          type: 'raster',
          source: 'transport',
          minzoom: 0,
          maxzoom: 19
        }
      ]
    };
  }

  return theme === 'light' 
    ? 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
    : 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
};

export default function MapComponent({ isDroppingPin, onMapClick, pins, pendingLocation, theme, flyToLocation, activePinIndex, routeData, onPinSelect }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  
  const isDroppingRef = useRef(isDroppingPin);
  const onMapClickRef = useRef(onMapClick);
  const pendingMarkerRef = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    isDroppingRef.current = isDroppingPin;
    if (map.current && map.current.getCanvas()) {
      map.current.getCanvas().style.cursor = isDroppingPin ? 'crosshair' : '';
    }
  }, [isDroppingPin]);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    if (map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: getMapLibreStyle(theme),
      center: [-74.006, 40.7128], 
      zoom: 13,
      pitch: 45, 
      bearing: -17.6,
      antialias: true
    });

    map.current.on('load', () => {
      map.current.addControl(new maplibregl.NavigationControl({
        visualizePitch: true,
      }), 'bottom-right');

      // Add route source and layer
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        }
      });

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#4f46e5',
          'line-width': 6,
          'line-opacity': 0.8
        }
      });
    });

    map.current.on('click', (e) => {
      if (onMapClickRef.current) {
        onMapClickRef.current({ lng: e.lngLat.lng, lat: e.lngLat.lat });
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); 

  // Handle Theme switching
  useEffect(() => {
    if (!map.current) return;
    try {
      map.current.setStyle(getMapLibreStyle(theme), { diff: false });
    } catch (err) {
      console.warn('Map style update failed, retrying on next frame:', err);
    }
  }, [theme]);

  // Handle Searching / Fly To Location
  useEffect(() => {
    if (!map.current || !flyToLocation) return;
    
    map.current.flyTo({
      center: [flyToLocation.lng, flyToLocation.lat],
      zoom: 13,
      duration: 2500, // smooth cinematic flight
      essential: true 
    });
  }, [flyToLocation]);

  // Handle active pin programmatic selection
  useEffect(() => {
    if (!map.current || activePinIndex === null || activePinIndex === undefined) return;
    
    const pin = pins[activePinIndex];
    if (pin) {
      map.current.flyTo({ center: [pin.lng, pin.lat], zoom: 15, duration: 1500 });
      
      const targetMarker = markersRef.current[pin.id];
      if (targetMarker) {
        const popup = targetMarker.getPopup();
        if (popup && !popup.isOpen()) {
          targetMarker.togglePopup();
        }
      }
    }
  }, [activePinIndex, pins]);

  // Sync permanent pins to map markers
  useEffect(() => {
    if (!map.current || !pins) return;
    
    const currentPinIds = new Set();
    
    pins.forEach((newPin) => {
      // Create a fallback id just in case a pin sits pending without one
      const pinId = newPin.id || `${newPin.lat}-${newPin.lng}`;
      currentPinIds.add(pinId.toString());
      
      if (!markersRef.current[pinId]) {
        // Construct the custom HTML container
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.textAlign = 'center';
        el.style.cursor = 'pointer';
        
        // Add click listener for routing selection
        el.addEventListener('click', (e) => {
          if (onPinSelect) {
            e.stopPropagation();
            onPinSelect(newPin);
          }
        });
        
        let starsHTML = '';
        if (newPin.rating) {
           starsHTML = `<div style="color: #fbbf24; font-size: 11px; letter-spacing: -1px; margin-top: 2px;">${'★'.repeat(newPin.rating)}${'☆'.repeat(5 - newPin.rating)}</div>`;
        }

        el.innerHTML = `
          <div style="background: var(--surface); padding: 6px 10px; border-radius: 8px; font-family: sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 1px solid var(--surface-border); display: flex; flex-direction: column; align-items: center; margin-bottom: 4px; pointer-events: none;">
            <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: ${newPin.category?.color || '#fff'}; letter-spacing: 0.5px;">
              ${escapeHTML(newPin.category?.label || 'Pin')}
            </div>
            <div style="font-weight: 600; font-size: 12px; color: var(--foreground-dark); white-space: nowrap;">
              ${escapeHTML(newPin.title)}
            </div>
            ${starsHTML}
          </div>
          <div style="width: 14px; height: 14px; border-radius: 50%; background: ${newPin.category?.color || '#a1a1aa'}; margin: 0 auto; border: 2px solid #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
        `;

        const popup = new maplibregl.Popup({ offset: 35, className: 'dark-popup' })
          .setHTML(`
            <div style="padding: 4px; min-width: 140px;">
              <p style="margin: 0; font-size: 10px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; color: ${newPin.category?.color};">${escapeHTML(newPin.category?.label)}</p>
              <h3 style="margin: 4px 0 6px; font-size: 16px;">${escapeHTML(newPin.title)}</h3>
              ${newPin.description ? `<p style="margin: 0; font-size: 13px; opacity: 0.8;">${escapeHTML(newPin.description).replace(/\n/g, '<br/>')}</p>` : ''}
              ${newPin.rating ? `<p style="margin: 6px 0 0; color: #fbbf24; font-size: 14px;">${'★'.repeat(newPin.rating)}${'☆'.repeat(5-newPin.rating)}</p>` : ''}
              ${newPin.images && newPin.images.length > 0 ? `
                <div style="display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap; max-width: 160px;">
                  ${newPin.images.map(img => `<img src="${img}" style="width: 32px; height: 32px; object-fit: cover; border-radius: 4px; border: 1px solid var(--surface-border);" />`).join('')}
                </div>
              ` : ''}
            </div>
          `);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([newPin.lng, newPin.lat])
          .setPopup(popup)
          .addTo(map.current);
          
        markersRef.current[pinId] = marker;
      }
    });
    
    // Cleanup any markers that are no longer in the pins array payload
    Object.keys(markersRef.current).forEach(pinId => {
      if (!currentPinIds.has(pinId.toString())) {
        if (markersRef.current[pinId]) {
          markersRef.current[pinId].remove();
          delete markersRef.current[pinId];
        }
      }
    });
  }, [pins]);

  // Handle temporary pending drop marker
  useEffect(() => {
    if (!map.current) return;
    
    if (pendingLocation) {
      const tempColor = theme === 'light' ? '#000000' : '#ffffff';
      if (!pendingMarkerRef.current) {
        pendingMarkerRef.current = new maplibregl.Marker({ color: tempColor }) 
          .setLngLat([pendingLocation.lng, pendingLocation.lat])
          .addTo(map.current);
      } else {
        pendingMarkerRef.current.setLngLat([pendingLocation.lng, pendingLocation.lat]);
      }
    } else {
      if (pendingMarkerRef.current) {
        pendingMarkerRef.current.remove();
        pendingMarkerRef.current = null;
      }
    }
  }, [pendingLocation, theme]);

  // Handle Route data updates
  useEffect(() => {
    if (!map.current || !map.current.getSource('route')) return;
    
    if (routeData && routeData.geometry && routeData.geometry.coordinates && routeData.geometry.coordinates.length > 0) {
      map.current.getSource('route').setData(routeData);
      
      // Auto-fit bounds to the route
      const coordinates = routeData.geometry.coordinates;
      const bounds = coordinates.reduce((acc, coord) => {
        return acc.extend(coord);
      }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
      
      map.current.fitBounds(bounds, { padding: 80, duration: 2000 });
    } else {
      map.current.getSource('route').setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: []
        }
      });
    }
  }, [routeData]);

  return (
    <div 
      ref={mapContainer} 
      style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} 
    />
  );
}
