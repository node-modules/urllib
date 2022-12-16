import { Readable } from 'stream';
import { IncomingHttpHeaders, IncomingMessage } from 'http';

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

export type BaseResponseMeta = IncomingMessage & {
  status: number;
  timing: Timing;
  // SocketInfo
  socket: SocketInfo;
};

export type HttpClientResponseMeta = BaseResponseMeta & {
  size: number;
  aborted: boolean;
  rt: number;
  keepAliveSocket: boolean;
  requestUrls: string[];
};

export type ReadableWithMeta = Readable & BaseResponseMeta;

export type HttpClientResponse = {
  opaque: unknown;
  data: any;
  status: number;
  // alias to status, keep compatibility
  statusCode: number;
  headers: IncomingHttpHeaders;
  url: string;
  redirected: boolean;
  requestUrls: string[];
  res: ReadableWithMeta | HttpClientResponseMeta;
};
