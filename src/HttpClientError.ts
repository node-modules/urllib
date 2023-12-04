import type { RawResponseWithMeta, SocketInfo } from './Response.js';
import type { IncomingHttpHeaders } from './IncomingHttpHeaders.js';

// need to support ES2021
interface ErrorOptions {
  cause?: Error;
}

export class HttpClientRequestError extends Error {
  status?: number;
  headers?: IncomingHttpHeaders;
  socket?: SocketInfo;
  res?: RawResponseWithMeta;
}

export class HttpClientRequestTimeoutError extends HttpClientRequestError {
  constructor(timeout: number, options: ErrorOptions) {
    const message = `Request timeout for ${timeout} ms`;
    super(message, options);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class HttpClientConnectTimeoutError extends HttpClientRequestError {
  code: string;

  constructor(message: string, code: string, options: ErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}
