/**
 * Storage Service (React Native / AsyncStorage)
 *
 * Provides persistent storage using AsyncStorage.
 * API designed to be similar to localStorage for easy migration.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const STORAGE_KEYS = {
  KID_STATE: 'wof_kid_state',
  KID_SETTINGS: 'wof_kid_settings',
} as const;

/**
 * Get an item from storage
 */
export async function getItem<T>(key: string): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value === null) return null;
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn(`Storage getItem error for key "${key}":`, error);
    return null;
  }
}

/**
 * Set an item in storage
 */
export async function setItem<T>(key: string, value: T): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Storage setItem error for key "${key}":`, error);
    return false;
  }
}

/**
 * Remove an item from storage
 */
export async function removeItem(key: string): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Storage removeItem error for key "${key}":`, error);
    return false;
  }
}

/**
 * Clear all app storage
 */
export async function clearAll(): Promise<boolean> {
  try {
    const keys = Object.values(STORAGE_KEYS);
    await AsyncStorage.multiRemove(keys);
    return true;
  } catch (error) {
    console.warn('Storage clearAll error:', error);
    return false;
  }
}

/**
 * Hook-friendly wrapper for loading state on mount
 * Returns a loading/loaded/error status along with the data
 */
export async function loadState<T>(
  key: string,
  defaultValue: T
): Promise<T> {
  const saved = await getItem<T>(key);
  return saved ?? defaultValue;
}

/**
 * Save state (debounced version would be implemented in the component)
 */
export async function saveState<T>(key: string, state: T): Promise<void> {
  await setItem(key, state);
}
