import { Agent, Dispatcher, getGlobalDispatcher, setGlobalDispatcher } from 'undici';

// Under the Vitest worker runtime, Node's built-in undici (`node:internal/deps/undici`)
// can win the shared global dispatcher symbol (`Symbol.for('undici.globalDispatcher.1')`)
// before this package's npm `undici` initializes. When that happens, npm undici's
// `getGlobalDispatcher()` returns a cross-version wrapper around the built-in dispatcher,
// so requests are serviced by the built-in undici whose diagnostics-channel events do not
// carry urllib's `opaque`. The result is that request timing/tracing data is never
// populated, breaking the timing/diagnostics/keepalive/redirect tests.
//
// Real-world (plain `node`) usage is unaffected because npm undici wins the symbol when it
// imports first, so the fix belongs in the test environment. Re-establish npm undici's own
// dispatcher whenever the active one is not a real npm undici `Dispatcher`.
if (!(getGlobalDispatcher() instanceof Dispatcher)) {
  setGlobalDispatcher(new Agent());
}
