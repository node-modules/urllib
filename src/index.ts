import { LRU } from 'ylru';

import { HttpClient, HEADER_USER_AGENT } from './HttpClient.js';
import type { RequestOptions, RequestURL } from './Request.js';
import type { HttpClientResponse } from './Response.js';

let httpClient: HttpClient;
let allowH2HttpClient: HttpClient;
let disallowH2HttpClient: HttpClient;
let allowUnauthorizedHttpClient: HttpClient;
let allowH2AndUnauthorizedHttpClient: HttpClient;
let disallowH2AndUnauthorizedHttpClient: HttpClient;
const domainSocketHttpClients = new LRU(50);

// `allowH2: false` clients keep the preference (so `request(url)` on them forces
// HTTP/1.1) and, unless they need a dedicated agent for other reasons, do not create
// their own dispatcher, so they still go through the active/global dispatcher per
// request. The `rejectUnauthorized: false` variants are the exception: they must own
// an agent to carry the TLS option, so those bypass the global dispatcher (as before).
export function getDefaultHttpClient(rejectUnauthorized?: boolean, allowH2?: boolean): HttpClient {
  if (rejectUnauthorized === false) {
    if (allowH2 === true) {
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

    if (allowH2 === false) {
      if (!disallowH2AndUnauthorizedHttpClient) {
        disallowH2AndUnauthorizedHttpClient = new HttpClient({
          allowH2,
          connect: {
            rejectUnauthorized,
          },
        });
      }
      return disallowH2AndUnauthorizedHttpClient;
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

  if (allowH2 === true) {
    if (!allowH2HttpClient) {
      allowH2HttpClient = new HttpClient({
        allowH2,
      });
    }
    return allowH2HttpClient;
  }

  if (allowH2 === false) {
    if (!disallowH2HttpClient) {
      disallowH2HttpClient = new HttpClient({
        allowH2,
      });
    }
    return disallowH2HttpClient;
  }

  if (!httpClient) {
    httpClient = new HttpClient();
  }
  return httpClient;
}

interface UrllibRequestOptions extends RequestOptions {
  /**
   * If `true`, the server certificate is verified against the list of supplied CAs. An 'error' event is emitted if
   * verification fails. Default: `true`
   */
  rejectUnauthorized?: boolean;
  /** Negotiate HTTP/2 with capable servers via ALPN. Enabled by default since undici@8; set `false` to force HTTP/1.1. */
  allowH2?: boolean;
}

export async function request<T = any>(
  url: RequestURL,
  options?: UrllibRequestOptions,
): Promise<HttpClientResponse<T>> {
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
export async function curl<T = any>(url: RequestURL, options?: UrllibRequestOptions): Promise<HttpClientResponse<T>> {
  return await request<T>(url, options);
}

export {
  MockAgent,
  ProxyAgent,
  Agent,
  Dispatcher,
  setGlobalDispatcher,
  getGlobalDispatcher,
  Request,
  Response,
  Headers,
  FormData,
  getCookies,
  setCookie,
  getSetCookies,
  deleteCookie,
  parseCookie,
} from 'undici';
export type { RequestInfo, RequestInit, BodyInit, ResponseInit, Cookie } from 'undici';
// HttpClient2 is keep compatible with urllib@2 HttpClient2
export { HttpClient, HttpClient as HttpClient2, HEADER_USER_AGENT as USER_AGENT } from './HttpClient.js';
export type { RequestDiagnosticsMessage, ResponseDiagnosticsMessage, ClientOptions } from './HttpClient.js';
// RequestOptions2 is keep compatible with urllib@2 RequestOptions2
export type {
  RequestOptions,
  RequestOptions as RequestOptions2,
  RequestURL,
  HttpMethod,
  FixJSONCtlCharsHandler,
  FixJSONCtlChars,
} from './Request.js';

export type { CheckAddressFunction } from './HttpAgent.js';

export type { SocketInfo, Timing, RawResponseWithMeta, HttpClientResponse } from './Response.js';
export type { IncomingHttpHeaders } from './IncomingHttpHeaders.js';
export * from './HttpClientError.js';
export { FetchFactory, fetch } from './fetch.js';
export { FormData as WebFormData } from './FormData.js';

const urllib: {
  request: typeof request;
  curl: typeof curl;
  USER_AGENT: string;
} = {
  request,
  curl,
  USER_AGENT: HEADER_USER_AGENT,
};

export default urllib;
