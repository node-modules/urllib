import { Readable } from 'stream';
import { IncomingHttpHeaders } from 'http';

export type HttpClientResponseMeta = {
  status: number;
  statusCode: number;
  headers: IncomingHttpHeaders;
  size: number;
  aborted: boolean;
  rt: number;
  keepAliveSocket: boolean;
  requestUrls: string[];
  /**
   * https://eggjs.org/en/core/httpclient.html#timing-boolean
   */
  timing: {
    contentDownload: number;
    waiting: number;
  };
  // remoteAddress: remoteAddress,
  // remotePort: remotePort,
  // socketHandledRequests: socketHandledRequests,
  // socketHandledResponses: socketHandledResponses,
};

export type ReadableWithMeta = Readable & {
  status: number;
  statusCode: number;
  headers: IncomingHttpHeaders;
};

export type HttpClientResponse = {
  opaque: unknown;
  data: any
  status: number;
  // alias to status, keep compatibility
  statusCode: number;
  headers: IncomingHttpHeaders;
  url: string;
  redirected: boolean;
  requestUrls: string[];
  res: ReadableWithMeta | HttpClientResponseMeta;
};
