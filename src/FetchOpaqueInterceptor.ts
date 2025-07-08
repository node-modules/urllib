// const { AsyncLocalStorage } = require('node:async_hooks');
import { AsyncLocalStorage } from 'node:async_hooks';
import symbols from './symbols.js';

// const RedirectHandler = require('../handler/redirect-handler')

export interface FetchOpaque {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  [symbols.kRequestId]: number;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  [symbols.kRequestStartTime]: number;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  [symbols.kEnableRequestTiming]: boolean;
}

// const internalOpaque = {
//   [symbols.kRequestId]: requestId,
//   [symbols.kRequestStartTime]: requestStartTime,
//   [symbols.kEnableRequestTiming]: !!(init.timing ?? true),
//   [symbols.kRequestTiming]: timing,
//   // [symbols.kRequestOriginalOpaque]: originalOpaque,
// };

export interface OpaqueInterceptorOptions {
  opaqueLocalStorage: AsyncLocalStorage<FetchOpaque>;
}
