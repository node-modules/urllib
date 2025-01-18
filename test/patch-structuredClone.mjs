import structuredClone from '@ungap/structured-clone';

// vitest require structuredClone
if (!('structuredClone' in globalThis)) {
  globalThis.structuredClone = structuredClone;
}
