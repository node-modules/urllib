import { LRU } from 'ylru';
import { patchForNode16 } from './utils.js';


patchForNode16();

import { HttpClient, HEADER_USER_AGENT } from './HttpClient.js';
import { RequestOptions, RequestURL } from './Request.js';

let httpClient: HttpClient;
let allowH2HttpClient: HttpClient;
let allowUnauthorizedHttpClient: HttpClient;
let allowH2AndUnauthorizedHttpClient: HttpClient;
const domainSocketHttpClients = new LRU(50);

export function getDefaultHttpClient(rejectUnauthorized?: boolean, allowH2?: boolean): HttpClient {
  if (rejectUnauthorized === false) {
    if (allowH2) {
      if (!allowH2AndUnauthorizedHttpClient) {
        allowH2AndUnauthorizedHttpClient = new HttpClient({
          allowH2,
          connect: {
            rejectUnauthorized,
          },
        });
      }
      return allowH2AndUnauthorizedHttpClient;
    }

    if (!allowUnauthorizedHttpClient) {
      allowUnauthorizedHttpClient = new HttpClient({
        connect: {
          rejectUnauthorized,
        },
      });
    }
    return allowUnauthorizedHttpClient;
  }

  if (allowH2) {
    if (!allowH2HttpClient) {
      allowH2HttpClient = new HttpClient({
        allowH2,
      });
    }
    return allowH2HttpClient;
  }

  if (!httpClient) {
    httpClient = new HttpClient();
  }
  return httpClient;
}

interface UrllibRequestOptions extends RequestOptions {
  /**
   * If `true`, the server certificate is verified against the list of supplied CAs.
   * An 'error' event is emitted if verification fails.
   * Default: `true`
   */
  rejectUnauthorized?: boolean;
  /** Allow to use HTTP2 first. Default is `false` */
  allowH2?: boolean;
}

export async function request<T = any>(url: RequestURL, options?: UrllibRequestOptions) {
  if (options?.socketPath) {
    let domainSocketHttpclient = domainSocketHttpClients.get<HttpClient>(options.socketPath);
    if (!domainSocketHttpclient) {
      domainSocketHttpclient = new HttpClient({
        connect: { socketPath: options.socketPath },
      });
      domainSocketHttpClients.set(options.socketPath, domainSocketHttpclient);
    }
    return await domainSocketHttpclient.request<T>(url, options);
  }

  return await getDefaultHttpClient(options?.rejectUnauthorized, options?.allowH2).request<T>(url, options);
}

// export curl method is keep compatible with urllib.curl()
// ```ts
// import * as urllib from 'urllib';
// urllib.curl(url);
// ```
export async function curl<T = any>(url: RequestURL, options?: UrllibRequestOptions) {
  return await request<T>(url, options);
}

export {
  MockAgent, ProxyAgent, Agent, Dispatcher,
  setGlobalDispatcher, getGlobalDispatcher,
  Request, RequestInfo, RequestInit,
  Response, BodyInit, ResponseInit,
  Headers, FormData,
} from 'undici';
// HttpClient2 is keep compatible with urllib@2 HttpClient2
export {
  HttpClient, HttpClient as HttpClient2, HEADER_USER_AGENT as USER_AGENT,
  RequestDiagnosticsMessage, ResponseDiagnosticsMessage, ClientOptions,
} from './HttpClient.js';
// RequestOptions2 is keep compatible with urllib@2 RequestOptions2
export {
  RequestOptions, RequestOptions as RequestOptions2, RequestURL, HttpMethod,
  FixJSONCtlCharsHandler, FixJSONCtlChars,
} from './Request.js';

export { CheckAddressFunction } from './HttpAgent.js';

export {
  SocketInfo, Timing, RawResponseWithMeta, HttpClientResponse,
} from './Response.js';
export {
  IncomingHttpHeaders,
} from './IncomingHttpHeaders.js';
export * from './HttpClientError.js';
export { FetchFactory, fetch } from './fetch.js';
export { FormData as WebFormData } from './FormData.js';

export default {
  request,
  curl,
  USER_AGENT: HEADER_USER_AGENT,
};
