import { AsyncLocalStorage } from 'node:async_hooks';
import type { InternalStore } from './Response.js';

export const asyncLocalStorage = new AsyncLocalStorage<InternalStore>();
