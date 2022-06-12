import { OutgoingHttpHeaders, IncomingMessage } from 'http';

export interface HttpClientResponse<T> {
  data: T;
  status: number;
  headers: OutgoingHttpHeaders;
  res: IncomingMessage & {
    /**
     * https://eggjs.org/en/core/httpclient.html#timing-boolean
     */
    timing?: {
      queuing: number;
      dnslookup: number;
      connected: number;
      requestSent: number;
      waiting: number;
      contentDownload: number;
    }
  };
}
