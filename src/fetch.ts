import { AsyncLocalStorage } from 'node:async_hooks';
import { debuglog } from 'node:util';
import {
  fetch as UndiciFetch,
  RequestInfo,
  RequestInit,
  Request,
  Response,
  Agent,
  getGlobalDispatcher,
  Pool,
  Dispatcher,
} from 'undici';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import undiciSymbols from 'undici/lib/core/symbols.js';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { getResponseState } from 'undici/lib/web/fetch/response.js';
import {
  channels,
  ClientOptions,
  PoolStat,
  RequestDiagnosticsMessage,
  ResponseDiagnosticsMessage,
  UndiciTimingInfo,
} from './HttpClient.js';
import {
  HttpAgent,
  HttpAgentOptions,
} from './HttpAgent.js';
import { initDiagnosticsChannel } from './diagnosticsChannel.js';
import { convertHeader, globalId, performanceTime, updateSocketInfo } from './utils.js';
import symbols from './symbols.js';
import {
  FetchMeta,
  HttpMethod,
  RequestMeta,
} from './Request.js';
import { FetchOpaque } from './FetchOpaqueInterceptor.js';
import { RawResponseWithMeta, SocketInfo } from './Response.js';
import { IncomingHttpHeaders } from './IncomingHttpHeaders.js';
import { BaseAgent, BaseAgentOptions } from './BaseAgent.js';

const debug = debuglog('urllib/fetch');

export interface UrllibRequestInit extends RequestInit {
  // default is true
  timing?: boolean;
}

export type FetchDiagnosticsMessage = {
  fetch: FetchMeta;
};

export type FetchResponseDiagnosticsMessage = {
  fetch: FetchMeta;
  timingInfo?: UndiciTimingInfo;
  response?: Response;
  error?: Error;
};

export class FetchFactory {
  static #dispatcher: Dispatcher.ComposedDispatcher;
  static #opaqueLocalStorage = new AsyncLocalStorage<FetchOpaque>();

  static getDispatcher() {
    return FetchFactory.#dispatcher ?? getGlobalDispatcher();
  }

  static setDispatcher(dispatcher: Agent) {
    FetchFactory.#dispatcher = dispatcher;
  }

  static setClientOptions(clientOptions: ClientOptions) {
    let dispatcherOption: BaseAgentOptions = {
      opaqueLocalStorage: FetchFactory.#opaqueLocalStorage,
    };
    let dispatcherClazz: new (options: BaseAgentOptions) => BaseAgent = BaseAgent;
    if (clientOptions?.lookup || clientOptions?.checkAddress) {
      dispatcherOption = {
        ...dispatcherOption,
        lookup: clientOptions.lookup,
        checkAddress: clientOptions.checkAddress,
        connect: clientOptions.connect,
        allowH2: clientOptions.allowH2,
      } as HttpAgentOptions;
      dispatcherClazz = HttpAgent as unknown as new (options: BaseAgentOptions) => BaseAgent;
    } else if (clientOptions?.connect) {
      dispatcherOption = {
        ...dispatcherOption,
        connect: clientOptions.connect,
        allowH2: clientOptions.allowH2,
      } as HttpAgentOptions;
      dispatcherClazz = BaseAgent;
    } else if (clientOptions?.allowH2) {
      // Support HTTP2
      dispatcherOption = {
        ...dispatcherOption,
        allowH2: clientOptions.allowH2,
      } as HttpAgentOptions;
      dispatcherClazz = BaseAgent;
    }
    FetchFactory.#dispatcher = new dispatcherClazz(dispatcherOption);
    initDiagnosticsChannel();
  }

  static getDispatcherPoolStats() {
    const agent = FetchFactory.getDispatcher();
    // origin => Pool Instance
    const clients: Map<string, WeakRef<Pool>> | undefined = Reflect.get(agent, undiciSymbols.kClients);
    const poolStatsMap: Record<string, PoolStat> = {};
    if (!clients) {
      return poolStatsMap;
    }
    for (const [ key, ref ] of clients) {
      const pool = typeof ref.deref === 'function' ? ref.deref() : ref as unknown as Pool;
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

  static async fetch(input: RequestInfo, init?: UrllibRequestInit): Promise<Response> {
    const requestStartTime = performance.now();
    init = init ?? {};
    init.dispatcher = init.dispatcher ?? FetchFactory.#dispatcher;
    const request = new Request(input, init);
    const requestId = globalId('HttpClientRequest');
    // https://developer.chrome.com/docs/devtools/network/reference/?utm_source=devtools#timing-explanation
    const timing = {
      // socket assigned
      queuing: 0,
      // dns lookup time
      dnslookup: 0,
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

    // using opaque to diagnostics channel, binding request and socket
    const internalOpaque = {
      [symbols.kRequestId]: requestId,
      [symbols.kRequestStartTime]: requestStartTime,
      [symbols.kEnableRequestTiming]: !!(init.timing ?? true),
      [symbols.kRequestTiming]: timing,
      // [symbols.kRequestOriginalOpaque]: originalOpaque,
    } as FetchOpaque;
    const reqMeta: RequestMeta = {
      requestId,
      url: request.url,
      args: {
        method: request.method as HttpMethod,
        type: request.method as HttpMethod,
        data: request.body,
        headers: convertHeader(request.headers),
      },
      retries: 0,
    };
    const fetchMeta: FetchMeta = {
      requestId,
      request,
    };
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
    channels.request.publish({
      request: reqMeta,
    } as RequestDiagnosticsMessage);
    channels.fetchRequest.publish({
      fetch: fetchMeta,
    } as FetchDiagnosticsMessage);

    let res: Response;
    // keep urllib createCallbackResponse style
    const resHeaders: IncomingHttpHeaders = {};
    const urllibResponse = {
      status: -1,
      statusCode: -1,
      statusText: '',
      statusMessage: '',
      headers: resHeaders,
      size: 0,
      aborted: false,
      rt: 0,
      keepAliveSocket: true,
      requestUrls: [
        request.url,
      ],
      timing,
      socket: socketInfo,
      retries: 0,
      socketErrorRetries: 0,
    } as any as RawResponseWithMeta;
    try {
      await FetchFactory.#opaqueLocalStorage.run(internalOpaque, async () => {
        res = await UndiciFetch(request);
      });
    } catch (e: any) {
      updateSocketInfo(socketInfo, internalOpaque, e);
      urllibResponse.rt = performanceTime(requestStartTime);
      debug('Request#%d throw error: %s', requestId, e);
      channels.fetchResponse.publish({
        fetch: fetchMeta,
        error: e,
      } as FetchResponseDiagnosticsMessage);
      channels.response.publish({
        request: reqMeta,
        response: urllibResponse,
        error: e,
      } as ResponseDiagnosticsMessage);
      throw e;
    }

    // get undici internal response
    const state = getResponseState(res!);
    updateSocketInfo(socketInfo, internalOpaque);

    urllibResponse.headers = convertHeader(res!.headers);
    urllibResponse.status = urllibResponse.statusCode = res!.status;
    urllibResponse!.statusMessage = res!.statusText;
    if (urllibResponse.headers['content-length']) {
      urllibResponse.size = parseInt(urllibResponse.headers['content-length']);
    }
    urllibResponse.rt = performanceTime(requestStartTime);
    debug('Request#%d got response, status: %s, headers: %j, timing: %j, socket: %j',
      requestId, urllibResponse.status, urllibResponse.headers, timing, urllibResponse.socket);
    channels.fetchResponse.publish({
      fetch: fetchMeta,
      timingInfo: state.timingInfo,
      response: res!,
    } as FetchResponseDiagnosticsMessage);
    channels.response.publish({
      request: reqMeta,
      response: urllibResponse,
    } as ResponseDiagnosticsMessage);
    return res!;
  }
}

export const fetch = FetchFactory.fetch;
