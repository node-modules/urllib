import { EventEmitter } from 'events';
import { debuglog } from 'util';
import { fetch, Request, RequestInit, Headers } from 'undici';
import createUserAgent from 'default-user-agent';
import { RequestURL, RequestOptions } from './Request';

const debug = debuglog('urllib');

export type ClientOptions = {
  defaultArgs?: RequestOptions;
};

class HttpClientRequestTimeoutError extends Error {
  constructor(timeout: number, cause: Error) {
    const message = `Request timeout for ${timeout} ms`;
    super(message, { cause });
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

const HEADER_USER_AGENT = createUserAgent('node-urllib', '3.0.0');

export class HttpClient extends EventEmitter {
  defaultArgs?: RequestOptions;

  constructor(clientOptions?: ClientOptions) {
    super();
    this.defaultArgs = clientOptions?.defaultArgs;
  }

  async request(url: RequestURL, options?: RequestOptions) {
    const args = {
      ...this.defaultArgs,
      ...options,
      emitter: this,
    };
    const requestStartTime = Date.now();
    // keep urllib createCallbackResponse style
    const resHeaders: Record<string, string> = {};
    const res = {
      status: -1,
      statusCode: -1,
      statusMessage: '',
      headers: resHeaders,
      size: 0,
      aborted: false,
      rt: 0,
      keepAliveSocket: true,
      requestUrls: [ url.toString() ],
      timing: {
        contentDownload: 0,
      },
      // remoteAddress: remoteAddress,
      // remotePort: remotePort,
      // socketHandledRequests: socketHandledRequests,
      // socketHandledResponses: socketHandledResponses,
    };

    let requestTimeout = 5000;
    if (args.timeout) {
      if (Array.isArray(args.timeout)) {
        requestTimeout = args.timeout[args.timeout.length - 1] ?? requestTimeout;
      } else {
        requestTimeout = args.timeout;
      }
    }
    const requestTimeoutController = new AbortController();
    const requestTimerId = setTimeout(() => requestTimeoutController.abort(), requestTimeout);

    try {
      const headers = new Headers(args.headers ?? {});
      // don't set user-agent
      const disableUserAgent = args.headers &&
        (args.headers['User-Agent'] === null || args.headers['user-agent'] === null);
      if (!disableUserAgent && !headers.has('user-agent')) {
        // need to set user-agent
        headers.set('user-agent', HEADER_USER_AGENT);
      }
      if (args.dataType === 'json' && !headers.has('accept')) {
        headers.set('accept', 'application/json');
      }

      const requestOptions: RequestInit = {
        method: args.method ?? 'GET',
        keepalive: true,
        headers,
        signal: requestTimeoutController.signal,
      };
      if (args.followRedirect === false) {
        requestOptions.redirect = 'manual';
      }

      debug('%s %j, headers: %j, timeout: %s', requestOptions.method, url, args.headers, requestTimeout);
      const request = new Request(url, requestOptions);

      const response = await fetch(request);
      let data: any;
      if (args.streaming || args.dataType === 'stream') {
        data = response.body;
      } else if (args.dataType === 'text') {
        data = await response.text();
      } else if (args.dataType === 'json') {
        data = await response.json();
      } else {
        // buffer
        data = Buffer.from(await response.arrayBuffer());
      }
      for (const [ name, value ] of response.headers) {
        res.headers[name] = value;
      }
      res.status = res.statusCode = response.status;
      res.statusMessage = response.statusText;
      res.rt = res.timing.contentDownload = Date.now() - requestStartTime;
      if (res.headers['content-length']) {
        res.size = parseInt(res.headers['content-length']);
      }
      if (response.redirected) {
        res.requestUrls.push(response.url);
      }
      return {
        status: res.status,
        data,
        headers: res.headers,
        url: response.url,
        redirected: response.redirected,
        res,
      };
    } catch (e: any) {
      let err = e;
      if (requestTimeoutController.signal.aborted) {
        err = new HttpClientRequestTimeoutError(requestTimeout, e as Error);
      }
      err.res = res;
      throw err;
    } finally {
      clearTimeout(requestTimerId);
    }
  }
}
