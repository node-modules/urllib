import { Agent, Dispatcher, getGlobalDispatcher, setGlobalDispatcher } from 'undici';

// On Node.js >= 26 the runtime ships its own (newer) built-in undici. Under the
// Vitest fork pool that built-in undici can win the shared global dispatcher
// symbol (`Symbol.for('undici.globalDispatcher.1')`) before this package's
// undici is loaded. When that happens `getGlobalDispatcher()` returns a
// cross-version compatibility wrapper (`Dispatcher1Wrapper`) whose handler is a
// `LegacyHandlerWrapper` that keeps the request `opaque` in private fields,
// hiding it from our diagnostics_channel instrumentation. As a result request
// timing and socket tracing silently stop working in tests.
//
// Real-world usage is not affected: when an application imports this package
// (and therefore undici) the npm undici wins the global dispatcher symbol. Reset
// the global dispatcher here so the test environment matches that behaviour.
if (!(getGlobalDispatcher() instanceof Dispatcher)) {
  setGlobalDispatcher(new Agent());
}
