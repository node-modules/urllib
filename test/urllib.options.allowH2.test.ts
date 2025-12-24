import { strict as assert } from 'node:assert';

import { describe, it } from 'vitest';

import urllib from '../src/index.js';

describe('urllib.options.allowH2.test.ts', () => {
  it('should 200 on options.allowH2 = true', async () => {
    let response = await urllib.request('https://registry.npmmirror.com', {
      allowH2: true,
      dataType: 'json',
      retry: 3,
      timeout: 30000,
    });
    assert.equal(response.status, 200);

    response = await urllib.curl('https://registry.npmmirror.com', {
      allowH2: true,
      dataType: 'json',
      retry: 3,
      timeout: 30000,
    });
    assert.equal(response.status, 200);
  });
});
