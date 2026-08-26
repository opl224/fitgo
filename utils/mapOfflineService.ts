
import { Capacitor } from '@capacitor/core';

const CACHE_NAME = 'gemini-run-map-cache-v1';
const MAX_TILES = 1500; // Roughly 50-100MB depending on zoom levels

/**
 * Service to manage offline map capabilities
 */
export const MapOfflineService = {
  /**
   * Check if we are on a platform that supports Service Workers (Web/Android/iOS via WebView)
   */
  isSWSupported(): boolean {
    return 'serviceWorker' in navigator;
  },

  /**
   * Get current cache size (number of tiles)
   */
  async getCacheSize(): Promise<number> {
    if (!this.isSWSupported()) return 0;
    try {
      const cache = await caches.open(CACHE_NAME);
      const keys = await cache.keys();
      return keys.length;
    } catch (e) {
      console.error('Failed to get map cache size', e);
      return 0;
    }
  },

  /**
   * Get current cache size in bytes
   */
  async getCacheSizeInBytes(): Promise<number> {
    if (!this.isSWSupported()) return 0;
    try {
      const cache = await caches.open(CACHE_NAME);
      const keys = await cache.keys();
      let totalSize = 0;
      
      for (const key of keys) {
        const response = await cache.match(key);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
      return totalSize;
    } catch (e) {
      console.error('Failed to get map cache size in bytes', e);
      return 0;
    }
  },

  /**
   * Clear all cached map tiles
   */
  async clearCache(): Promise<boolean> {
    if (!this.isSWSupported()) return false;
    try {
      return await caches.delete(CACHE_NAME);
    } catch (e) {
      console.error('Failed to clear map cache', e);
      return false;
    }
  },

  /**
   * Pre-cache tiles for a specific area (bounding box)
   * This is a simplified version that fetches tiles for current zoom and +1 zoom
   */
  async preCacheArea(lat: number, lng: number, radiusKm: number = 2): Promise<void> {
    if (!navigator.onLine) return;
    
    // This is complex to implement purely on client side without a helper library 
    // because we need to translate Lat/Lng to X/Y tile coordinates.
    // For now, we'll rely on the "Cache-on-view" strategy implemented in the Service Worker
    // which automatically caches tiles as the user pans/zooms.
    console.log(`Area around ${lat}, ${lng} will be cached as user views it.`);
  },

  /**
   * Maintain cache size by removing oldest tiles if over limit
   */
  async maintainCache(): Promise<void> {
    if (!this.isSWSupported()) return;
    try {
      const cache = await caches.open(CACHE_NAME);
      const keys = await cache.keys();
      
      if (keys.length > MAX_TILES) {
        // Remove oldest 20% of tiles
        const toRemove = Math.floor(MAX_TILES * 0.2);
        for (let i = 0; i < toRemove; i++) {
          await cache.delete(keys[i]);
        }
        console.log(`Cleaned up ${toRemove} old map tiles from cache.`);
      }
    } catch (e) {
      console.error('Cache maintenance failed', e);
    }
  }
};
