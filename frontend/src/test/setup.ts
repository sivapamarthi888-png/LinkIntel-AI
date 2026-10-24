import '@testing-library/jest-dom/vitest'

// jsdom lacks ResizeObserver, which Recharts needs
class ResizeObserverPolyfill {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = (global as any).ResizeObserver || (ResizeObserverPolyfill as any)

