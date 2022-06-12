import { Readable, Writable } from 'stream';
import { LookupFunction } from 'net';

export type HttpMethod = 'GET' | 'POST' | 'DELETE' | 'PUT' | 'HEAD' | 'OPTIONS' | 'PATCH' | 'TRACE' | 'CONNECT';

export type RequestURL = string | URL;

export type RequestOptions = {
  /** Request method, defaults to GET. Could be GET, POST, DELETE or PUT. Alias 'type'. */
  method?: HttpMethod;
  /** Data to be sent. Will be stringify automatically. */
  data?: any;
  /** Force convert data to query string. */
  dataAsQueryString?: boolean;
  /** Manually set the content of payload. If set, data will be ignored. */
  content?: string | Buffer;
  /** Stream to be pipe to the remote. If set, data and content will be ignored. */
  stream?: Readable;
  /**
   * A writable stream to be piped by the response stream.
   * Responding data will be write to this stream and callback
   * will be called with data set null after finished writing.
   */
  writeStream?: Writable;
  /** consume the writeStream, invoke the callback after writeStream close. */
  consumeWriteStream?: boolean;
  /**
    * The files will send with multipart/form-data format, base on formstream.
    * If method not set, will use POST method by default.
    */
  files?: Array<Readable | Buffer | string> | object | Readable | Buffer | string;
  /** Type of request data, could be 'json'. If it's 'json', will auto set Content-Type: 'application/json' header. */
  contentType?: string;
  /**
   * urllib default use querystring to stringify form data which don't support nested object,
   * will use qs instead of querystring to support nested object by set this option to true.
   */
  nestedQuerystring?: boolean;
  /**
   * Type of response data. Could be text or json.
   * If it's text, the callbacked data would be a String.
   * If it's json, the data of callback would be a parsed JSON Object
   * and will auto set Accept: 'application/json' header.
   * Default is buffer.
   */
  dataType?: 'text' | 'json' | 'buffer' | 'stream';
  /**
   * Let you get the res object when request connected, default false.
   * If set to true, `data` will be response readable stream.
   * Equal to `dataType = 'stream'`
   */
  streaming?: boolean;
  /** Fix the control characters (U+0000 through U+001F) before JSON parse response. Default is false. */
  fixJSONCtlChars?: boolean;
  /** Request headers. */
  headers?: Record<string, string>;
  /**
   * Request timeout in milliseconds for connecting phase and response receiving phase.
   * Defaults to exports.
   * TIMEOUT, both are 5s. You can use timeout: 5000 to tell urllib use same timeout on two phase or set them seperately such as
   * timeout: [3000, 5000], which will set connecting timeout to 3s and response 5s.
   */
  timeout?: number | number[];
  /** username:password used in HTTP Basic Authorization. */
  auth?: string;
  /** username:password used in HTTP Digest Authorization. */
  digestAuth?: string;
  /**
   * An array of strings or Buffers of trusted certificates.
   * If this is omitted several well known "root" CAs will be used, like VeriSign.
   * These are used to authorize connections.
   * Notes: This is necessary only if the server uses the self - signed certificate
   */
  ca?: string | Buffer | string[] | Buffer[];
  /**
   * If true, the server certificate is verified against the list of supplied CAs.
   * An 'error' event is emitted if verification fails.Default: true.
   */
  rejectUnauthorized?: boolean;
  /** A string or Buffer containing the private key, certificate and CA certs of the server in PFX or PKCS12 format. */
  pfx?: string | Buffer;
  /**
   * A string or Buffer containing the private key of the client in PEM format.
   * Notes: This is necessary only if using the client certificate authentication
   */
  key?: string | Buffer;
  /**
   * A string or Buffer containing the certificate key of the client in PEM format.
   * Notes: This is necessary only if using the client certificate authentication
   */
  cert?: string | Buffer;
  /** A string of passphrase for the private key or pfx. */
  passphrase?: string;
  /** A string describing the ciphers to use or exclude. */
  ciphers?: string;
  /** The SSL method to use, e.g.SSLv3_method to force SSL version 3. */
  secureProtocol?: string;
  /** follow HTTP 3xx responses as redirects. defaults to false. */
  followRedirect?: boolean;
  /** The maximum number of redirects to follow, defaults to 10. */
  maxRedirects?: number;
  /** Format the redirect url by your self. Default is url.resolve(from, to). */
  formatRedirectUrl?: (a: any, b: any) => void;
  /** Before request hook, you can change every thing here. */
  beforeRequest?: (...args: any[]) => void;
  /** Accept gzip response content and auto decode it, default is false. */
  gzip?: boolean;
  /** Enable timing or not, default is false. */
  timing?: boolean;
  /**
   * Custom DNS lookup function, default is dns.lookup.
   * Require node >= 4.0.0(for http protocol) and node >=8(for https protocol)
   */
  lookup?: LookupFunction;
  /**
   * check request address to protect from SSRF and similar attacks.
   * It receive two arguments(ip and family) and should return true or false to identified the address is legal or not.
   * It rely on lookup and have the same version requirement.
   */
  checkAddress?: (ip: string, family: number | string) => boolean;
};
