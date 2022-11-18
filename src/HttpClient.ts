import { EventEmitter } from 'events';
import { LookupFunction } from 'net';
import { debuglog } from 'util';
import {
  createGunzip,
  createBrotliDecompress,
  gunzipSync,
  brotliDecompressSync,
} from 'zlib';
import { Blob } from 'buffer';
import { Readable, pipeline } from 'stream';
import stream from 'stream';
import { basename } from 'path';
import { createReadStream } from 'fs';
import { IncomingHttpHeaders } from 'http';
import { format as urlFormat } from 'url';
import { performance } from 'perf_hooks';
import {
  FormData as FormDataNative,
  request as undiciRequest,
  Dispatcher,
} from 'undici';
import { FormData as FormDataNode } from 'formdata-node';
import { FormDataEncoder } from 'form-data-encoder';
import createUserAgent from 'default-user-agent';
import mime from 'mime-types';
import pump from 'pump';
import { HttpAgent, CheckAddressFunction } from './HttpAgent';
import { RequestURL, RequestOptions, HttpMethod } from './Request';
import { HttpClientResponseMeta, HttpClientResponse, ReadableWithMeta, BaseResponseMeta, SocketInfo } from './Response';
import { parseJSON, sleep, digestAuthHeader, globalId, performanceTime } from './utils';
import symbols from './symbols';
import { initDiagnosticsChannel } from './diagnosticsChannel';

const PROTO_RE = /^https?:\/\//i;
const FormData = FormDataNative ?? FormDataNode;
// impl isReadable on Node.js 14
const isReadable = stream.isReadable ?? function isReadable(stream: any) {
  return stream && typeof stream.read === 'function';
};
// impl promise pipeline on Node.js 14
const pipelinePromise = stream.promises?.pipeline ?? function pipeline(...args: any[]) {
  return new Promise<void>((resolve, reject) => {
    pump(...args, (err?: Error) => {
      if (err) return reject(err);
      resolve();
    });
  });
};

function noop() {
  // noop
}

const debug = debuglog('urllib:HttpClient');

export type ClientOptions = {
  defaultArgs?: RequestOptions;
  /**
   * Custom DNS lookup function, default is `dns.lookup`.
   */
  lookup?: LookupFunction;
  /**
    * check request address to protect from SSRF and similar attacks.
    * It receive two arguments(ip and family) and should return true or false to identified the address is legal or not.
    * It rely on lookup and have the same version requirement.
    */
  checkAddress?: CheckAddressFunction;
  connect?: {
    key?: string | Buffer;
    /**
    * A string or Buffer containing the certificate key of the client in PEM format.
    * Notes: This is necessary only if using the client certificate authentication
    */
    cert?: string | Buffer;
    /**
    * If true, the server certificate is verified against the list of supplied CAs.
    * An 'error' event is emitted if verification fails.Default: true.
    */
    rejectUnauthorized?: boolean;

    /**
     * sockePath string | null (optional) - Default: null - An IPC endpoint, either Unix domain socket or Windows named pipe
     */
    socketPath?: string | null;
  },
};

type UndiciRquestOptions = { dispatcher?: Dispatcher } & Omit<Dispatcher.RequestOptions, 'origin' | 'path' | 'method'> & Partial<Pick<Dispatcher.RequestOptions, 'method'>>;

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

export const HEADER_USER_AGENT = createUserAgent('node-urllib', '3.0.0');

function getFileName(stream: Readable) {
  const filePath: string = (stream as any).path;
  if (filePath) {
    return basename(filePath);
  }
  return '';
}

function defaultIsRetry(response: HttpClientResponse) {
  return response.status >= 500;
}

type RequestContext = {
  retries: number;
};

export class HttpClient extends EventEmitter {
  #defaultArgs?: RequestOptions;
  #dispatcher?: Dispatcher;

  constructor(clientOptions?: ClientOptions) {
    super();
    this.#defaultArgs = clientOptions?.defaultArgs;
    if (clientOptions?.lookup || clientOptions?.checkAddress || clientOptions?.connect) {
      this.#dispatcher = new HttpAgent({
        lookup: clientOptions.lookup,
        checkAddress: clientOptions.checkAddress,
        connect: clientOptions.connect,
      });
    }
    initDiagnosticsChannel();
  }

  async request(url: RequestURL, options?: RequestOptions) {
    return await this.#requestInternal(url, options);
  }

  async #requestInternal(url: RequestURL, options?: RequestOptions, requestContext?: RequestContext): Promise<HttpClientResponse> {
    const requestId = globalId('HttpClientRequest');
    let requestUrl: URL;
    if (typeof url === 'string') {
      if (!PROTO_RE.test(url)) {
        // Support `request('www.server.com')`
        url = 'http://' + url;
      }
      requestUrl = new URL(url);
    } else {
      if (!url.searchParams) {
        // url maybe url.parse(url) object in urllib2
        requestUrl = new URL(urlFormat(url));
      } else {
        requestUrl = url;
      }
    }

    const method = (options?.method ?? 'GET').toUpperCase() as HttpMethod;
    const orginalHeaders = options?.headers;
    const headers: IncomingHttpHeaders = {};
    const args = {
      retry: 0,
      ...this.#defaultArgs,
      ...options,
      // keep method and headers exists on args for request event handler to easy use
      method,
      headers,
    };
    requestContext = {
      retries: 0,
      ...requestContext,
    };
    const requestStartTime = performance.now();

    // https://developer.chrome.com/docs/devtools/network/reference/?utm_source=devtools#timing-explanation
    const timing = {
      // socket assigned
      queuing: 0,
      // dns lookup time
      // dnslookup: 0,
      // socket connected
      connected: 0,
      // request headers sent
      requestHeadersSent: 0,
      // request sent, including headers and body
      requestSent: 0,
      // Time to first byte (TTFB), the response headers have been received
      waiting: 0,
      // the response body and trailers have been received
      contentDownload: 0,
    };
    const orginalOpaque = args.opaque;
    // using opaque to diagnostics channel, binding request and socket
    const internalOpaque = {
      [symbols.kRequestId]: requestId,
      [symbols.kRequestStartTime]: requestStartTime,
      [symbols.kEnableRequestTiming]: !!args.timing,
      [symbols.kRequestTiming]: timing,
      [symbols.kRequestOrginalOpaque]: orginalOpaque,
    };
    const reqMeta = {
      requestId,
      url: requestUrl.href,
      args,
      ctx: args.ctx,
      retries: requestContext.retries,
    };
    const socketInfo = {
      id: 0,
      localAddress: '',
      localPort: 0,
      remoteAddress: '',
      remotePort: 0,
      remoteFamily: '',
      bytesWritten: 0,
      bytesRead: 0,
      handledRequests: 0,
      handledResponses: 0,
    };
    // keep urllib createCallbackResponse style
    const resHeaders: IncomingHttpHeaders = {};
    const res: HttpClientResponseMeta = {
      status: -1,
      statusCode: -1,
      headers: resHeaders,
      size: 0,
      aborted: false,
      rt: 0,
      keepAliveSocket: true,
      requestUrls: [],
      timing,
      socket: socketInfo,
    };

    let headersTimeout = 5000;
    let bodyTimeout = 5000;
    if (args.timeout) {
      if (Array.isArray(args.timeout)) {
        headersTimeout = args.timeout[0] ?? headersTimeout;
        bodyTimeout = args.timeout[1] ?? bodyTimeout;
      } else {
        headersTimeout = bodyTimeout = args.timeout;
      }
    }
    if (orginalHeaders) {
      // convert headers to lower-case
      for (const name in orginalHeaders) {
        headers[name.toLowerCase()] = orginalHeaders[name];
      }
    }
    // hidden user-agent
    const hiddenUserAgent = 'user-agent' in headers && !headers['user-agent'];
    if (hiddenUserAgent) {
      delete headers['user-agent'];
    } else if (!headers['user-agent']) {
      // need to set user-agent
      headers['user-agent'] = HEADER_USER_AGENT;
    }
    // Alias to dataType = 'stream'
    if (args.streaming || args.customResponse) {
      args.dataType = 'stream';
    }
    if (args.dataType === 'json' && !headers.accept) {
      headers.accept = 'application/json';
    }
    // gzip alias to compressed
    if (args.gzip && args.compressed !== false) {
      args.compressed = true;
    }
    if (args.compressed && !headers['accept-encoding']) {
      headers['accept-encoding'] = 'gzip, br';
    }
    if (requestContext.retries > 0) {
      headers['x-urllib-retry'] = `${requestContext.retries}/${args.retry}`;
    }
    if (args.auth && !headers.authorization) {
      headers.authorization = `Basic ${Buffer.from(args.auth).toString('base64')}`;
    }

    try {
      const requestOptions: UndiciRquestOptions = {
        method,
        keepalive: true,
        maxRedirections: args.maxRedirects ?? 10,
        headersTimeout,
        bodyTimeout,
        opaque: internalOpaque,
        dispatcher: args.dispatcher ?? this.#dispatcher,
      };
      if (args.followRedirect === false) {
        requestOptions.maxRedirections = 0;
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
            const fileReadable = createReadStream(file);
            formData.append(field, new BlobFromStream(fileReadable, mime.lookup(fileName) || ''), fileName);
          } else if (Buffer.isBuffer(file)) {
            formData.append(field, new Blob([ file ]), `bufferfile${index}`);
          } else if (file instanceof Readable || isReadable(file as any)) {
            const fileName = getFileName(file) || `streamfile${index}`;
            formData.append(field, new BlobFromStream(file, mime.lookup(fileName) || ''), fileName);
          }
        }

        if (FormDataNative) {
          requestOptions.body = formData;
        } else {
          // Node.js 14 does not support spec-compliant FormData
          // https://github.com/octet-stream/form-data#usage
          const encoder = new FormDataEncoder(formData as any);
          Object.assign(headers, encoder.headers);
          // fix "Content-Length":"NaN"
          delete headers['Content-Length'];
          requestOptions.body = Readable.from(encoder);
        }
      } else if (args.content) {
        if (!isGETOrHEAD) {
          // handle content
          requestOptions.body = args.content;
          if (args.contentType) {
            headers['content-type'] = args.contentType;
          } else if (typeof args.content === 'string' && !headers['content-type']) {
            headers['content-type'] = 'text/plain;charset=UTF-8';
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
            requestOptions.body = args.data;
          } else {
            if (args.contentType === 'json'
              || args.contentType === 'application/json'
              || headers['content-type']?.startsWith('application/json')) {
              requestOptions.body = JSON.stringify(args.data);
              if (!headers['content-type']) {
                headers['content-type'] = 'application/json';
              }
            } else {
              headers['content-type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
              requestOptions.body = new URLSearchParams(args.data).toString();
            }
          }
        }
      }

      debug('Request#%d %s %s, headers: %j, headersTimeout: %s, bodyTimeout: %s',
        requestId, requestOptions.method, requestUrl.href, headers, headersTimeout, bodyTimeout);
      requestOptions.headers = headers;
      if (this.listenerCount('request') > 0) {
        this.emit('request', reqMeta);
      }

      let response = await undiciRequest(requestUrl, requestOptions);
      if (response.statusCode === 401 && response.headers['www-authenticate'] &&
        !requestOptions.headers.authorization && args.digestAuth) {
        // handle digest auth
        const authenticateHeaders = response.headers['www-authenticate'];
        const authenticate = Array.isArray(authenticateHeaders)
          ? authenticateHeaders.find(authHeader => authHeader.startsWith('Digest '))
          : authenticateHeaders;
        if (authenticate && authenticate.startsWith('Digest ')) {
          debug('Request#%d %s: got digest auth header WWW-Authenticate: %s', requestId, requestUrl.href, authenticate);
          requestOptions.headers.authorization = digestAuthHeader(requestOptions.method!,
            `${requestUrl.pathname}${requestUrl.search}`, authenticate, args.digestAuth);
          debug('Request#%d %s: auth with digest header: %s', requestId, url, requestOptions.headers.authorization);
          if (response.headers['set-cookie']) {
            // FIXME: merge exists cookie header
            requestOptions.headers.cookie = response.headers['set-cookie'].join(';');
          }
          response = await undiciRequest(requestUrl, requestOptions);
        }
      }

      const context = response.context as { history: URL[] };
      let lastUrl = '';
      if (context?.history) {
        for (const urlObject of context?.history) {
          res.requestUrls.push(urlObject.href);
          lastUrl = urlObject.href;
        }
      } else {
        res.requestUrls.push(requestUrl.href);
        lastUrl = requestUrl.href;
      }
      const contentEncoding = response.headers['content-encoding'];
      const isCompressedContent = contentEncoding === 'gzip' || contentEncoding === 'br';

      res.headers = response.headers;
      res.status = res.statusCode = response.statusCode;
      if (res.headers['content-length']) {
        res.size = parseInt(res.headers['content-length']);
      }

      let data: any = null;
      let responseBodyStream: ReadableWithMeta | undefined;
      if (args.dataType === 'stream') {
        // streaming mode will disable retry
        args.retry = 0;
        const meta: BaseResponseMeta = {
          status: res.status,
          statusCode: res.statusCode,
          headers: res.headers,
          timing,
          socket: socketInfo,
        };
        // only auto decompress on request args.compressed = true
        if (args.compressed === true && isCompressedContent) {
          // gzip or br
          const decoder = contentEncoding === 'gzip' ? createGunzip() : createBrotliDecompress();
          responseBodyStream = Object.assign(pipeline(response.body, decoder, noop), meta);
        } else {
          responseBodyStream = Object.assign(response.body, meta);
        }
      } else if (args.writeStream) {
        // streaming mode will disable retry
        args.retry = 0;
        if (args.compressed === true && isCompressedContent) {
          const decoder = contentEncoding === 'gzip' ? createGunzip() : createBrotliDecompress();
          await pipelinePromise(response.body, decoder, args.writeStream);
        } else {
          await pipelinePromise(response.body, args.writeStream);
        }
      } else {
        // buffer
        data = Buffer.from(await response.body.arrayBuffer());
        if (isCompressedContent && data.length > 0) {
          try {
            data = contentEncoding === 'gzip' ? gunzipSync(data) : brotliDecompressSync(data);
          } catch (err: any) {
            if (err.name === 'Error') {
              err.name = 'UnzipError';
            }
            throw err;
          }
        }
        if (args.dataType === 'text') {
          data = data.toString();
        } else if (args.dataType === 'json') {
          if (data.length === 0) {
            data = null;
          } else {
            data = parseJSON(data.toString(), args.fixJSONCtlChars);
          }
        }
      }
      res.rt = performanceTime(requestStartTime);
      // get real socket info from internalOpaque
      this.#updateSocketInfo(socketInfo, internalOpaque);

      const clientResponse: HttpClientResponse = {
        opaque: orginalOpaque,
        data,
        status: res.status,
        statusCode: res.status,
        headers: res.headers,
        url: lastUrl,
        redirected: res.requestUrls.length > 1,
        requestUrls: res.requestUrls,
        res: responseBodyStream ?? res,
      };

      if (args.retry > 0 && requestContext.retries < args.retry) {
        const isRetry = args.isRetry ?? defaultIsRetry;
        if (isRetry(clientResponse)) {
          if (args.retryDelay) {
            await sleep(args.retryDelay);
          }
          requestContext.retries++;
          return await this.#requestInternal(url, options, requestContext);
        }
      }

      if (this.listenerCount('response') > 0) {
        this.emit('response', {
          requestId,
          error: null,
          ctx: args.ctx,
          req: {
            ...reqMeta,
            options: args,
          },
          res,
        });
      }

      return clientResponse;
    } catch (e: any) {
      debug('Request#%d throw error: %s', requestId, e);
      let err = e;
      if (err.name === 'HeadersTimeoutError') {
        err = new HttpClientRequestTimeoutError(headersTimeout, { cause: e });
      } else if (err.name === 'BodyTimeoutError') {
        err = new HttpClientRequestTimeoutError(bodyTimeout, { cause: e });
      }
      err.opaque = orginalOpaque;
      err.status = res.status;
      err.headers = res.headers;
      err.res = res;
      // make sure requestUrls not empty
      if (res.requestUrls.length === 0) {
        res.requestUrls.push(requestUrl.href);
      }
      res.rt = performanceTime(requestStartTime);
      this.#updateSocketInfo(socketInfo, internalOpaque);

      if (this.listenerCount('response') > 0) {
        this.emit('response', {
          requestId,
          error: err,
          ctx: args.ctx,
          req: {
            ...reqMeta,
            options: args,
          },
          res,
        });
      }
      throw err;
    }
  }

  #updateSocketInfo(socketInfo: SocketInfo, internalOpaque: any) {
    const socket = internalOpaque[symbols.kRequestSocket];
    if (socket) {
      socketInfo.id = socket[symbols.kSocketId];
      socketInfo.handledRequests = socket[symbols.kHandledRequests];
      socketInfo.handledResponses = socket[symbols.kHandledResponses];
      socketInfo.localAddress = socket.localAddress;
      socketInfo.localPort = socket.localPort;
      socketInfo.remoteAddress = socket.remoteAddress;
      socketInfo.remotePort = socket.remotePort;
      socketInfo.remoteFamily = socket.remoteFamily;
      socketInfo.bytesRead = socket.bytesRead;
      socketInfo.bytesWritten = socket.bytesWritten;
    }
  }
}
