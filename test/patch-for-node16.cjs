// vitest require structuredClone
if (!('structuredClone' in globalThis)) {
  const structuredClone = require('@ungap/structured-clone').default;

  globalThis.structuredClone = structuredClone;
  // console.debug('patched structuredClone for Node.js %s', process.version);
}

// vitest require crypto.getRandomValues
const crypto = require('node:crypto');
if (typeof crypto.getRandomValues !== 'function') {
  crypto.getRandomValues = crypto.webcrypto.getRandomValues.bind(crypto.webcrypto);
}
