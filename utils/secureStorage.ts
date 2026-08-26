import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';

export const storage = {
  async set(key: string, value: any): Promise<void> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    await SecureStoragePlugin.set({ key, value: stringValue });
  },

  async get(key: string): Promise<any> {
    try {
      const { value } = await SecureStoragePlugin.get({ key });
      if (!value) return null;
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (e) {
      return null;
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await SecureStoragePlugin.remove({ key });
    } catch (e) {
      // ignore
    }
  },

  async clear(): Promise<void> {
    await SecureStoragePlugin.clear();
  },

  async keys(): Promise<string[]> {
    const { value } = await SecureStoragePlugin.keys();
    return value;
  }
};
