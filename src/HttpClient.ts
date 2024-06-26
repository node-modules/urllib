import diagnosticsChannel from 'node:diagnostics_channel';
import { EventEmitter } from 'node:events';
import { LookupFunction } from 'node:net';
import { STATUS_CODES } from 'node:http';
import { debuglog } from 'node:util';
import {
  createGunzip,
  createBrotliDecompress,
  gunzipSync,
  brotliDecompressSync,
} from 'node:zlib';
import { Blob } from 'node:buffer';
import { Readable, pipeline } from 'node:stream';
import stream from 'node:stream';
import { basename } from 'node:path';
import { createReadStream } from 'node:fs';
import { format as urlFormat } from 'node:url';
import { performance } from 'node:perf_hooks';
import querystring from 'node:querystring';
import {
  FormData as FormDataNative,
  request as undiciRequest,
  Dispatcher,
  Agent,
  getGlobalDispatcher,
  Pool,
} from 'undici';
import undiciSymbols from 'undici/lib/core/symbols.js';
import { FormData as FormDataNode } from 'formdata-node';
import { FormDataEncoder } from 'form-data-encoder';
import createUserAgent from 'default-user-agent';
import mime from 'mime-types';
import qs from 'qs';
import pump from 'pump';
// Compatible with old style formstream
import FormStream from 'formstream';
import { HttpAgent, CheckAddressFunction } from './HttpAgent.js';
import type { IncomingHttpHeaders } from './IncomingHttpHeaders.js';
import { RequestURL, RequestOptions, HttpMethod, RequestMeta } from './Request.js';
import { RawResponseWithMeta, HttpClientResponse, SocketInfo } from './Response.js';
import { parseJSON, sleep, digestAuthHeader, globalId, performanceTime, isReadable } from './utils.js';
import symbols from './symbols.js';
import { initDiagnosticsChannel } from './diagnosticsChannel.js';
import { HttpClientConnectTimeoutError, HttpClientRequestTimeoutError } from './HttpClientError.js';

type Exists<T> = T extends undefined ? never : T;
type UndiciRequestOption = Exists<Parameters<typeof undiciRequest>[1]>;
type PropertyShouldBe<T, K extends keyof T, V> = Omit<T, K> & { [P in K]: V };
type IUndiciRequestOption = PropertyShouldBe<UndiciRequestOption, 'headers', IncomingHttpHeaders>;

const PROTO_RE = /^https?:\/\//i;
const FormData = FormDataNative ?? FormDataNode;
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
// Node.js 14 or 16
const isNode14Or16 = /v1[46]\./.test(process.version);

export type ClientOptions = {
  defaultArgs?: RequestOptions;
  /** Allow to use HTTP2 first. Default is `false` */
  allowH2?: boolean;
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
     * socketPath string | null (optional) - Default: null - An IPC endpoint, either Unix domain socket or Windows named pipe
     */
    socketPath?: string | null;
    /**
     * connect timeout, default is 10000ms
     */
    timeout?: number;
  },
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

export const HEADER_USER_AGENT = createUserAgent('node-urllib', 'VERSION');

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

export type RequestContext = {
  retries: number;
  socketErrorRetries: number;
  requestStartTime?: number;
};

const channels = {
  request: diagnosticsChannel.channel('urllib:request'),
  response: diagnosticsChannel.channel('urllib:response'),
};

export type RequestDiagnosticsMessage = {
  request: RequestMeta;
};

export type ResponseDiagnosticsMessage = {
  request: RequestMeta;
  response: RawResponseWithMeta;
  error?: Error;
};

export interface PoolStat {
  /** Number of open socket connections in this pool. */
  connected: number;
  /** Number of open socket connections in this pool that do not have an active request. */
  free: number;
  /** Number of pending requests across all clients in this pool. */
  pending: number;
  /** Number of queued requests across all clients in this pool. */
  queued: number;
  /** Number of currently active requests across all clients in this pool. */
  running: number;
  /** Number of active, pending, or queued requests across all clients in this pool. */
  size: number;
}

export class HttpClient extends EventEmitter {
  #defaultArgs?: RequestOptions;
  #dispatcher?: Dispatcher;

  constructor(clientOptions?: ClientOptions) {
    super();
    this.#defaultArgs = clientOptions?.defaultArgs;
    if (clientOptions?.lookup || clientOptions?.checkAddress) {
      this.#dispatcher = new HttpAgent({
        lookup: clientOptions.lookup,
        checkAddress: clientOptions.checkAddress,
        connect: clientOptions.connect,
        allowH2: clientOptions.allowH2,
      });
    } else if (clientOptions?.connect) {
      this.#dispatcher = new Agent({
        connect: clientOptions.connect,
        allowH2: clientOptions.allowH2,
      });
    } else if (clientOptions?.allowH2) {
      // Support HTTP2
      this.#dispatcher = new Agent({
        allowH2: clientOptions.allowH2,
      });
    }
    initDiagnosticsChannel();
  }

  getDispatcher() {
    return this.#dispatcher ?? getGlobalDispatcher();
  }

  setDispatcher(dispatcher: Dispatcher) {
    this.#dispatcher = dispatcher;
  }

  getDispatcherPoolStats() {
    const agent = this.getDispatcher();
    // origin => Pool Instance
    const clients: Map<string, WeakRef<Pool>> | undefined = agent[undiciSymbols.kClients];
    const poolStatsMap: Record<string, PoolStat> = {};
    if (!clients) {
      return poolStatsMap;
    }
    for (const [ key, ref ] of clients) {
      const pool = ref.deref();
      const stats = pool?.stats;
      if (!stats) continue;
      poolStatsMap[key] = {
        connected: stats.connected,
        free: stats.free,
        pending: stats.pending,
        queued: stats.queued,
        running: stats.running,
        size: stats.size,
      } satisfies PoolStat;
    }
    return poolStatsMap;
  }

  async request<T = any>(url: RequestURL, options?: RequestOptions) {
    return await this.#requestInternal<T>(url, options);
  }

  // alias to request, keep compatible with urllib@2 HttpClient.curl
  async curl<T = any>(url: RequestURL, options?: RequestOptions) {
    return await this.request<T>(url, options);
  }

  async #requestInternal<T>(url: RequestURL, options?: RequestOptions, requestContext?: RequestContext): Promise<HttpClientResponse<T>> {
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
        // or even if not, we clone to avoid mutating it
        requestUrl = new URL(url.toString());
      }
    }

    const method = (options?.type || options?.method || 'GET').toUpperCase() as HttpMethod;
    const originalHeaders = options?.headers;
    const headers: IncomingHttpHeaders = {};
    const args = {
      retry: 0,
      socketErrorRetry: 1,
      timing: true,
      ...this.#defaultArgs,
      ...options,
      // keep method and headers exists on args for request event handler to easy use
      method,
      headers,
    };
    requestContext = {
      retries: 0,
      socketErrorRetries: 0,
      ...requestContext,
    };
    if (!requestContext.requestStartTime) {
      requestContext.requestStartTime = performance.now();
    }
    const requestStartTime = requestContext.requestStartTime;

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
    const originalOpaque = args.opaque;
    // using opaque to diagnostics channel, binding request and socket
    const internalOpaque = {
      [symbols.kRequestId]: requestId,
      [symbols.kRequestStartTime]: requestStartTime,
      [symbols.kEnableRequestTiming]: !!args.timing,
      [symbols.kRequestTiming]: timing,
      [symbols.kRequestOriginalOpaque]: originalOpaque,
    };
    const reqMeta = {
      requestId,
      url: requestUrl.href,
      args,
      ctx: args.ctx,
      retries: requestContext.retries,
    } as RequestMeta;
    const socketInfo: SocketInfo = {
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
    let res = {
      status: -1,
      statusCode: -1,
      statusText: '',
      statusMessage: '',
      headers: resHeaders,
      size: 0,
      aborted: false,
      rt: 0,
      keepAliveSocket: true,
      requestUrls: [],
      timing,
      socket: socketInfo,
      retries: requestContext.retries,
      socketErrorRetries: requestContext.socketErrorRetries,
    } as any as RawResponseWithMeta;

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
    if (originalHeaders) {
      // convert headers to lower-case
      for (const name in originalHeaders) {
        headers[name.toLowerCase()] = originalHeaders[name];
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
    if (requestContext.socketErrorRetries > 0) {
      headers['x-urllib-retry-on-socket-error'] = `${requestContext.socketErrorRetries}/${args.socketErrorRetry}`;
    }
    if (args.auth && !headers.authorization) {
      headers.authorization = `Basic ${Buffer.from(args.auth).toString('base64')}`;
    }

    // streaming request should disable socketErrorRetry and retry
    let isStreamingRequest = false;
    if (args.dataType === 'stream' || args.writeStream) {
      isStreamingRequest = true;
    }

    try {
      const requestOptions: IUndiciRequestOption = {
        method,
        maxRedirections: args.maxRedirects ?? 10,
        headersTimeout,
        headers,
        bodyTimeout,
        opaque: internalOpaque,
        dispatcher: args.dispatcher ?? this.#dispatcher,
        signal: args.signal,
      };
      if (typeof args.highWaterMark === 'number') {
        requestOptions.highWaterMark = args.highWaterMark;
      }
      if (typeof args.reset === 'boolean') {
        requestOptions.reset = args.reset;
      }
      if (args.followRedirect === false) {
        requestOptions.maxRedirections = 0;
      }

      const isGETOrHEAD = requestOptions.method === 'GET' || requestOptions.method === 'HEAD';
      // alias to args.content
      if (args.stream && !args.content) {
        // convert old style stream to new stream
        // https://nodejs.org/dist/latest-v18.x/docs/api/stream.html#readablewrapstream
        if (isReadable(args.stream) && !(args.stream instanceof Readable)) {
          debug('Request#%d convert old style stream to Readable', requestId);
          args.stream = new Readable().wrap(args.stream);
          isStreamingRequest = true;
        } else if (args.stream instanceof FormStream) {
          debug('Request#%d convert formstream to Readable', requestId);
          args.stream = new Readable().wrap(args.stream);
          isStreamingRequest = true;
        }
        args.content = args.stream;
      }

      if (args.files) {
        if (isGETOrHEAD) {
          requestOptions.method = 'POST';
        }
        const formData = new FormData();
        const uploadFiles: [string, string | Readable | Buffer, string?][] = [];
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
            // set custom fileName
            uploadFiles.push([ field, args.files[field], field ]);
          }
        }
        // set normal fields first
        if (args.data) {
          for (const field in args.data) {
            formData.append(field, args.data[field]);
          }
        }
        for (const [ index, [ field, file, customFileName ]] of uploadFiles.entries()) {
          if (typeof file === 'string') {
            // FIXME: support non-ascii filename
            // const fileName = encodeURIComponent(basename(file));
            // formData.append(field, await fileFromPath(file, `utf-8''${fileName}`, { type: mime.lookup(fileName) || '' }));
            const fileName = basename(file);
            const fileReadable = createReadStream(file);
            formData.append(field, new BlobFromStream(fileReadable, mime.lookup(fileName) || ''), fileName);
          } else if (Buffer.isBuffer(file)) {
            formData.append(field, new Blob([ file ]), customFileName || `bufferfile${index}`);
          } else if (file instanceof Readable || isReadable(file as any)) {
            const fileName = getFileName(file) || customFileName || `streamfile${index}`;
            formData.append(field, new BlobFromStream(file, mime.lookup(fileName) || ''), fileName);
            isStreamingRequest = true;
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
          isStreamingRequest = isReadable(args.content);
        }
      } else if (args.data) {
        const isStringOrBufferOrReadable = typeof args.data === 'string'
          || Buffer.isBuffer(args.data)
          || isReadable(args.data);
        if (isGETOrHEAD) {
          if (!isStringOrBufferOrReadable) {
            let query;
            if (args.nestedQuerystring) {
              query = qs.stringify(args.data);
            } else {
              query = querystring.stringify(args.data);
            }
            // reset the requestUrl
            const href = requestUrl.href;
            requestUrl = new URL(href + (href.includes('?') ? '&' : '?') + query);
          }
        } else {
          if (isStringOrBufferOrReadable) {
            requestOptions.body = args.data;
            isStreamingRequest = isReadable(args.data);
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
              if (args.nestedQuerystring) {
                requestOptions.body = qs.stringify(args.data);
              } else {
                requestOptions.body = new URLSearchParams(args.data).toString();
              }
            }
          }
        }
      }
      if (isStreamingRequest) {
        args.retry = 0;
        args.socketErrorRetry = 0;
      }

      debug('Request#%d %s %s, headers: %j, headersTimeout: %s, bodyTimeout: %s, isStreamingRequest: %s',
        requestId, requestOptions.method, requestUrl.href, headers, headersTimeout, bodyTimeout, isStreamingRequest);
      requestOptions.headers = headers;
      channels.request.publish({
        request: reqMeta,
      } as RequestDiagnosticsMessage);
      if (this.listenerCount('request') > 0) {
        this.emit('request', reqMeta);
      }

      let response = await undiciRequest(requestUrl, requestOptions as UndiciRequestOption);
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
          if (Array.isArray(response.headers['set-cookie'])) {
            // FIXME: merge exists cookie header
            requestOptions.headers.cookie = response.headers['set-cookie'].join(';');
          }
          response = await undiciRequest(requestUrl, requestOptions as UndiciRequestOption);
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
      res.statusMessage = res.statusText = STATUS_CODES[res.status] || '';
      if (res.headers['content-length']) {
        res.size = parseInt(res.headers['content-length']);
      }

      let data: any = null;
      if (args.dataType === 'stream') {
        // only auto decompress on request args.compressed = true
        if (args.compressed === true && isCompressedContent) {
          // gzip or br
          const decoder = contentEncoding === 'gzip' ? createGunzip() : createBrotliDecompress();
          res = Object.assign(pipeline(response.body, decoder, noop), res);
        } else {
          res = Object.assign(response.body, res);
        }
      } else if (args.writeStream) {
        if (isNode14Or16 && args.writeStream.destroyed) {
          throw new Error('writeStream is destroyed');
        }
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
        if (args.dataType === 'text' || args.dataType === 'html') {
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
        opaque: originalOpaque,
        data,
        status: res.status,
        statusCode: res.status,
        statusText: res.statusText,
        headers: res.headers,
        url: lastUrl,
        redirected: res.requestUrls.length > 1,
        requestUrls: res.requestUrls,
        res,
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

      debug('Request#%d got response, status: %s, headers: %j, timing: %j',
        requestId, res.status, res.headers, res.timing);
      channels.response.publish({
        request: reqMeta,
        response: res,
      } as ResponseDiagnosticsMessage);
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
    } catch (rawError: any) {
      debug('Request#%d throw error: %s', requestId, rawError);
      let err = rawError;
      if (err.name === 'HeadersTimeoutError') {
        err = new HttpClientRequestTimeoutError(headersTimeout, { cause: err });
      } else if (err.name === 'BodyTimeoutError') {
        err = new HttpClientRequestTimeoutError(bodyTimeout, { cause: err });
      } else if (err.code === 'UND_ERR_CONNECT_TIMEOUT') {
        err = new HttpClientConnectTimeoutError(err.message, err.code, { cause: err });
      } else if (err.code === 'UND_ERR_SOCKET' || err.code === 'ECONNRESET') {
        // auto retry on socket error, https://github.com/node-modules/urllib/issues/454
        if (args.socketErrorRetry > 0 && requestContext.socketErrorRetries < args.socketErrorRetry) {
          requestContext.socketErrorRetries++;
          return await this.#requestInternal(url, options, requestContext);
        }
      }
      err.opaque = originalOpaque;
      err.status = res.status;
      err.headers = res.headers;
      err.res = res;
      if (err.socket) {
        // store rawSocket
        err._rawSocket = err.socket;
      }
      err.socket = socketInfo;
      // make sure requestUrls not empty
      if (res.requestUrls.length === 0) {
        res.requestUrls.push(requestUrl.href);
      }
      res.rt = performanceTime(requestStartTime);
      this.#updateSocketInfo(socketInfo, internalOpaque, rawError);

      channels.response.publish({
        request: reqMeta,
        response: res,
        error: err,
      } as ResponseDiagnosticsMessage);
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

  #updateSocketInfo(socketInfo: SocketInfo, internalOpaque: any, err?: any) {
    const socket = internalOpaque[symbols.kRequestSocket] ?? err?.[symbols.kErrorSocket];
    if (socket) {
      socketInfo.id = socket[symbols.kSocketId];
      socketInfo.handledRequests = socket[symbols.kHandledRequests];
      socketInfo.handledResponses = socket[symbols.kHandledResponses];
      if (socket[symbols.kSocketLocalAddress]) {
        socketInfo.localAddress = socket[symbols.kSocketLocalAddress];
        socketInfo.localPort = socket[symbols.kSocketLocalPort];
      }
      if (socket.remoteAddress) {
        socketInfo.remoteAddress = socket.remoteAddress;
        socketInfo.remotePort = socket.remotePort;
        socketInfo.remoteFamily = socket.remoteFamily;
      }
      socketInfo.bytesRead = socket.bytesRead;
      socketInfo.bytesWritten = socket.bytesWritten;
      if (socket[symbols.kSocketConnectErrorTime]) {
        socketInfo.connectErrorTime = socket[symbols.kSocketConnectErrorTime];
        if (Array.isArray(socket.autoSelectFamilyAttemptedAddresses)) {
          socketInfo.attemptedRemoteAddresses = socket.autoSelectFamilyAttemptedAddresses;
        }
        socketInfo.connectProtocol = socket[symbols.kSocketConnectProtocol];
        socketInfo.connectHost = socket[symbols.kSocketConnectHost];
        socketInfo.connectPort = socket[symbols.kSocketConnectPort];
      }
      if (socket[symbols.kSocketConnectedTime]) {
        socketInfo.connectedTime = socket[symbols.kSocketConnectedTime];
      }
      if (socket[symbols.kSocketRequestEndTime]) {
        socketInfo.lastRequestEndTime = socket[symbols.kSocketRequestEndTime];
      }
      socket[symbols.kSocketRequestEndTime] = new Date();
    }
  }
}
