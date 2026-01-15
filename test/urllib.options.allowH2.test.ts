import { strict as assert } from 'node:assert';

import { describe, it } from 'vite-plus/test';

import urllib from '../src/index.js';

describe('urllib.options.allowH2.test.ts', () => {
  it('should 200 on options.allowH2 = true', async () => {
    const url = process.env.CI ? 'https://registry.npmjs.org' : 'https://registry.npmmirror.com';
    let response = await urllib.request(url, {
      allowH2: true,
      dataType: 'json',
      retry: 3,
      timeout: 30000,
    });
    assert.equal(response.status, 200);

    response = await urllib.curl(url, {
      allowH2: true,
      dataType: 'json',
      retry: 3,
      timeout: 30000,
    });
    assert.equal(response.status, 200);
  });
});
