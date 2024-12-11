import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    testTimeout: 60000,
    coverage: {
      include: [
        'src',
      ],
    },
    pool: 'threads',
    setupFiles: [
      'test/setup.ts'
    ],
  },
});
