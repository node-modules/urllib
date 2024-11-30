import { AsyncLocalStorage } from 'node:async_hooks';
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
import undiciFetchSymbols from 'undici/lib/web/fetch/symbols.js';
import {
  channels,
  ClientOptions,
  PoolStat,
  RequestDiagnosticsMessage,
  ResponseDiagnosticsMessage,
  UnidiciTimingInfo,
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
import { FetchOpaque, fetchOpaqueInterceptor } from './FetchOpaqueInterceptor.js';
import { RawResponseWithMeta, SocketInfo } from './Response.js';
import { IncomingHttpHeaders } from './IncomingHttpHeaders.js';

export interface UrllibRequestInit extends RequestInit {
  // default is true
  timing?: boolean;
}

export type FetchDiagnosticsMessage = {
  fetch: FetchMeta;
};

export type FetchResponseDiagnosticsMessage = {
  fetch: FetchMeta;
  timingInfo?: UnidiciTimingInfo;
  response?: Response;
  error?: Error;
};

export class FetchFactory {
  static #dispatcher: Agent;
  static #opaqueLocalStorage = new AsyncLocalStorage<FetchOpaque>();

  static getDispatcher() {
    return FetchFactory.#dispatcher ?? getGlobalDispatcher();
  }

  static setDispatcher(dispatcher: Agent) {
    FetchFactory.#dispatcher = dispatcher;
  }

  static setClientOptions(clientOptions: ClientOptions) {
    let dispatcherOption: Agent.Options = {
      interceptors: {
        Agent: [
          fetchOpaqueInterceptor({
            opaqueLocalStorage: FetchFactory.#opaqueLocalStorage,
          }),
        ],
        Client: [],
      },
    };
    let dispatcherClazz: new (options: Agent.Options) => Agent = Agent;
    if (clientOptions?.lookup || clientOptions?.checkAddress) {
      dispatcherOption = {
        ...dispatcherOption,
        lookup: clientOptions.lookup,
        checkAddress: clientOptions.checkAddress,
        connect: clientOptions.connect,
        allowH2: clientOptions.allowH2,
      } as HttpAgentOptions;
      dispatcherClazz = HttpAgent as unknown as new (options: Agent.Options) => Agent;
    } else if (clientOptions?.connect) {
      dispatcherOption = {
        ...dispatcherOption,
        connect: clientOptions.connect,
        allowH2: clientOptions.allowH2,
      } as HttpAgentOptions;
      dispatcherClazz = Agent;
    } else if (clientOptions?.allowH2) {
      // Support HTTP2
      dispatcherOption = {
        ...dispatcherOption,
        allowH2: clientOptions.allowH2,
      } as HttpAgentOptions;
      dispatcherClazz = Agent;
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
        res = await UndiciFetch(input, init);
      });
    } catch (e: any) {
      channels.response.publish({
        fetch: fetchMeta,
        error: e,
      } as FetchResponseDiagnosticsMessage);
      channels.fetchResponse.publish({
        request: reqMeta,
        response: urllibResponse,
        error: e,
      } as ResponseDiagnosticsMessage);
      throw e;
    }

    // get unidici internal response
    const state = Reflect.get(res!, undiciFetchSymbols.kState) as Dispatcher.ResponseData;
    updateSocketInfo(socketInfo, internalOpaque /* , rawError */);

    urllibResponse.headers = convertHeader(res!.headers);
    urllibResponse.status = urllibResponse.statusCode = res!.status;
    urllibResponse!.statusMessage = res!.statusText;
    if (urllibResponse.headers['content-length']) {
      urllibResponse.size = parseInt(urllibResponse.headers['content-length']);
    }
    urllibResponse.rt = performanceTime(requestStartTime);

    channels.fetchResponse.publish({
      fetch: fetchMeta,
      timingInfo: (state as any).timingInfo,
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
