import { strict as assert } from 'node:assert';

import { describe, it, beforeAll, afterAll } from 'vite-plus/test';

import urllib from '../src/index.js';
import type { RequestOptions } from '../src/index.js';
import { startServer } from './fixtures/server.js';

describe('options.rejectUnauthorized.typecheck.test.ts', () => {
  let close: any;
  let _url: string;
  beforeAll(async () => {
    const { closeServer, url } = await startServer({ https: true });
    close = closeServer;
    _url = url;
  });

  afterAll(async () => {
    await close();
  });

  it('should accept rejectUnauthorized on RequestOptions type', async () => {
    // Type check: rejectUnauthorized should be assignable on RequestOptions
    const options: RequestOptions = {
      rejectUnauthorized: false,
      dataType: 'json',
    };
    const response = await urllib.request(_url, options);
    assert.equal(response.status, 200);
    assert.equal(response.data.method, 'GET');
  });

  it('should accept rejectUnauthorized = true on RequestOptions type', async () => {
    const options: RequestOptions = {
      rejectUnauthorized: true,
      dataType: 'json',
    };
    await assert.rejects(
      async () => {
        await urllib.request(_url, options);
      },
      (err: any) => {
        assert.match(err.message, /signed certificate/);
        return true;
      },
    );
  });
});
