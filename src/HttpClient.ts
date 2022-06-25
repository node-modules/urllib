import { EventEmitter } from 'events';
import { debuglog } from 'util';
import { Readable, isReadable } from 'stream';
import { pipeline } from 'stream/promises';
import { Blob } from 'buffer';
import { createReadStream } from 'fs';
import { basename } from 'path';
import {
  fetch, RequestInit, Headers, FormData,
} from 'undici';
import createUserAgent from 'default-user-agent';
import mime from 'mime-types';
import { RequestURL, RequestOptions } from './Request';
import { HttpClientResponseMeta, HttpClientResponse, ReadableStreamWithMeta } from './Response';
import { parseJSON } from './utils';

const debug = debuglog('urllib');

export type ClientOptions = {
  defaultArgs?: RequestOptions;
};

// https://github.com/octet-stream/form-data
class BlobFromStream {
  #stream;
  #type;
  constructor(stream: Readable, type: string) {
    this.#stream = stream;
    this.#type = type;
  }

  stream() {
    return this.#stream;
  }

  get type(): string {
    return this.#type;
  }

  get [Symbol.toStringTag]() {
    return 'Blob';
  }
}

class HttpClientRequestTimeoutError extends Error {
  constructor(timeout: number, options: ErrorOptions) {
    const message = `Request timeout for ${timeout} ms`;
    super(message, options);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

const HEADER_USER_AGENT = createUserAgent('node-urllib', '3.0.0');

function getFileName(stream: Readable) {
  const filePath: string = (stream as any).path;
  if (filePath) {
    return basename(filePath);
  }
  return '';
}

export class HttpClient extends EventEmitter {
  defaultArgs?: RequestOptions;

  constructor(clientOptions?: ClientOptions) {
    super();
    this.defaultArgs = clientOptions?.defaultArgs;
  }

  async request(url: RequestURL, options?: RequestOptions) {
    const requestUrl = typeof url === 'string' ? new URL(url) : url;
    const args = {
      ...this.defaultArgs,
      ...options,
      emitter: this,
    };
    const requestStartTime = Date.now();
    // keep urllib createCallbackResponse style
    const resHeaders: Record<string, string> = {};
    const res: HttpClientResponseMeta = {
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
    const method = (args.method ?? 'GET').toUpperCase();

    try {
      const headers = new Headers(args.headers ?? {});
      if (!headers.has('user-agent')) {
        // need to set user-agent
        headers.set('user-agent', HEADER_USER_AGENT);
      }
      if (args.dataType === 'json' && !headers.has('accept')) {
        headers.set('accept', 'application/json');
      }

      const requestOptions: RequestInit = {
        method,
        keepalive: true,
        signal: requestTimeoutController.signal,
      };
      if (args.followRedirect === false) {
        requestOptions.redirect = 'manual';
      }

      const isGETOrHEAD = requestOptions.method === 'GET' || requestOptions.method === 'HEAD';
      // alias to args.content
      if (args.stream && !args.content) {
        args.content = args.stream;
      }

      if (args.files) {
        if (isGETOrHEAD) {
          requestOptions.method = 'POST';
        }
        const formData = new FormData();
        const uploadFiles: [string, string | Readable | Buffer][] = [];
        if (Array.isArray(args.files)) {
          for (const [ index, file ] of args.files.entries()) {
            const field = index === 0 ? 'file' : `file${index}`;
            uploadFiles.push([ field, file ]);
          }
        } else if (args.files instanceof Readable || isReadable(args.files as any)) {
          uploadFiles.push([ 'file', args.files as Readable ]);
        } else if (typeof args.files === 'string' || Buffer.isBuffer(args.files)) {
          uploadFiles.push([ 'file', args.files ]);
        } else if (typeof args.files === 'object') {
          for (const field in args.files) {
            uploadFiles.push([ field, args.files[field] ]);
          }
        }
        // set normal fields first
        if (args.data) {
          for (const field in args.data) {
            formData.append(field, args.data[field]);
          }
        }
        for (const [ index, [ field, file ]] of uploadFiles.entries()) {
          if (typeof file === 'string') {
            // FIXME: support non-ascii filename
            // const fileName = encodeURIComponent(basename(file));
            // formData.append(field, await fileFromPath(file, `utf-8''${fileName}`, { type: mime.lookup(fileName) || '' }));
            const fileName = basename(file);
            const fileReader = createReadStream(file);
            formData.append(field, new BlobFromStream(fileReader, mime.lookup(fileName) || ''), fileName);
          } else if (Buffer.isBuffer(file)) {
            formData.append(field, new Blob([ file ]), `bufferfile${index}`);
          } else if (file instanceof Readable || isReadable(file as any)) {
            const fileName = getFileName(file) || `streamfile${index}`;
            formData.append(field, new BlobFromStream(file, mime.lookup(fileName) || ''), fileName);
          }
        }
        requestOptions.body = formData;
      } else if (args.content) {
        if (!isGETOrHEAD) {
          if (isReadable(args.content as Readable)) {
            // disable keepalive
            requestOptions.keepalive = false;
          }
          // handle content
          requestOptions.body = args.content;
          if (args.contentType) {
            headers.set('content-type', args.contentType);
          }
        }
      } else if (args.data) {
        const isStringOrBufferOrReadable = typeof args.data === 'string'
          || Buffer.isBuffer(args.data)
          || isReadable(args.data);
        if (isGETOrHEAD) {
          if (!isStringOrBufferOrReadable) {
            for (const field in args.data) {
              requestUrl.searchParams.append(field, args.data[field]);
            }
          }
        } else {
          if (isStringOrBufferOrReadable) {
            if (isReadable(args.data as Readable)) {
              // disable keepalive
              requestOptions.keepalive = false;
            }
            requestOptions.body = args.data;
          } else {
            if (args.contentType === 'json'
              || args.contentType === 'application/json'
              || headers.get('content-type')?.startsWith('application/json')) {
              requestOptions.body = JSON.stringify(args.data);
              if (!headers.has('content-type')) {
                headers.set('content-type', 'application/json');
              }
            } else {
              requestOptions.body = new URLSearchParams(args.data);
            }
          }
        }
      }

      debug('%s %s, headers: %j, timeout: %s', requestOptions.method, url, headers, requestTimeout);
      requestOptions.headers = headers;

      const response = await fetch(requestUrl, requestOptions);
      for (const [ name, value ] of response.headers) {
        res.headers[name] = value;
      }
      res.status = res.statusCode = response.status;
      res.statusMessage = response.statusText;
      if (response.redirected) {
        res.requestUrls.push(response.url);
      }
      if (res.headers['content-length']) {
        res.size = parseInt(res.headers['content-length']);
      }

      let data: any = null;
      let responseBodyStream: ReadableStreamWithMeta | undefined;
      if (args.streaming || args.dataType === 'stream') {
        const meta = {
          status: res.status,
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
        };
        if (typeof Readable.fromWeb === 'function') {
          responseBodyStream = Object.assign(Readable.fromWeb(response.body!), meta);
        } else {
          responseBodyStream = Object.assign(response.body!, meta);
        }
      } else if (args.writeStream) {
        await pipeline(response.body!, args.writeStream);
      } else if (args.dataType === 'text') {
        data = await response.text();
      } else if (args.dataType === 'json') {
        if (requestOptions.method === 'HEAD') {
          data = {};
        } else {
          data = await response.text();
          if (data.length === 0) {
            data = null;
          } else {
            data = parseJSON(data, args.fixJSONCtlChars);
          }
        }
      } else {
        // buffer
        data = Buffer.from(await response.arrayBuffer());
      }
      res.rt = res.timing.contentDownload = Date.now() - requestStartTime;

      const clientResponse: HttpClientResponse = {
        status: res.status,
        data,
        headers: res.headers,
        url: response.url,
        redirected: response.redirected,
        res: responseBodyStream ?? res,
      };
      return clientResponse;
    } catch (e: any) {
      let err = e;
      if (requestTimeoutController.signal.aborted) {
        err = new HttpClientRequestTimeoutError(requestTimeout, { cause: e });
      }
      err.res = res;
      err.status = res.status;
      err.headers = res.headers;
      // console.error(err);
      throw err;
    } finally {
      clearTimeout(requestTimerId);
    }
  }
}
