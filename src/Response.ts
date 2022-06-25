import { ReadableStream } from 'stream/web';
import { Readable } from 'stream';

export type HttpClientResponseMeta = {
  status: number;
  statusCode: number;
  statusMessage: string;
  headers: Record<string, string>;
  size: number;
  aborted: boolean;
  rt: number;
  keepAliveSocket: boolean;
  requestUrls: string[],
  /**
   * https://eggjs.org/en/core/httpclient.html#timing-boolean
   */
  timing: {
    contentDownload: number;
  };
  // remoteAddress: remoteAddress,
  // remotePort: remotePort,
  // socketHandledRequests: socketHandledRequests,
  // socketHandledResponses: socketHandledResponses,
};

export type ReadableStreamWithMeta = (Readable | ReadableStream) & {
  status: number;
  statusCode: number;
  statusMessage: string;
  headers: Record<string, string>;
};

export type HttpClientResponse = {
  data: any;
  status: number;
  headers: Record<string, string>;
  url: string;
  redirected: boolean;
  res: ReadableStreamWithMeta | HttpClientResponseMeta;
};
