import { strict as assert } from 'node:assert';

import { describe, it, beforeAll, afterAll } from 'vitest';

import { HttpClient } from '../src/index.js';
import { startServer } from './fixtures/server.js';

describe('HttpClient.connect.rejectUnauthorized.test.ts', () => {
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

  it('should throw error on rejectUnauthorized = true', async () => {
    const httpclient = new HttpClient({
      connect: {
        rejectUnauthorized: true,
      },
    });

    await assert.rejects(
      async () => {
        const response = await httpclient.request(_url);
        console.log(response.status, response.headers, response.data);
      },
      (err: any) => {
        // console.error(err);
        assert.equal(err.name, 'Error');
        assert.match(err.message, /signed certificate/);
        assert.equal(err.code, 'DEPTH_ZERO_SELF_SIGNED_CERT');
        assert.equal(err.res.status, -1);
        return true;
      },
    );
  });

  it('should throw error on rejectUnauthorized = undefined', async () => {
    const httpclient = new HttpClient();

    await assert.rejects(
      async () => {
        const response = await httpclient.request(_url);
        console.log(response.status, response.headers, response.data);
      },
      (err: any) => {
        // console.error(err);
        assert.equal(err.name, 'Error');
        assert.match(err.message, /signed certificate/);
        assert.equal(err.code, 'DEPTH_ZERO_SELF_SIGNED_CERT');
        assert.equal(err.res.status, -1);
        return true;
      },
    );
  });

  it('should 200 on rejectUnauthorized = false', async () => {
    const httpclient = new HttpClient({
      connect: {
        rejectUnauthorized: false,
      },
    });

    const response = await httpclient.request(_url, {
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    assert.equal(response.data.method, 'GET');
  });
});
