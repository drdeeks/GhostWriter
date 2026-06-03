// Add global test setup
import '@testing-library/jest-dom';

// Polyfill for fetch
declare global {
  namespace NodeJS {
    interface Global {
      fetch: typeof fetch;
      Request: typeof Request;
      Response: typeof Response;
    }
  }
}

if (typeof global.fetch === 'undefined') {
  global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    // Simple mock implementation for basic fetch functionality
    return {
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => '',
    } as Response;
  };
}

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock;

// Mock IntersectionObserver
class IntersectionObserverMock implements IntersectionObserver {
  root: Element | null = null;
  rootMargin: string = '';
  thresholds: ReadonlyArray<number> = [];
  
  constructor(public callback: IntersectionObserverCallback, public options?: IntersectionObserverInit) {}
  
  observe(target: Element) {}
  unobserve(target: Element) {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}
global.IntersectionObserver = IntersectionObserverMock as any;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});