const structuredClone = require('@ungap/structured-clone').default;

// vitest require structuredClone
if (!('structuredClone' in globalThis)) {
  globalThis.structuredClone = structuredClone;
  // console.debug('patched structuredClone for Node.js %s', process.version);
}
