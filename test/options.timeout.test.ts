import assert from 'assert/strict';
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

  it('should timeout 1ms throw error', async () => {
    await assert.rejects(async () => {
      await urllib.request(`${_url}?timeout=10`, {
        timeout: 1,
      });
    }, (err: any) => {
      assert.equal(err.name, 'HttpClientRequestTimeoutError');
      assert.equal(err.message, 'Request timeout for 1 ms');
      return true;
    });
  });

  it('should timeout 50ms throw error', async () => {
    await assert.rejects(async () => {
      const response = await urllib.request(`${_url}?timeout=1000`, {
        timeout: [ 1, 50 ],
      });
      console.log(response.status, response.headers, response.data);
    }, (err: any) => {
      // console.log(err);
      assert.equal(err.name, 'HttpClientRequestTimeoutError');
      assert.equal(err.message, 'Request timeout for 50 ms');
      assert.equal(err.res.status, -1);
      assert.equal(err.cause.name, 'AbortError');
      return true;
    });
  });
});
