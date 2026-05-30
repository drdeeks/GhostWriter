require('@testing-library/jest-dom');
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill Request/Response for Next.js API routes in Jest
if (typeof globalThis.Request === 'undefined') {
  globalThis.Request = class Request {
    constructor(urlOrInit, init = {}) {
      this.url = typeof urlOrInit === 'string' ? urlOrInit : '';
      this.method = init.method || (typeof urlOrInit === 'object' && urlOrInit.method) || 'GET';
      this.headers = init.headers || (typeof urlOrInit === 'object' && urlOrInit.headers) || {};
      this._body = init.body || (typeof urlOrInit === 'object' && urlOrInit.body) || null;
    }
    async json() { return typeof this._body === 'string' ? JSON.parse(this._body) : this._body; }
    async text() { return this._body || ''; }
  };
}
if (typeof globalThis.Response === 'undefined') {
  const _Response = class Response {
    constructor(body, init = {}) {
      this._body = body;
      this.status = init.status || 200;
      this.statusText = init.statusText || 'OK';
      this.headers = init.headers || {};
    }
    async json() { return typeof this._body === 'string' ? JSON.parse(this._body) : this._body; }
    async text() { return typeof this._body === 'string' ? this._body : JSON.stringify(this._body); }
    static json(data, init = {}) {
      const body = JSON.stringify(data);
      const res = new _Response(body, { ...init, headers: { 'Content-Type': 'application/json', ...init.headers } });
      return res;
    }
  };
  globalThis.Response = _Response;
}

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
}));

// Mock viem/wagmi
jest.mock('wagmi', () => ({
  useAccount: () => ({ address: '0x123' }),
  useReadContract: () => ({ data: [], isLoading: false, error: null }),
  useWriteContract: () => ({ writeContract: jest.fn(), isLoading: false }),
  useWaitForTransactionReceipt: () => ({ isLoading: false }),
}));

// Mock window.ethereum
window.ethereum = {
  request: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
};
