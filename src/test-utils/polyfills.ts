// Web API Polyfills for the jsdom test environment.
// jsdom doesn't implement the Fetch API, so bridge in Node's own
// spec-compliant implementation (undici) rather than a partial shim -
// Next.js's NextRequest/NextResponse extend the real Request/Response
// and need modern additions like Response.json() and Headers.getSetCookie().
//
// TextEncoder/TextDecoder must be set as globals BEFORE undici is
// required, since undici's own internals reference them at import time.
const { TextEncoder, TextDecoder } = require('util');

if (!global.TextEncoder) {
  global.TextEncoder = TextEncoder;
}

if (!global.TextDecoder) {
  global.TextDecoder = TextDecoder;
}

// undici also needs the web streams globals at import time.
const {
  ReadableStream: NodeReadableStream,
  WritableStream: NodeWritableStream,
  TransformStream: NodeTransformStream,
} = require('node:stream/web');

if (!global.ReadableStream) {
  global.ReadableStream = NodeReadableStream;
}
if (!global.WritableStream) {
  global.WritableStream = NodeWritableStream;
}
if (!global.TransformStream) {
  global.TransformStream = NodeTransformStream;
}

const { fetch, Headers, Request, Response } = require('undici');

if (!global.fetch) {
  global.fetch = fetch as any;
  global.Headers = Headers as any;
  global.Request = Request as any;
  global.Response = Response as any;
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