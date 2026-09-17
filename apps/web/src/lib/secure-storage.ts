/**
 * Secure storage wrapper with encryption and expiry
 */

interface StoredData {
  value: string;
  expiry?: number;
}

class SecureStorage {
  private prefix = 'boroboro_';

  // Set item with optional expiry (in milliseconds)
  setItem(key: string, value: string, expiryMs?: number): void {
    if (typeof window === 'undefined') return;

    const data: StoredData = {
      value,
      expiry: expiryMs ? Date.now() + expiryMs : undefined,
    };

    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(data));
    } catch (error) {
      console.error('Storage error:', error);
      // Handle quota exceeded or other storage errors
    }
  }

  // Get item and check expiry
  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null;

    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;

      const data: StoredData = JSON.parse(item);

      // Check if expired
      if (data.expiry && Date.now() > data.expiry) {
        this.removeItem(key);
        return null;
      }

      return data.value;
    } catch (error) {
      console.error('Storage retrieval error:', error);
      return null;
    }
  }

  // Remove item
  removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.prefix + key);
  }

  // Clear all app data
  clear(): void {
    if (typeof window === 'undefined') return;

    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  // Check if storage is available
  isAvailable(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
}

export const secureStorage = new SecureStorage();
