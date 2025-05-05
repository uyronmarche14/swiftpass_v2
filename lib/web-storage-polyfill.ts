/**
 * This file provides polyfills for web storage during server-side rendering (SSR).
 * When running in SSR mode, 'window' is not defined, so we need to provide dummy implementations
 * of localStorage and sessionStorage to prevent errors.
 */

// Detect if we're in a browser or SSR environment
const isBrowser =
  typeof window !== "undefined" &&
  typeof window.document !== "undefined" &&
  typeof window.localStorage !== "undefined";

// Create a mock storage implementation for SSR
class MemoryStorage {
  private store: { [key: string]: string } = {};

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }

  get length(): number {
    return Object.keys(this.store).length;
  }

  key(index: number): string | null {
    return Object.keys(this.store)[index] || null;
  }
}

// Create memory storage for SSR
const memoryStorage = new MemoryStorage();

// Export storage implementations with safeguards
export const localStorage = isBrowser ? window.localStorage : memoryStorage;

export const sessionStorage = isBrowser ? window.sessionStorage : memoryStorage;

// Export a flag indicating if we're in SSR mode for conditional logic elsewhere
export const isSSR = !isBrowser;
