
import React, { useEffect, useRef } from 'react';
import { 
  Lock, 
  Unlock, 
  Locate, 
  Plus, 
  Minus, 
  Eye 
} from 'lucide-react';
import { GeoPoint, PaceZone } from '../types';

declare const L: any;

interface RunMapProps {
  currentLocation: GeoPoint | null;
  path: GeoPoint[];
  isRunning: boolean;
  isFollowingUser: boolean;
  isSheetExpanded: boolean;
  isDarkMode: boolean;
  isZenMode: boolean;
  readOnly?: boolean;
  paceZones?: PaceZone[];
  onToggleFollow?: () => void;
  onToggleZenMode?: () => void;
}

const triggerHaptic = (pattern: number | number[] = 50) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

export const RunMap: React.FC<RunMapProps> = ({ 
  currentLocation, 
  path, 
  isRunning, 
  isFollowingUser, 
  isSheetExpanded, 
  isDarkMode, 
  isZenMode, 
  readOnly = false,
  paceZones = [],
  onToggleFollow, 
  onToggleZenMode,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const polylinesRef = useRef<any[]>([]);
  const tileLayerRef = useRef<any>(null);

  const createMarkerIcon = () => {
    if (typeof L === 'undefined') return null;
    return L.divIcon({
      className: 'custom-location-marker',
      html: `<div style="width:16px;height:16px;background-color:#2563eb;border:2px solid white;border-radius:50%;box-shadow:0 4px 6px -1px rgba(0, 0, 0, 0.1);position:relative;">
              <div style="position:absolute;top:-4px;left:-4px;right:-4px;bottom:-4px;background-color:rgba(59, 130, 246, 0.3);border-radius:50%;animation:ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;z-index: -1;"></div>
             </div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    if (typeof L === 'undefined') return;

    let initialLat = 37.7749;
    let initialLng = -122.4194;
    
    if (readOnly && path && path.length > 0) {
        initialLat = path[0].latitude;
        initialLng = path[0].longitude;
    } else if (currentLocation) {
        initialLat = currentLocation.latitude;
        initialLng = currentLocation.longitude;
    }

    // Fix for html2canvas: disable 3D transformations which cause offset issues in capture
    const map = L.map(mapContainerRef.current, {
      zoomControl: false, 
      attributionControl: false,
      doubleClickZoom: !readOnly,
      touchZoom: !readOnly,
      dragging: !readOnly,
      // Critical: use canvas and disable 3D for proper centering in html2canvas captures
      preferCanvas: true,
      fadeAnimation: !readOnly,
      zoomAnimation: !readOnly,
      markerZoomAnimation: !readOnly,
      transform3DLimit: readOnly ? 0 : undefined 
    }).setView([initialLat, initialLng], 16);

    if (!readOnly) {
        const icon = createMarkerIcon();
        if (icon) {
            markerRef.current = L.marker([initialLat, initialLng], { 
                icon: icon,
                zIndexOffset: 1000 
            }).addTo(map);
        }
    }

    mapInstanceRef.current = map;
    
    // Ensure map is correctly sized and centered
    setTimeout(() => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
            if (readOnly && path && path.length > 0) {
                const points = path.map(p => [p.latitude, p.longitude]);
                const bounds = L.latLngBounds(points);
                mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], animate: false });
            }
        }
    }, 300);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); 

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || typeof L === 'undefined') return;
    if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);
    
    // Note: Some tile providers have CORS issues, CartoDB is generally better for sharing
    const tileUrl = isDarkMode 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
        
    tileLayerRef.current = L.tileLayer(tileUrl, { 
      maxZoom: 20, 
      crossOrigin: 'anonymous' // Critical for html2canvas sharing
    }).addTo(map);
  }, [isDarkMode]);

  useEffect(() => {
    if (readOnly) return;
    const map = mapInstanceRef.current;
    if (!map || typeof L === 'undefined') return;

    let latLng = null;
    if (currentLocation) latLng = [currentLocation.latitude, currentLocation.longitude];

    if (!markerRef.current && latLng) {
        const icon = createMarkerIcon();
        if (icon) {
            markerRef.current = L.marker(latLng, { icon: icon, zIndexOffset: 1000 }).addTo(map);
        }
    }

    if (markerRef.current && latLng) markerRef.current.setLatLng(latLng);

    if (isFollowingUser && latLng) {
        const zoom = map.getZoom();
        const point = map.project(latLng, zoom);
        const verticalOffset = isZenMode ? 0 : (isSheetExpanded ? 220 : 100); 
        const targetPoint = point.add([0, verticalOffset]);
        const targetLatLng = map.unproject(targetPoint, zoom);
        map.panTo(targetLatLng, { animate: true, duration: 0.8 });
    }
  }, [currentLocation, isFollowingUser, isSheetExpanded, isZenMode, readOnly]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !path || !Array.isArray(path) || path.length === 0) return;
    
    // Clear old lines
    polylinesRef.current.forEach(p => map.removeLayer(p));
    polylinesRef.current = [];
    
    let currentSegment: any[] = [];
    let lastZoneId: string | undefined = path[0].paceZoneId;
    
    path.forEach((point, index) => {
        const latLng = [point.latitude, point.longitude];
        if (point.paceZoneId === lastZoneId) {
            currentSegment.push(latLng);
        } else {
            const color = paceZones.find(z => z.id === lastZoneId)?.color || '#2563eb';
            const poly = L.polyline(currentSegment, { 
              color, 
              weight: 6, 
              opacity: 0.9, 
              lineJoin: 'round',
              renderer: L.canvas() // Ensure canvas rendering for better export
            }).addTo(map);
            polylinesRef.current.push(poly);
            currentSegment = [currentSegment[currentSegment.length - 1], latLng];
            lastZoneId = point.paceZoneId;
        }
    });
    
    if (currentSegment.length > 0) {
        const color = paceZones.find(z => z.id === lastZoneId)?.color || '#2563eb';
        const poly = L.polyline(currentSegment, { 
          color, 
          weight: 6, 
          opacity: 0.9, 
          lineJoin: 'round',
          renderer: L.canvas() 
        }).addTo(map);
        polylinesRef.current.push(poly);
    }
    
    if (readOnly && polylinesRef.current.length > 0) {
        const points = path.map(p => [p.latitude, p.longitude]);
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [40, 40], animate: false });
    }
  }, [path, readOnly, paceZones]);

  const handleZoomIn = () => { mapInstanceRef.current?.zoomIn(); triggerHaptic(25); };
  const handleZoomOut = () => { mapInstanceRef.current?.zoomOut(); triggerHaptic(25); };
  const handleRecenter = () => {
    triggerHaptic(50);
    if (currentLocation && mapInstanceRef.current && !isFollowingUser && onToggleFollow) onToggleFollow();
  };
  
  return (
    <div className="absolute inset-0 w-full h-full z-0 bg-gray-200 dark:bg-gray-900 transition-colors">
      <div ref={mapContainerRef} className="w-full h-full" />
      {!readOnly && (
        <div className={`absolute right-4 flex flex-col gap-4 pointer-events-auto z-[400] transition-all duration-300 ease-in-out`} style={{ top: isSheetExpanded ? '120px' : '160px' }}>
            <div className={`flex flex-col gap-4 transition-all duration-300 ${isZenMode ? 'opacity-0 translate-x-10 pointer-events-none absolute' : 'opacity-100 translate-x-0'}`}>
                <div className="flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                    <button onClick={onToggleFollow} className={`w-12 h-12 flex items-center justify-center active:bg-gray-50 dark:active:bg-gray-700 transition-all duration-300 ${isFollowingUser ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {isFollowingUser ? <Lock size={20} /> : <Unlock size={20} />}
                    </button>
                    <div className="h-px bg-gray-100 dark:bg-gray-700 mx-2"></div>
                    <button onClick={handleRecenter} className="w-12 h-12 flex items-center justify-center text-gray-700 dark:text-gray-300 active:bg-gray-50 dark:active:bg-gray-700 transition-all duration-300">
                    <Locate size={20} />
                    </button>
                </div>
                <div className="flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                    <button onClick={handleZoomIn} className="w-12 h-12 flex items-center justify-center text-gray-700 dark:text-gray-300 active:bg-gray-50 dark:active:bg-gray-700 transition-all duration-300">
                    <Plus size={20} />
                    </button>
                    <div className="h-px bg-gray-100 dark:bg-gray-700 mx-2"></div>
                    <button onClick={handleZoomOut} className="w-12 h-12 flex items-center justify-center text-gray-700 dark:text-gray-300 active:bg-gray-50 dark:active:bg-gray-700 transition-all duration-300">
                    <Minus size={20} />
                    </button>
                </div>
            </div>
            <button onClick={onToggleZenMode} className={`w-12 h-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex items-center justify-center active:bg-gray-50 dark:active:bg-gray-700 transition-all duration-500 ${isZenMode ? 'text-blue-600' : 'text-gray-500'}`}>
                <Eye size={20} />
            </button>
        </div>
      )}
    </div>
  );
};
