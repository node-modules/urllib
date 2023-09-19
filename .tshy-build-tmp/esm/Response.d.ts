/// <reference types="node" resolution-mode="require"/>
import type { Readable } from 'node:stream';
import type { IncomingHttpHeaders } from './IncomingHttpHeaders.js';
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
    queuing: number;
    connected: number;
    requestHeadersSent: number;
    requestSent: number;
    waiting: number;
    contentDownload: number;
};
export type RawResponseWithMeta = Readable & {
    status: number;
    statusCode: number;
    statusText: string;
    headers: IncomingHttpHeaders;
    timing: Timing;
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
    statusCode: number;
    statusText: string;
    headers: IncomingHttpHeaders;
    url: string;
    redirected: boolean;
    requestUrls: string[];
    res: RawResponseWithMeta;
};
