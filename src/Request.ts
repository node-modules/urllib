import { Readable, Writable } from 'stream';
import { IncomingHttpHeaders } from 'http';
import type {
  HttpMethod as UndiciHttpMethod,
} from 'undici/types/dispatcher';
import type {
  HttpClientResponse,
} from './Response';

export type HttpMethod = UndiciHttpMethod;

export type RequestURL = string | URL;

export type FixJSONCtlCharsHandler = (data: string) => string;
export type FixJSONCtlChars = boolean | FixJSONCtlCharsHandler;

export type RequestOptions = {
  /** Request method, defaults to GET. Could be GET, POST, DELETE or PUT. Alias 'type'. */
  method?: HttpMethod | Lowercase<HttpMethod>;
  /** Data to be sent. Will be stringify automatically. */
  data?: any;
  /** Manually set the content of payload. If set, data will be ignored. */
  content?: string | Buffer | Readable;
  /**
   * @deprecated
   * Stream to be pipe to the remote. If set, data and content will be ignored.
   * Alias to `content = Readable`
   */
  stream?: Readable;
  /**
   * A writable stream to be piped by the response stream.
   * Responding data will be write to this stream and callback
   * will be called with data set null after finished writing.
   */
  writeStream?: Writable;
  /**
    * The files will send with multipart/form-data format, base on formstream.
    * If method not set, will use POST method by default.
    */
  files?: Array<Readable | Buffer | string> | Record<string, Readable | Buffer | string> | Readable | Buffer | string;
  /** Type of request data, could be 'json'. If it's 'json', will auto set Content-Type: 'application/json' header. */
  contentType?: string;
  /**
   * Type of response data. Could be text or json.
   * If it's text, the callbacked data would be a String.
   * If it's json, the data of callback would be a parsed JSON Object
   * and will auto set Accept: 'application/json' header.
   * Default is 'buffer'.
   */
  dataType?: 'text' | 'json' | 'buffer' | 'stream';
  /**
   * @deprecated
   * Let you get the res object when request connected, default false.
   * If set to true, `data` will be response readable stream.
   * Alias to `dataType = 'stream'`
   */
  streaming?: boolean;
  /**
   * @deprecated
   * Alias to `dataType = 'stream'`
   */
  customResponse?: boolean;
  /** Fix the control characters (U+0000 through U+001F) before JSON parse response. Default is false. */
  fixJSONCtlChars?: FixJSONCtlChars;
  /** Request headers. */
  headers?: IncomingHttpHeaders;
  /**
   * Request timeout in milliseconds for connecting phase and response receiving phase.
   * Defaults to exports.
   * TIMEOUT, both are 5s. You can use timeout: 5000 to tell urllib use same timeout on two phase or set them seperately such as
   * timeout: [3000, 5000], which will set connecting timeout to 3s and response 5s.
   */
  timeout?: number | number[];
  /**
   * username:password used in HTTP Basic Authorization.
   * Alias to `headers.authorization = xxx`
   **/
  auth?: string;
  /**
   * username:password used in HTTP Digest Authorization.
   * */
  digestAuth?: string;
  /** follow HTTP 3xx responses as redirects. defaults to true. */
  followRedirect?: boolean;
  /** The maximum number of redirects to follow, defaults to 10. */
  maxRedirects?: number;
  /** Format the redirect url by your self. Default is url.resolve(from, to). */
  formatRedirectUrl?: (a: any, b: any) => void;
  /** Before request hook, you can change every thing here. */
  beforeRequest?: (...args: any[]) => void;
  /** Accept `gzip, br` response content and auto decode it, default is false. */
  compressed?: boolean;
  /**
   * @deprecated
   * Alias to compressed
   * */
  gzip?: boolean;
  /**
   * @deprecated
   * Enable timing or not, default is false.
   * */
  timing?: boolean;
  /**
   * Auto retry times on 5xx response, default is 0. Don't work on streaming request
   * It's not supported by using retry and writeStream, because the retry request can't stop the stream which is consuming.
   **/
  retry?: number;
  /** Wait a delay(ms) between retries */
  retryDelay?: number;
  /**
   * Determine whether retry, a response object as the first argument.
   * It will retry when status >= 500 by default. Request error is not included.
   */
  isRetry?: (response: HttpClientResponse) => boolean;
  /** Default: `null` */
  opaque?: unknown;
  /**
   * @deprecated
   * Maybe you should use opaque instead
   */
  ctx?: unknown;
};
