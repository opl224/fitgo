
import React, { useEffect, useRef, useCallback, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import simplify from 'simplify-js';
import { GriddyIcon } from './GriddyIcon';
import { GeoPoint, PaceZone } from '../types';
import { useOnlineStatus } from '../utils/connectivity';
import { MapOfflineService } from '../utils/mapOfflineService';

interface RunMapProps {
  currentLocation: GeoPoint | null;
  path: [number, number][] | GeoPoint[];
  isFollowingUser: boolean;
  isSheetExpanded: boolean;
  sheetVelocity?: number;
  sheetHeightPx?: number;
  isDarkMode: boolean;
  isZenMode: boolean;
  readOnly?: boolean;
  paceZones?: PaceZone[];
  onToggleFollow?: () => void;
  onToggleZenMode?: () => void;
  isGPSSearching?: boolean;
  t?: any;
  language?: string;
}

const triggerHaptic = (pattern: number | number[] = 50) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

/**
 * RunMap Component
 * Optimized with MapLibre GL JS, Simplify.js, and GeoJSON.
 */
export const RunMap: React.FC<RunMapProps> = ({ 
  currentLocation, 
  path, 
  isFollowingUser, 
  isSheetExpanded, 
  sheetVelocity = 0,
  sheetHeightPx = 0,
  isDarkMode, 
  isZenMode, 
  readOnly = false,
  paceZones = [],
  onToggleFollow, 
  onToggleZenMode,
  isGPSSearching,
  t,
  language,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const lastPanRef = useRef<number>(0);
  
  const { isOnline } = useOnlineStatus();

  // Helper to convert path to GeoJSON coordinates [lng, lat]
  const getCoords = useCallback(() => {
    if (!path || path.length === 0) return [];
    if (Array.isArray(path[0])) {
      return path as [number, number][];
    }
    return (path as GeoPoint[]).map(p => [p.longitude, p.latitude] as [number, number]);
  }, [path]);

  // Simplify path for history/read-only mode
  const getSimplifiedCoords = useCallback(() => {
    const coords = getCoords();
    if (!readOnly || coords.length < 100) return coords;
    
    const points = coords.map(c => ({ x: c[0], y: c[1] }));
    const simplified = simplify(points, 0.00001, true);
    return simplified.map(p => [p.x, p.y] as [number, number]);
  }, [getCoords, readOnly]);

  /**
   * Centers the map on the user's current location
   */
  const centerOnUser = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map || !currentLocation) return;

    const lngLat: [number, number] = [currentLocation.longitude, currentLocation.latitude];
    
    // Calculate vertical offset for bottom sheet
    const verticalOffset = isZenMode ? 0 : (isSheetExpanded ? -0.0015 : -0.0008);
    
    map.flyTo({
      center: [lngLat[0], lngLat[1] + verticalOffset],
      speed: 1.2,
      curve: 1.42,
      essential: true
    });
  }, [currentLocation, isZenMode, isSheetExpanded]);

  // Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const coords = getCoords();
    let initialCenter: [number, number] = [106.8272, -6.1751]; // Jakarta default
    
    if (coords.length > 0) {
      initialCenter = coords[0];
    } else if (currentLocation) {
      initialCenter = [currentLocation.longitude, currentLocation.latitude];
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: isDarkMode 
        ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
        : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: initialCenter,
      zoom: 16,
      attributionControl: false,
      dragPan: !isFollowingUser || readOnly,
      pitchWithRotate: false,
      dragRotate: false,
    });

    map.on('load', () => {
      // Add source for the path
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: getSimplifiedCoords()
          }
        }
      });

      // Add layer for the path
      map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#2563eb',
          'line-width': 4,
          'line-opacity': 0.9
        }
      });

      if (readOnly && coords.length > 1) {
        const bounds = coords.reduce((acc, coord) => acc.extend(coord), new maplibregl.LngLatBounds(coords[0], coords[0]));
        map.fitBounds(bounds, { padding: 40, animate: false });
      }
    });

    mapInstanceRef.current = map;

    if (!readOnly && currentLocation) {
      const el = document.createElement('div');
      el.className = 'custom-location-marker';
      el.innerHTML = `<div style="width:14px;height:14px;background-color:#2563eb;border:2.5px solid white;border-radius:50%;box-shadow:0 0 10px rgba(37, 99, 235, 0.5);position:relative;transition:all 0.3s ease;">
                        <div style="position:absolute;top:-6px;left:-6px;right:-6px;bottom:-6px;background-color:rgba(37, 99, 235, 0.2);border-radius:50%;animation:ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;z-index: -1;"></div>
                      </div>`;
      
      markerRef.current = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([currentLocation.longitude, currentLocation.latitude])
        .addTo(map);
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Dark/Light mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    
    const style = isDarkMode 
      ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
      : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
    
    map.setStyle(style);
    
    // Wait for style to load before re-adding path
    map.once('style.load', () => {
      if (!map.getSource('route')) {
        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: getSimplifiedCoords()
            }
          }
        });
        map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#2563eb', 'line-width': 6, 'line-opacity': 0.8 }
        });
      }
    });
  }, [isDarkMode, getSimplifiedCoords]);

  // Handle Path Updates (Lazy Update already handled in hook, but we update source here)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !map.getSource('route')) return;

    const coords = getSimplifiedCoords();
    if (coords.length === 0) {
      (map.getSource('route') as maplibregl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: []
      });
      return;
    }

    (map.getSource('route') as maplibregl.GeoJSONSource).setData({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: coords
      }
    });
  }, [path, getSimplifiedCoords]);

  // Handle User Marker and Auto-follow
  useEffect(() => {
    if (readOnly) return;
    const map = mapInstanceRef.current;
    if (!map || !currentLocation) return;

    const lngLat: [number, number] = [currentLocation.longitude, currentLocation.latitude];

    if (markerRef.current) {
      markerRef.current.setLngLat(lngLat);
    } else {
      const el = document.createElement('div');
      el.className = 'custom-location-marker';
      el.innerHTML = `<div style="width:14px;height:14px;background-color:#2563eb;border:2.5px solid white;border-radius:50%;box-shadow:0 0 10px rgba(37, 99, 235, 0.5);position:relative;transition:all 0.3s ease;">
                        <div style="position:absolute;top:-6px;left:-6px;right:-6px;bottom:-6px;background-color:rgba(37, 99, 235, 0.2);border-radius:50%;animation:ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;z-index: -1;"></div>
                      </div>`;
      markerRef.current = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(lngLat).addTo(map);
    }

    if (isFollowingUser) {
      const now = Date.now();
      if (now - lastPanRef.current > 1000) { // Update follow center every 1s for performance
        lastPanRef.current = now;
        centerOnUser();
      }
    }
  }, [currentLocation, isFollowingUser, centerOnUser, readOnly]);

  // Handle Dragging state
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || readOnly) return;

    if (isFollowingUser) {
      map.dragPan.disable();
    } else {
      map.dragPan.enable();
    }
  }, [isFollowingUser, readOnly]);

  const handleZoomIn = () => { 
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn(); 
      if (isFollowingUser) setTimeout(() => centerOnUser(), 300);
      triggerHaptic(25); 
    }
  };
  const handleZoomOut = () => { 
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut(); 
      if (isFollowingUser) setTimeout(() => centerOnUser(), 300);
      triggerHaptic(25); 
    }
  };
  
  const handleRecenter = () => {
    triggerHaptic(50);
    if (currentLocation && mapInstanceRef.current) {
      centerOnUser();
    }
    if (!isFollowingUser && onToggleFollow) onToggleFollow();
  };
  
  return (
    <div className="absolute inset-0 w-full h-full z-0 bg-gray-200 dark:bg-gray-900 transition-colors">
      <div ref={mapContainerRef} className="w-full h-full" style={{ willChange: 'transform', transform: 'translateZ(0)' }} />
      
      {/* Offline and GPS Indicators */}
      <div className="absolute top-6 left-6 flex flex-col gap-2 z-[400] pointer-events-none">
        {!isOnline && (
          <div className="bg-orange-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg animate-in slide-in-from-left-4 duration-300">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">{t?.offlineMode || "Offline Mode"}</span>
          </div>
        )}
      </div>

      {!readOnly && (
        <div className={`absolute right-4 flex flex-col gap-4 pointer-events-auto z-[400] transition-all duration-300 ease-in-out`} style={{ top: isZenMode ? '24px' : (isSheetExpanded ? '120px' : '160px') }}>
            <div className={`flex flex-col gap-4 transition-all duration-300 ${isZenMode ? 'opacity-0 translate-x-10 pointer-events-none absolute' : 'opacity-100 translate-x-0'}`}>
                <div className="flex flex-col bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
                    <button onClick={() => { onToggleFollow?.(); setTimeout(() => centerOnUser(), 0); }} className={`w-12 h-12 flex items-center justify-center active:bg-gray-50 dark:active:bg-gray-700 transition-all duration-300 ${isFollowingUser ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {isFollowingUser ? <GriddyIcon name="Lock" size={20} /> : <GriddyIcon name="Unlock" size={20} />}
                    </button>
                    <div className="h-px bg-gray-100 dark:bg-gray-700 mx-2"></div>
                    <button onClick={handleRecenter} className="w-12 h-12 flex items-center justify-center text-gray-700 dark:text-gray-300 active:bg-gray-50 dark:active:bg-gray-700 transition-all duration-300">
                    <GriddyIcon name="Locate" size={20} />
                    </button>
                </div>
                <div className="flex flex-col bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
                    <button onClick={handleZoomIn} className="w-12 h-12 flex items-center justify-center text-gray-700 dark:text-gray-300 active:bg-gray-50 dark:active:bg-gray-700 transition-all duration-300">
                    <GriddyIcon name="Plus" size={20} />
                    </button>
                    <div className="h-px bg-gray-100 dark:bg-gray-700 mx-2"></div>
                    <button onClick={handleZoomOut} className="w-12 h-12 flex items-center justify-center text-gray-700 dark:text-gray-300 active:bg-gray-50 dark:active:bg-gray-700 transition-all duration-300">
                    <GriddyIcon name="Minus" size={20} />
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
