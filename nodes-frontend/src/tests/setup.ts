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
