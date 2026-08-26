import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export interface RunData {
  id: string;
  type: string;
  startTime: number;
  duration: number;
  distance: number;
  path: { latitude: number; longitude: number; altitude: number | null; timestamp: number }[];
  calories: number;
  avgPace: string;
}

/**
 * Simpan Data Lari ke File JSON
 * Menggunakan Directory.Data (Penyimpanan Internal Privat)
 */
export const saveRunToFile = async (runData: RunData): Promise<boolean> => {
  try {
    const filename = `run_${runData.id}.json`;
    
    await Filesystem.writeFile({
      path: filename,
      data: JSON.stringify(runData),
      directory: Directory.Data, // ✅ Aman & Privat
      encoding: Encoding.UTF8,
      recursive: true,
    });
    
    console.log('✅ File tersimpan:', filename);
    return true;
  } catch (error) {
    console.error('❌ Gagal simpan file:', error);
    return false;
  }
};

/**
 * Baca Semua Daftar File Lari (History)
 */
export const getRunHistoryFiles = async (): Promise<string[]> => {
  try {
    const fileList = await Filesystem.readdir({
      path: '',
      directory: Directory.Data,
    });
    
    // Filter hanya file yang berawalan 'run_' dan berakhir '.json'
    return fileList.files
      .filter(file => file.name.startsWith('run_') && file.name.endsWith('.json'))
      .map(file => file.name);
  } catch (error) {
    console.error('❌ Gagal baca history:', error);
    return [];
  }
};

/**
 * Baca Detail Lari dari File Tertentu
 */
export const getRunDetailFromFile = async (filename: string): Promise<RunData | null> => {
  try {
    const file = await Filesystem.readFile({
      path: filename,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
    
    return JSON.parse(file.data as string);
  } catch (error) {
    console.error('❌ Gagal baca detail:', error);
    return null;
  }
};

/**
 * Hapus File Lari
 */
export const deleteRunFile = async (filename: string): Promise<boolean> => {
  try {
    await Filesystem.deleteFile({
      path: filename,
      directory: Directory.Data,
    });
    return true;
  } catch (error) {
    console.error('❌ Gagal hapus file:', error);
    return false;
  }
};

/**
 * Export/Share File ke WhatsApp/Email
 */
export const exportRunFile = async (filename: string) => {
  try {
    const { uri } = await Filesystem.getUri({
      path: filename,
      directory: Directory.Data,
    });
    
    await Share.share({
      title: 'Data Lari FitGO',
      text: 'Berikut data lari saya dari aplikasi FitGO',
      url: uri,
      dialogTitle: 'Bagikan Data Lari',
    });
  } catch (error) {
    console.error('❌ Gagal export:', error);
  }
};
