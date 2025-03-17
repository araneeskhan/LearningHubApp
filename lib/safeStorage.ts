import AsyncStorage from '@react-native-async-storage/async-storage';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Create a safe version of AsyncStorage that works in SSR
export const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (!isBrowser) return null;
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.error('Error reading from storage:', e);
      return null;
    }
  },
  
  setItem: async (key: string, value: string): Promise<boolean> => {
    if (!isBrowser) return false;
    try {
      await AsyncStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.error('Error writing to storage:', e);
      return false;
    }
  },
  
  removeItem: async (key: string): Promise<boolean> => {
    if (!isBrowser) return false;
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Error removing from storage:', e);
      return false;
    }
  }
};