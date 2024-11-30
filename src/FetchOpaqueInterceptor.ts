// const { AsyncLocalStorage } = require('node:async_hooks');
import { AsyncLocalStorage } from 'node:async_hooks';
import symbols from './symbols.js';
import { Dispatcher } from 'undici';

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
  [symbols.kEnableRequestTiming]: number;
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

export function fetchOpaqueInterceptor(opts: OpaqueInterceptorOptions) {
  const opaqueLocalStorage = opts?.opaqueLocalStorage;
  return (dispatch: Dispatcher['dispatch']): Dispatcher['dispatch'] => {
    return function redirectInterceptor(opts: Dispatcher.DispatchOptions, handler: Dispatcher.DispatchHandler) {
      const opaque = opaqueLocalStorage?.getStore();
      (handler as any).opaque = opaque;
      return dispatch(opts, handler);
    };
  };
}
