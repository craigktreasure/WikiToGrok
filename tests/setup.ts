/**
 * Test setup file
 * Mocks Chrome extension APIs for unit testing
 */

import { vi } from 'vitest';

// Mock chrome.storage API
const mockStorage: Record<string, unknown> = {};
const storageListeners: Array<(changes: Record<string, unknown>, areaName: string) => void> = [];

export const mockChrome = {
  storage: {
    sync: {
      get: vi.fn((keys: string | string[]) => {
        if (typeof keys === 'string') {
          return Promise.resolve({ [keys]: mockStorage[keys] });
        }
        const result: Record<string, unknown> = {};
        keys.forEach(key => {
          if (mockStorage[key] !== undefined) {
            result[key] = mockStorage[key];
          }
        });
        return Promise.resolve(result);
      }),
      set: vi.fn((items: Record<string, unknown>) => {
        const changes: Record<string, { oldValue?: unknown; newValue: unknown }> = {};
        Object.entries(items).forEach(([key, value]) => {
          changes[key] = { oldValue: mockStorage[key], newValue: value };
          mockStorage[key] = value;
        });
        storageListeners.forEach(listener => listener(changes, 'sync'));
        return Promise.resolve();
      }),
      remove: vi.fn((keys: string | string[]) => {
        const keysArray = typeof keys === 'string' ? [keys] : keys;
        keysArray.forEach(key => delete mockStorage[key]);
        return Promise.resolve();
      }),
      clear: vi.fn(() => {
        Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
        return Promise.resolve();
      }),
    },
    local: {
      get: vi.fn(() => Promise.resolve({})),
      set: vi.fn(() => Promise.resolve()),
      remove: vi.fn(() => Promise.resolve()),
    },
    onChanged: {
      addListener: vi.fn((listener: (changes: Record<string, unknown>, areaName: string) => void) => {
        storageListeners.push(listener);
      }),
      removeListener: vi.fn((listener: (changes: Record<string, unknown>, areaName: string) => void) => {
        const index = storageListeners.indexOf(listener);
        if (index > -1) {
          storageListeners.splice(index, 1);
        }
      }),
    },
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    getManifest: vi.fn(() => ({ version: '1.0.0' })),
    openOptionsPage: vi.fn(),
    getURL: vi.fn((path: string) => `chrome-extension://mock-id/${path}`),
  },
  tabs: {
    query: vi.fn(() => Promise.resolve([])),
    update: vi.fn(() => Promise.resolve()),
    create: vi.fn(() => Promise.resolve()),
  },
  notifications: {
    create: vi.fn(() => Promise.resolve()),
    clear: vi.fn(() => Promise.resolve()),
    onClicked: {
      addListener: vi.fn(),
    },
    onButtonClicked: {
      addListener: vi.fn(),
    },
  },
  declarativeNetRequest: {
    updateDynamicRules: vi.fn(() => Promise.resolve()),
    RuleActionType: {
      REDIRECT: 'redirect',
    },
    ResourceType: {
      MAIN_FRAME: 'main_frame',
    },
  },
};

// Helper to reset storage between tests
export function resetMockStorage(): void {
  Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
}

// Stub chrome globally
vi.stubGlobal('chrome', mockChrome);
