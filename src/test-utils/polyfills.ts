// Web API Polyfills for Node.js environment
import { TextEncoder, TextDecoder } from 'util';
import nodeFetch, { Headers, Request, Response } from 'node-fetch';

// Polyfill global objects
if (!global.TextEncoder) {
  global.TextEncoder = TextEncoder;
}

if (!global.TextDecoder) {
  global.TextDecoder = TextDecoder;
}

if (!global.fetch) {
  global.fetch = nodeFetch;
  global.Headers = Headers;
  global.Request = Request;
  global.Response = Response;
}

// Stream APIs
if (!global.TransformStream) {
  class TransformStreamImpl {
    readable: ReadableStream;
    writable: WritableStream;

    constructor() {
      const channel = new MessageChannel();
      this.readable = new ReadableStream({
        start: (controller) => {
          channel.port1.onmessage = (event) => controller.enqueue(event.data);
        },
        cancel: () => channel.port1.close()
      });
      this.writable = new WritableStream({
        write: (chunk) => channel.port2.postMessage(chunk),
        close: () => channel.port2.close(),
        abort: (reason) => channel.port2.close()
      });
    }
  }
  global.TransformStream = TransformStreamImpl as any;
}

if (!global.ReadableStream) {
  class ReadableStreamImpl {
    private _controller: ReadableStreamDefaultController | null = null;
    private _reader: ReadableStreamDefaultReader | null = null;

    constructor(underlyingSource: UnderlyingSource = {}) {
      if (underlyingSource.start) {
        underlyingSource.start({
          enqueue: (chunk: any) => this._controller?.enqueue(chunk),
          close: () => this._controller?.close(),
          error: (e: any) => this._controller?.error(e)
        } as ReadableStreamDefaultController);
      }
    }
    
    getReader(): ReadableStreamDefaultReader {
      this._reader = {
        read: () => Promise.resolve({ value: undefined, done: true }),
        cancel: () => Promise.resolve(),
        releaseLock: () => {},
        closed: Promise.resolve()
      };
      return this._reader;
    }
  }
  global.ReadableStream = ReadableStreamImpl as any;
}

if (!global.WritableStream) {
  class WritableStreamImpl {
    constructor(underlyingSink: UnderlyingSink = {}) {
      if (underlyingSink.start) {
        underlyingSink.start({
          error: (e: any) => {},
          write: (chunk: any) => Promise.resolve(),
          close: () => Promise.resolve(),
          abort: (reason: any) => Promise.resolve()
        } as WritableStreamDefaultController);
      }
    }
  }
  global.WritableStream = WritableStreamImpl as any;
}

// Required for Next.js
if (!global.RequestCookies) {
  global.RequestCookies = class {
    private _headers: Headers;
    
    constructor(headers: Headers) {
      this._headers = headers;
    }
    
    get(name: string) {
      const value = this._headers.get(`cookie`)?.split('; ')
        .find(c => c.startsWith(`${name}=`))?.split('=')[1];
      return value ? { name, value } : undefined;
    }
    
    getAll() {
      return this._headers.get(`cookie`)?.split('; ')
        .map(c => {
          const [name, value] = c.split('=');
          return { name, value };
        }) || [];
    }
    
    has(name: string) {
      return this._headers.get(`cookie`)?.includes(`${name}=`) || false;
    }
  };
}

if (!global.ResponseCookies) {
  global.ResponseCookies = class {
    private _headers: Headers;
    
    constructor(headers: Headers) {
      this._headers = headers;
    }
    
    set(name: string, value: string, options: any = {}) {
      let cookie = `${name}=${value}`;
      if (options.maxAge) cookie += `; Max-Age=${options.maxAge}`;
      if (options.path) cookie += `; Path=${options.path}`;
      if (options.domain) cookie += `; Domain=${options.domain}`;
      if (options.secure) cookie += `; Secure`;
      if (options.httpOnly) cookie += `; HttpOnly`;
      if (options.sameSite) cookie += `; SameSite=${options.sameSite}`;
      
      this._headers.append('Set-Cookie', cookie);
    }
    
    delete(name: string) {
      this.set(name, '', { maxAge: 0 });
    }
  };
}