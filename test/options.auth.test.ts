import { strict as assert } from 'node:assert';

import { describe, it, beforeAll, afterAll } from 'vitest';

import urllib from '../src/index.js';
import { startServer } from './fixtures/server.js';

describe('options.auth.test.ts', () => {
  let close: any;
  let _url: string;
  beforeAll(async () => {
    const { closeServer, url } = await startServer();
    close = closeServer;
    _url = url;
  });

  afterAll(async () => {
    await close();
  });

  it('should work', async () => {
    const response = await urllib.request(`${_url}auth`, {
      auth: 'user:pwd',
      dataType: 'json',
      timing: true,
    });
    assert.equal(response.status, 200);
    assert.deepEqual(response.data, {
      user: 'user',
      password: 'pwd',
    });
  });
});
