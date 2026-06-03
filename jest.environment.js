const { TestEnvironment } = require('jest-environment-jsdom');
const { TextEncoder, TextDecoder } = require('util');

class CustomTestEnvironment extends TestEnvironment {
  constructor(config, context) {
    super(config, context);
    this.global.TextEncoder = TextEncoder;
    this.global.TextDecoder = TextDecoder;
    this.global.Response = class Response {
      constructor(body, init) {
        this.body = body;
        this.status = init?.status || 200;
        this.headers = init?.headers || {};
      }
      
      json() {
        return Promise.resolve(typeof this.body === 'string' ? JSON.parse(this.body) : this.body);
      }
      
      text() {
        return Promise.resolve(typeof this.body === 'string' ? this.body : JSON.stringify(this.body));
      }
    };
    this.global.Request = class Request {};
    this.global.fetch = global.fetch || require('cross-fetch');
    this.global.TransformStream = class TransformStream {};
  }
}

module.exports = CustomTestEnvironment;