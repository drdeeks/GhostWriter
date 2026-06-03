// Mock global Request object
class MockRequest {
  constructor(body) {
    this.bodyUsed = false;
    this._body = body;
  }
  
  async json() {
    this.bodyUsed = true;
    if (typeof this._body === 'string') {
      try {
        return JSON.parse(this._body);
      } catch {
        throw new Error(`Failed to parse JSON: ${this._body}`);
      }
    }
    return this._body;
  }
  
  async text() {
    this.bodyUsed = true;
    return typeof this._body === 'string' ? this._body : JSON.stringify(this._body);
  }
}

// Mock NextRequest object
global.NextRequest = class NextRequest {
  constructor(url, options = {}) {
    this.url = url;
    this.nextUrl = new URL(url);
    this.method = options.method || 'GET';
    this.headers = new Map(Object.entries(options.headers || {}));
    this._body = options.body;
  }
  
  get searchParams() {
    return this.nextUrl.searchParams;
  }
  
  async json() {
    if (typeof this._body === 'string') {
      try {
        return JSON.parse(this._body);
      } catch {
        throw new Error(`Failed to parse JSON: ${this._body}`);
      }
    }
    return this._body;
  }
};

// Mock Response object
global.Response = class Response {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.headers = new Map(Object.entries(init.headers || {}));
  }
  
  async json() {
    if (typeof this.body === 'string') {
      return JSON.parse(this.body);
    }
    return this.body;
  }
  
  async text() {
    return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
  }
};

// Mock fetch
global.fetch = jest.fn();