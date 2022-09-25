import { describe, it, beforeAll, afterAll } from 'vitest';
import { strict as assert } from 'assert';
import urllib from '../src';
import { startServer } from './fixtures/server';

describe('options.timeout.test.ts', () => {
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

  it('should HeadersTimeout 10ms throw error', async () => {
    await assert.rejects(async () => {
      await urllib.request(`${_url}?timeout=100`, {
        timeout: 10,
      });
    }, (err: any) => {
      // console.error(err);
      assert.equal(err.name, 'HttpClientRequestTimeoutError');
      assert.equal(err.message, 'Request timeout for 10 ms');
      if (err.cause) {
        // not work on Node.js 14
        assert.equal(err.cause.name, 'HeadersTimeoutError');
        assert.equal(err.cause.message, 'Headers Timeout Error');
        assert.equal(err.cause.code, 'UND_ERR_HEADERS_TIMEOUT');
      }
     
      assert.equal(err.res.status, -1);
      assert(err.res.rt > 10, `actual ${err.res.rt}`);
      assert.equal(typeof err.res.rt, 'number');
      return true;
    });
  });

  it('should BodyTimeout throw error', async () => {
    await assert.rejects(async () => {
      await urllib.request(`${_url}mock-bytes?timeout=300`, {
        timeout: 100,
      });
    }, (err: any) => {
      // console.error(err);
      assert.equal(err.name, 'HttpClientRequestTimeoutError');
      assert.equal(err.message, 'Request timeout for 100 ms');
      if (err.cause) {
        assert.equal(err.cause.name, 'BodyTimeoutError');
        assert.equal(err.cause.message, 'Body Timeout Error');
        assert.equal(err.cause.code, 'UND_ERR_BODY_TIMEOUT');
      }
      assert.equal(err.res.status, 200);
      return true;
    });
  });

  it('should timeout 50ms throw error', async () => {
    await assert.rejects(async () => {
      const response = await urllib.request(`${_url}mock-bytes?timeout=1000`, {
        timeout: [ 10, 50 ],
      });
      console.log(response.status, response.headers, response.data);
    }, (err: any) => {
      // console.log(err);
      assert.equal(err.name, 'HttpClientRequestTimeoutError');
      assert.equal(err.message, 'Request timeout for 50 ms');
      assert.equal(err.res.status, 200);
      err.cause && assert.equal(err.cause.name, 'BodyTimeoutError');
      return true;
    });
  });

  it('should timeout on server block', async () => {
    await assert.rejects(async () => {
      await urllib.request(`${_url}block`, {
        timeout: 100,
      });
    }, (err: any) => {
      // console.log(err);
      assert.equal(err.name, 'HttpClientRequestTimeoutError');
      assert.equal(err.message, 'Request timeout for 100 ms');
      assert.equal(err.res.status, -1);
      err.cause && assert.equal(err.cause.name, 'HeadersTimeoutError');
      return true;
    });
  });
});
