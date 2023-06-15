import { Readable } from 'node:stream';
import { IncomingHttpHeaders } from 'node:http';

export type SocketInfo = {
  id: number;
  localAddress: string;
  localPort: number;
  remoteAddress: string;
  remotePort: number;
  remoteFamily: string;
  bytesWritten: number;
  bytesRead: number;
  handledRequests: number;
  handledResponses: number;
  connectedTime?: Date;
  lastRequestEndTime?: Date;
};

/**
 * https://eggjs.org/en/core/httpclient.html#timing-boolean
 */
export type Timing = {
  // socket assigned
  queuing: number;
  // dns lookup time
  // dnslookup: number;
  // socket connected
  connected: number;
  // request headers sent
  requestHeadersSent: number;
  // request sent, including headers and body
  requestSent: number;
  // Time to first byte (TTFB), the response headers have been received
  waiting: number;
  // the response body and trailers have been received
  contentDownload: number;
};

export type RawResponseWithMeta = Readable & {
  status: number;
  statusCode: number;
  statusText: string;
  headers: IncomingHttpHeaders;
  timing: Timing;
  // SocketInfo
  socket: SocketInfo;
  size: number;
  aborted: boolean;
  rt: number;
  keepAliveSocket: boolean;
  requestUrls: string[];
  retries: number;
  socketErrorRetries: number;
};

export type HttpClientResponse<T = any> = {
  opaque: unknown;
  data: T;
  status: number;
  // alias to status, keep compatibility
  statusCode: number;
  statusText: string;
  headers: IncomingHttpHeaders;
  url: string;
  redirected: boolean;
  requestUrls: string[];
  res: RawResponseWithMeta;
};
