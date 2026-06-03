// Add TextEncoder polyfill for viem
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Response for NFT tests
class MockResponse {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.headers = new Map(Object.entries(init.headers || {}));
  }
  
  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
  }
  
  async text() {
    return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
  }
}

global.Response = MockResponse;

// Mock NextResponse for NFT tests
class MockNextResponse {
  static json(data, init = {}) {
    return new MockResponse(JSON.stringify(data), {
      status: init.status || 200,
      headers: init.headers || {}
    });
  }
}

global.NextResponse = MockNextResponse;

// Mock NextRequest for NFT tests
class MockNextRequest {
  constructor(url) {
    this.url = url;
    this.nextUrl = new URL(url);
  }
  
  get searchParams() {
    return this.nextUrl.searchParams;
  }
}

global.NextRequest = MockNextRequest;

// Mock fetch for NFT tests
global.fetch = jest.fn();