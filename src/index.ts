import LRU from 'ylru';
import { HttpClient, HEADER_USER_AGENT } from './HttpClient';
import { RequestOptions, RequestURL } from './Request';

let httpclient: HttpClient;
const domainSocketHttpclients = new LRU(50);
export async function request<T = any>(url: RequestURL, options?: RequestOptions) {
  if (options?.socketPath) {
    let domainSocketHttpclient = domainSocketHttpclients.get<HttpClient>(options.socketPath);
    if (!domainSocketHttpclient) {
      domainSocketHttpclient = new HttpClient({
        connect: { socketPath: options.socketPath },
      });
      domainSocketHttpclients.set(options.socketPath, domainSocketHttpclient);
    }
    return await domainSocketHttpclient.request<T>(url, options);
  }

  if (!httpclient) {
    httpclient = new HttpClient({});
  }
  return await httpclient.request<T>(url, options);
}

// export curl method is keep compatible with urlib.curl()
// ```ts
// import * as urllib from 'urllib';
// urllib.curl(url);
// ```
export async function curl<T = any>(url: RequestURL, options?: RequestOptions) {
  return await request<T>(url, options);
}

export {
  MockAgent, ProxyAgent, Agent, Dispatcher,
  setGlobalDispatcher, getGlobalDispatcher,
} from 'undici';
// HttpClient2 is keep compatible with urlib@2 HttpClient2
export {
  HttpClient, HttpClient as HttpClient2, HEADER_USER_AGENT as USER_AGENT,
  RequestDiagnosticsMessage, ResponseDiagnosticsMessage,
} from './HttpClient';
// RequestOptions2 is keep compatible with urlib@2 RequestOptions2
export {
  RequestOptions, RequestOptions as RequestOptions2, RequestURL, HttpMethod,
  FixJSONCtlCharsHandler, FixJSONCtlChars,
} from './Request';

export { SocketInfo, Timing, RawResponseWithMeta, HttpClientResponse } from './Response';

export default {
  request,
  curl,
  USER_AGENT: HEADER_USER_AGENT,
};
