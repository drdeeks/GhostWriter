// Mock Next.js server types
import { RequestCookies, ResponseCookies } from 'next/dist/compiled/@edge-runtime/cookies';
import './polyfills';

class HeadersMock implements Headers {
  private _headers: Map<string, string>;

  constructor(init?: HeadersInit) {
    this._headers = new Map();
    if (init) {
      if (Array.isArray(init)) {
        init.forEach(([key, value]) => this._headers.set(key, value));
      } else if (init instanceof Headers) {
        init.forEach((value, key) => this._headers.set(key, value));
      } else {
        Object.entries(init).forEach(([key, value]) => this._headers.set(key, value));
      }
    }
  }

  append(name: string, value: string): void {
    const existing = this._headers.get(name);
    this._headers.set(name, existing ? `${existing}, ${value}` : value);
  }

  delete(name: string): void {
    this._headers.delete(name);
  }

  get(name: string): string | null {
    return this._headers.get(name) || null;
  }

  has(name: string): boolean {
    return this._headers.has(name);
  }

  set(name: string, value: string): void {
    this._headers.set(name, value);
  }

  forEach(callback: (value: string, key: string, parent: Headers) => void): void {
    this._headers.forEach((value, key) => callback(value, key, this));
  }

  getSetCookie(): string[] {
    return this._headers.get('set-cookie')?.split(', ') || [];
  }

  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this._headers.entries();
  }
}

class RequestCookiesMock implements RequestCookies {
  private _headers: Headers;

  constructor(headers: Headers) {
    this._headers = headers;
  }

  get(name: string): { name: string; value: string } | undefined {
    const cookieHeader = this._headers.get('cookie');
    if (!cookieHeader) return undefined;
    
    const cookies = cookieHeader.split(';').map(c => c.trim());
    for (const cookie of cookies) {
      const [cookieName, cookieValue] = cookie.split('=');
      if (cookieName === name) {
        return { name: cookieName, value: cookieValue || '' };
      }
    }
    return undefined;
  }

  getAll(): { name: string; value: string }[] {
    const cookieHeader = this._headers.get('cookie');
    if (!cookieHeader) return [];
    
    return cookieHeader.split(';').map(c => {
      const [name, value] = c.trim().split('=');
      return { name, value: value || '' };
    });
  }

  has(name: string): boolean {
    return this.get(name) !== undefined;
  }
}

class ResponseCookiesMock implements ResponseCookies {
  private _headers: Headers;

  constructor(headers: Headers) {
    this._headers = headers;
  }

  delete(name: string): boolean {
    const cookies = this.getAll();
    const filtered = cookies.filter(cookie => cookie.name !== name);
    this._headers.set('set-cookie', filtered.map(c => `${c.name}=${c.value}`).join(', '));
    return true;
  }

  get(name: string): { name: string; value: string } | undefined {
    const cookies = this.getAll();
    return cookies.find(cookie => cookie.name === name);
  }

  getAll(): { name: string; value: string; options?: any }[] {
    const setCookieHeader = this._headers.get('set-cookie');
    if (!setCookieHeader) return [];
    
    return setCookieHeader.split(', ').map(cookie => {
      const [nameValue, ...options] = cookie.split(';');
      const [name, value] = nameValue.split('=');
      return { name, value: value || '', options };
    });
  }

  has(name: string): boolean {
    return this.get(name) !== undefined;
  }

  set(name: string, value: string, options?: any): void {
    const existing = this.getAll();
    const updated = existing.filter(cookie => cookie.name !== name);
    updated.push({ name, value, options });
    this._headers.set('set-cookie', updated.map(c => `${c.name}=${c.value}${c.options ? `; ${c.options}` : ''}`).join(', '));
  }
}

const INTERNALS = Symbol('NextRequest');
const RESPONSE_INTERNALS = Symbol('NextResponse');
const NEXT_URL_INTERNALS = Symbol('NextURL');

interface NextRequestInit extends RequestInit {
  geo?: RequestGeo;
  ip?: string;
  page?: string;
}

interface RequestGeo {
  city?: string;
  country?: string;
  region?: string;
  latitude?: string;
  longitude?: string;
}

class NextURLMock {
  private [NEXT_URL_INTERNALS]: {
    url: URL;
    basePath: string;
    buildId?: string;
    locale: string;
    defaultLocale?: string;
    domainLocale?: any;
  };

  constructor(input: string | URL, base?: string | URL) {
    const url = new URL(typeof input === 'string' ? input : input.toString(), base?.toString());
    this[NEXT_URL_INTERNALS] = {
      url,
      basePath: '',
      locale: '',
    };
  }

  get buildId(): string | undefined {
    return this[NEXT_URL_INTERNALS].buildId;
  }

  set buildId(buildId: string | undefined) {
    this[NEXT_URL_INTERNALS].buildId = buildId;
  }

  get locale(): string {
    return this[NEXT_URL_INTERNALS].locale;
  }

  set locale(locale: string) {
    this[NEXT_URL_INTERNALS].locale = locale;
  }

  get defaultLocale(): string | undefined {
    return this[NEXT_URL_INTERNALS].defaultLocale;
  }

  get domainLocale(): any {
    return this[NEXT_URL_INTERNALS].domainLocale;
  }

  get searchParams(): URLSearchParams {
    return this[NEXT_URL_INTERNALS].url.searchParams;
  }

  get basePath(): string {
    return this[NEXT_URL_INTERNALS].basePath;
  }

  set basePath(value: string) {
    this[NEXT_URL_INTERNALS].basePath = value;
  }

  get hash(): string {
    return this[NEXT_URL_INTERNALS].url.hash;
  }

  set hash(value: string) {
    this[NEXT_URL_INTERNALS].url.hash = value;
  }

  get host(): string {
    return this[NEXT_URL_INTERNALS].url.host;
  }

  set host(value: string) {
    this[NEXT_URL_INTERNALS].url.host = value;
  }

  get hostname(): string {
    return this[NEXT_URL_INTERNALS].url.hostname;
  }

  set hostname(value: string) {
    this[NEXT_URL_INTERNALS].url.hostname = value;
  }

  get href(): string {
    return this[NEXT_URL_INTERNALS].url.href;
  }

  set href(url: string) {
    this[NEXT_URL_INTERNALS].url.href = url;
  }

  get origin(): string {
    return this[NEXT_URL_INTERNALS].url.origin;
  }

  get pathname(): string {
    return this[NEXT_URL_INTERNALS].url.pathname;
  }

  set pathname(value: string) {
    this[NEXT_URL_INTERNALS].url.pathname = value;
  }

  get port(): string {
    return this[NEXT_URL_INTERNALS].url.port;
  }

  set port(value: string) {
    this[NEXT_URL_INTERNALS].url.port = value;
  }

  get protocol(): string {
    return this[NEXT_URL_INTERNALS].url.protocol;
  }

  set protocol(value: string) {
    this[NEXT_URL_INTERNALS].url.protocol = value;
  }

  get search(): string {
    return this[NEXT_URL_INTERNALS].url.search;
  }

  set search(value: string) {
    this[NEXT_URL_INTERNALS].url.search = value;
  }

  get password(): string {
    return this[NEXT_URL_INTERNALS].url.password;
  }

  set password(value: string) {
    this[NEXT_URL_INTERNALS].url.password = value;
  }

  get username(): string {
    return this[NEXT_URL_INTERNALS].url.username;
  }

  set username(value: string) {
    this[NEXT_URL_INTERNALS].url.username = value;
  }

  analyze(): void {}
  formatPathname(): string { return this.pathname; }
  formatSearch(): string { return this.search; }
  clone(): NextURLMock { return new NextURLMock(this.href); }
  toString(): string { return this.href; }
  toJSON(): string { return this.href; }
}

class NextRequestMock extends Request {
  [INTERNALS]: {
    cookies: RequestCookies;
    geo?: RequestGeo;
    ip?: string;
    url: NextURLMock;
  };

  constructor(input: RequestInfo | URL, init?: NextRequestInit) {
    const headers = new HeadersMock(init?.headers);
    super(typeof input === 'string' ? input : input.toString(), { ...init, headers });
    const url = new NextURLMock(typeof input === 'string' ? input : input.toString());
    this[INTERNALS] = {
      cookies: new RequestCookiesMock(headers),
      geo: init?.geo,
      ip: init?.ip,
      url,
    };
  }

  get cookies(): RequestCookies {
    return this[INTERNALS].cookies;
  }

  get nextUrl(): NextURLMock {
    return this[INTERNALS].url;
  }

  get geo(): RequestGeo {
    return this[INTERNALS].geo || {};
  }

  get ip(): string | undefined {
    return this[INTERNALS].ip;
  }

  get page(): void {
    return undefined;
  }

  get ua(): void {
    return undefined;
  }

  get url(): string {
    return this.nextUrl.toString();
  }

  // Web Request properties
  get destination(): RequestDestination {
    return 'document';
  }

  get referrerPolicy(): ReferrerPolicy {
    return '';
  }

  get bodyUsed(): boolean {
    return false;
  }

  async bytes(): Promise<Uint8Array> {
    const buffer = await this.arrayBuffer();
    return new Uint8Array(buffer);
  }

  // Web Request methods
  async arrayBuffer(): Promise<ArrayBuffer> {
    if (this.body) {
      const reader = this.body.getReader();
      const chunks: Uint8Array[] = [];
      let length = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          length += value.length;
        }
      }
      const buffer = new ArrayBuffer(length);
      const view = new Uint8Array(buffer);
      let offset = 0;
      for (const chunk of chunks) {
        view.set(chunk, offset);
        offset += chunk.length;
      }
      return buffer;
    }
    return new ArrayBuffer(0);
  }

  async blob(): Promise<Blob> {
    const buffer = await this.arrayBuffer();
    return new Blob([buffer]);
  }

  async formData(): Promise<FormData> {
    const text = await this.text();
    const formData = new FormData();
    if (text) formData.append('data', text);
    return formData;
  }

  async json(): Promise<any> {
    const text = await this.text();
    return text ? JSON.parse(text) : {};
  }

  async text(): Promise<string> {
    if (this.body) {
      const buffer = await this.arrayBuffer();
      return new TextDecoder().decode(buffer);
    }
    return '';
  }

  clone(): NextRequestMock {
    return new NextRequestMock(this.url, {
      method: this.method,
      headers: this.headers,
      body: this.body,
      geo: this.geo,
      ip: this.ip,
    });
  }
}

class NextResponseMock extends Response {
  [RESPONSE_INTERNALS]: {
    cookies: ResponseCookies;
    url?: NextURLMock;
  };

  constructor(body?: BodyInit | null, init?: ResponseInit) {
    const headers = new HeadersMock(init?.headers);
    super(body, { ...init, headers });
    this[RESPONSE_INTERNALS] = {
      cookies: new ResponseCookiesMock(headers),
    };
  }

  static json<JsonBody>(body: JsonBody, init?: ResponseInit): NextResponseMock {
    const response = new NextResponseMock(JSON.stringify(body), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
    return response;
  }

  static redirect(url: string | URL, init?: number | ResponseInit): NextResponseMock {
    const status = typeof init === 'number' ? init : init?.status || 307;
    const response = new NextResponseMock(null, { status });
    response.headers.set('Location', typeof url === 'string' ? url : url.toString());
    return response;
  }

  static rewrite(destination: string | URL, init?: ResponseInit): NextResponseMock {
    return new NextResponseMock(null, { status: 200, ...init });
  }

  static next(init?: ResponseInit): NextResponseMock {
    return new NextResponseMock(null, { status: 200, ...init });
  }

  get cookies(): ResponseCookies {
    return this[RESPONSE_INTERNALS].cookies;
  }

  // Web Response properties
  get ok(): boolean {
    return this.status >= 200 && this.status < 300;
  }

  get redirected(): boolean {
    return [301, 302, 303, 307, 308].includes(this.status);
  }

  get statusText(): string {
    return this.status === 200 ? 'OK' : '';
  }

  get type(): ResponseType {
    return 'basic';
  }

  get url(): string {
    return this[RESPONSE_INTERNALS].url?.toString() || '';
  }

  get bodyUsed(): boolean {
    return false;
  }

  // Web Response methods
  async arrayBuffer(): Promise<ArrayBuffer> {
    if (this.body) {
      const reader = this.body.getReader();
      const chunks: Uint8Array[] = [];
      let length = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          length += value.length;
        }
      }
      const buffer = new ArrayBuffer(length);
      const view = new Uint8Array(buffer);
      let offset = 0;
      for (const chunk of chunks) {
        view.set(chunk, offset);
        offset += chunk.length;
      }
      return buffer;
    }
    return new ArrayBuffer(0);
  }

  async blob(): Promise<Blob> {
    const buffer = await this.arrayBuffer();
    return new Blob([buffer]);
  }

  async formData(): Promise<FormData> {
    const text = await this.text();
    const formData = new FormData();
    if (text) formData.append('data', text);
    return formData;
  }

  async json(): Promise<any> {
    const text = await this.text();
    return text ? JSON.parse(text) : {};
  }

  async text(): Promise<string> {
    if (this.body) {
      const buffer = await this.arrayBuffer();
      return new TextDecoder().decode(buffer);
    }
    return '';
  }

  clone(): NextResponseMock {
    return new NextResponseMock(this.body, {
      status: this.status,
      statusText: this.statusText,
      headers: this.headers,
    });
  }
}

// Export the mocks
const NextResponseMockInstance = {
  json: NextResponseMock.json.bind(NextResponseMock),
  redirect: NextResponseMock.redirect.bind(NextResponseMock),
  rewrite: NextResponseMock.rewrite.bind(NextResponseMock),
  next: NextResponseMock.next.bind(NextResponseMock),
};

export { NextRequestMock as NextRequest, NextResponseMock as NextResponse, NextResponseMockInstance, HeadersMock as Headers };
export type { NextRequest } from 'next/server';
export type { NextResponse } from 'next/server';