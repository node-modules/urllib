import { RequestOptions, RequestURL } from './Request.js';
export declare function request<T = any>(url: RequestURL, options?: RequestOptions): Promise<import("./Response.js").HttpClientResponse<T>>;
export declare function curl<T = any>(url: RequestURL, options?: RequestOptions): Promise<import("./Response.js").HttpClientResponse<T>>;
export { MockAgent, ProxyAgent, Agent, Dispatcher, setGlobalDispatcher, getGlobalDispatcher, } from 'undici';
export { HttpClient, HttpClient as HttpClient2, HEADER_USER_AGENT as USER_AGENT, RequestDiagnosticsMessage, ResponseDiagnosticsMessage, } from './HttpClient.js';
export { RequestOptions, RequestOptions as RequestOptions2, RequestURL, HttpMethod, FixJSONCtlCharsHandler, FixJSONCtlChars, } from './Request.js';
export { SocketInfo, Timing, RawResponseWithMeta, HttpClientResponse, IncomingHttpHeaders, } from './Response.js';
declare const _default: {
    request: typeof request;
    curl: typeof curl;
    USER_AGENT: string;
};
export default _default;
