import { AsyncLocalStorage } from 'node:async_hooks';

import { Agent, Dispatcher } from 'undici';

import type { FetchOpaque } from './FetchOpaqueInterceptor.js';

export interface BaseAgentOptions extends Agent.Options {
  opaqueLocalStorage?: AsyncLocalStorage<FetchOpaque>;
}

export class BaseAgent extends Agent {
  #opaqueLocalStorage?: AsyncLocalStorage<FetchOpaque>;

  constructor(options: BaseAgentOptions) {
    super(options);
    this.#opaqueLocalStorage = options.opaqueLocalStorage;
  }

  dispatch(options: Agent.DispatchOptions, handler: Dispatcher.DispatchHandler): boolean {
    const opaque = this.#opaqueLocalStorage?.getStore();
    if (opaque) {
      (handler as any).opaque = opaque;
    }
    return super.dispatch(options, handler);
  }
}
