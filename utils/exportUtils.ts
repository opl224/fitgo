
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

/**
 * Validates the path coordinates before export
 */
const validatePath = (path: [number, number][]): boolean => {
  if (!path || path.length < 2) return false;
  return path.every(coord => 
    Array.isArray(coord) && 
    coord.length === 2 && 
    !isNaN(coord[0]) && 
    !isNaN(coord[1])
  );
};

/**
 * Handles permission checks for filesystem access
 */
const checkPermissions = async () => {
  if (Capacitor.getPlatform() === 'web') return true;
  
  try {
    const status = await Filesystem.checkPermissions();
    if (status.publicStorage !== 'granted') {
      const request = await Filesystem.requestPermissions();
      return request.publicStorage === 'granted';
    }
    return true;
  } catch (e) {
    console.error('Permission check failed:', e);
    return false;
  }
};

export const exportToGPX = async (path: [number, number][], startTime: number) => {
  if (!validatePath(path)) {
    throw new Error('Invalid path data for GPX export');
  }

  const hasPermission = await checkPermissions();
  if (!hasPermission) {
    throw new Error('Storage permission denied');
  }

  const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="FitGO" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>FitGO Run - ${new Date(startTime).toLocaleString()}</name>
    <trkseg>`;
  
  const gpxFooter = `
    </trkseg>
  </trk>
</gpx>`;

  const trkpts = path.map(([lng, lat]) => `
      <trkpt lat="${lat}" lon="${lng}"></trkpt>`).join('');

  const gpxContent = gpxHeader + trkpts + gpxFooter;
  const fileName = `FitGO_Run_${Date.now()}.gpx`;

  try {
    // Write to Documents directory for easier access on mobile
    const result = await Filesystem.writeFile({
      path: fileName,
      data: gpxContent,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
      recursive: true
    });

    // Share the file URI so user can choose where to save/send it
    await Share.share({
      title: 'Export GPX',
      text: 'Share your running route data',
      url: result.uri,
      dialogTitle: 'Share GPX',
    });
    
    return result.uri;
  } catch (error: any) {
    console.error('Error exporting GPX:', error);
    if (error.message?.includes('NO_SPACE')) {
      throw new Error('Storage is full. Please free up some space.');
    }
    throw error;
  }
};

export const exportToJSON = async (path: [number, number][], sessionInfo: any) => {
  if (!validatePath(path)) {
    throw new Error('Invalid path data for JSON export');
  }

  const data = JSON.stringify({
    ...sessionInfo,
    path,
    exportedAt: new Date().toISOString(),
    version: '1.1'
  }, null, 2);
  
  const fileName = `FitGO_Run_${Date.now()}.json`;

  try {
    const result = await Filesystem.writeFile({
      path: fileName,
      data: data,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
      recursive: true
    });

    await Share.share({
      title: 'Export JSON',
      text: 'Share your activity data',
      url: result.uri,
      dialogTitle: 'Share JSON',
    });
    
    return result.uri;
  } catch (error: any) {
    console.error('Error exporting JSON:', error);
    throw error;
  }
};
