import { strict as assert } from 'node:assert';

import { describe, it, beforeAll, afterAll } from 'vitest';

import urllib from '../src/index.js';
import { startServer } from './fixtures/server.js';

describe('options.type.test.ts', () => {
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

  it('should default set type GET', async () => {
    const { status, data } = await urllib.request(_url, {
      dataType: 'json',
      type: 'GET',
    });
    assert.equal(status, 200);
    assert.equal(data.method, 'GET');
  });

  it('should set type POST', async () => {
    const { status, data } = await urllib.request(_url, {
      dataType: 'json',
      type: 'POST',
    });
    assert.equal(status, 200);
    assert.equal(data.method, 'POST');
  });
});
