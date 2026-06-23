import '@testing-library/jest-dom'

// Polyfill for ResizeObserver which is not present in JSDOM
class ResizeObserver {
  observe() { }
  unobserve() { }
  disconnect() { }
}

window.ResizeObserver = ResizeObserver

// Mock PointerEvent if needed (Radix UI)
if (!window.PointerEvent) {
  class PointerEvent extends MouseEvent {
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
    }
  }
  window.PointerEvent = PointerEvent as any;
}

import { vi } from 'vitest';
const mockDb = new Map<string, string>();
vi.mock('idb-keyval', () => ({
  get: vi.fn(async (key: string) => mockDb.get(key)),
  set: vi.fn(async (key: string, value: string) => {
    mockDb.set(key, value);
  }),
  del: vi.fn(async (key: string) => {
    mockDb.delete(key);
  }),
}));
