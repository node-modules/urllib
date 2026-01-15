import { strict as assert } from 'node:assert';
import { setTimeout as sleep } from 'node:timers/promises';

import { describe, it, beforeAll, afterAll } from 'vite-plus/test';

import { HttpClient } from '../src/index.js';
import { startServer } from './fixtures/server.js';
import { isWindows } from './utils.js';

describe('keep-alive-header.test.ts', () => {
  // should shorter than server keepalive timeout
  // https://zhuanlan.zhihu.com/p/34147188
  const keepAliveTimeout = 2000;
  const httpClient = new HttpClient();
  let close: any;
  let _url: string;
  beforeAll(async () => {
    const { closeServer, url } = await startServer({ keepAliveTimeout });
    close = closeServer;
    _url = url;
  });

  afterAll(async () => {
    await close();
  });

  it('should handle Keep-Alive header and not throw reset error on 1s keepalive agent', async () => {
    let count = 0;
    const max = process.env.TEST_KEEPALIVE_COUNT ? parseInt(process.env.TEST_KEEPALIVE_COUNT) : 3;
    let otherSideClosed = 0;
    let readECONNRESET = 0;
    const origin = _url.substring(0, _url.length - 1);
    while (count < max) {
      count++;
      try {
        const task = httpClient.request(_url);
        // console.log('after request stats: %o', httpClient.getDispatcherPoolStats());
        if (httpClient.getDispatcherPoolStats()[origin]) {
          if (!isWindows()) {
            // ignore on windows
            assert.equal(httpClient.getDispatcherPoolStats()[origin].pending, 1);
            assert.equal(httpClient.getDispatcherPoolStats()[origin].size, 1);
          }
        }
        let response = await task;
        // console.log('after response stats: %o', httpClient.getDispatcherPoolStats());
        if (httpClient.getDispatcherPoolStats()[origin]) {
          assert.equal(httpClient.getDispatcherPoolStats()[origin].pending, 0);
          // assert.equal(httpClient.getDispatcherPoolStats()[origin].connected, 1);
          assert.equal(httpClient.getDispatcherPoolStats()[origin].connected, 0);
        }
        // console.log(response.res.socket);
        assert.equal(response.status, 200);
        // console.log(response.headers);
        assert.equal(response.headers.connection, 'keep-alive');
        assert.equal(response.headers['keep-alive'], 'timeout=2');
        response = await httpClient.request(_url);
        assert.equal(response.status, 200);
        // console.log(response.headers);
        assert.equal(response.headers.connection, 'keep-alive');
        assert.equal(response.headers['keep-alive'], 'timeout=2');
        response = await httpClient.request(_url);
        assert.equal(response.status, 200);
        // console.log(response.headers);
        assert.equal(response.headers.connection, 'keep-alive');
        assert.equal(response.headers['keep-alive'], 'timeout=2');
        response = await httpClient.request(_url);
        assert.equal(response.status, 200);
        // console.log(response.headers);
        assert.equal(response.headers.connection, 'keep-alive');
        assert.equal(response.headers['keep-alive'], 'timeout=2');
        response = await httpClient.request(_url);
        assert.equal(response.status, 200);
        assert.equal(response.headers.connection, 'keep-alive');
        assert.equal(response.headers['keep-alive'], 'timeout=2');
        response = await httpClient.request(_url);
        assert.equal(response.status, 200);
        assert.equal(response.headers.connection, 'keep-alive');
        assert.equal(response.headers['keep-alive'], 'timeout=2');
        response = await httpClient.request(_url);
        assert.equal(response.status, 200);
        assert.equal(response.headers.connection, 'keep-alive');
        assert.equal(response.headers['keep-alive'], 'timeout=2');
        response = await httpClient.request(_url);
        assert.equal(response.status, 200);
        assert.equal(response.headers.connection, 'keep-alive');
        assert.equal(response.headers['keep-alive'], 'timeout=2');
        response = await httpClient.request(_url);
        assert.equal(response.status, 200);
        // console.log(response.headers);
        assert.equal(response.headers.connection, 'keep-alive');
        assert.equal(response.headers['keep-alive'], 'timeout=2');
        assert(
          parseInt(response.headers['x-requests-persocket'] as string) >= 1,
          response.headers['x-requests-persocket'] as string,
        );
        await sleep(keepAliveTimeout / 2);
        response = await httpClient.request(_url);
        // console.log(response.res.socket);
        assert.equal(response.status, 200);
        // console.log(response.headers);
        assert.equal(response.headers.connection, 'keep-alive');
        assert.equal(response.headers['keep-alive'], 'timeout=2');
        response = await httpClient.request(_url);
        assert.equal(response.status, 200);
        // console.log(response.headers);
        assert.equal(response.headers.connection, 'keep-alive');
        assert.equal(response.headers['keep-alive'], 'timeout=2');
        response = await httpClient.request(_url);
        assert.equal(response.status, 200);
        // console.log(response.headers);
        assert.equal(response.headers.connection, 'keep-alive');
        assert.equal(response.headers['keep-alive'], 'timeout=2');
        response = await httpClient.request(_url);
        assert.equal(response.status, 200);
        // console.log(response.headers);
        assert.equal(response.headers.connection, 'keep-alive');
        assert.equal(response.headers['keep-alive'], 'timeout=2');
        response = await httpClient.request(_url);
        assert.equal(response.status, 200);
        assert.equal(response.headers.connection, 'keep-alive');
        assert.equal(response.headers['keep-alive'], 'timeout=2');
        response = await httpClient.request(_url);
        assert.equal(response.status, 200);
        assert.equal(response.headers.connection, 'keep-alive');
        assert.equal(response.headers['keep-alive'], 'timeout=2');
        response = await httpClient.request(_url);
        assert.equal(response.status, 200);
        assert.equal(response.headers.connection, 'keep-alive');
        assert.equal(response.headers['keep-alive'], 'timeout=2');
        response = await httpClient.request(_url);
        assert.equal(response.status, 200);
        assert.equal(response.headers.connection, 'keep-alive');
        assert.equal(response.headers['keep-alive'], 'timeout=2');
        response = await httpClient.request(_url);
        assert.equal(response.status, 200);
        // console.log(response.headers);
        assert.equal(response.headers.connection, 'keep-alive');
        assert.equal(response.headers['keep-alive'], 'timeout=2');
        assert(
          parseInt(response.headers['x-requests-persocket'] as string) >= 1,
          response.headers['x-requests-persocket'] as string,
        );
        // console.log('before sleep stats: %o', httpClient.getDispatcherPoolStats());
        // { connected: 2, free: 1, pending: 0, queued: 0, running: 0, size: 0 }
        // assert.equal(httpClient.getDispatcherPoolStats()[origin].connected, 2);
        if (httpClient.getDispatcherPoolStats()[origin]) {
          assert.equal(httpClient.getDispatcherPoolStats()[origin].connected, 0);
          // assert.equal(httpClient.getDispatcherPoolStats()[origin].free, 1);
          assert.equal(httpClient.getDispatcherPoolStats()[origin].free, 0);
        }
        await sleep(keepAliveTimeout);
        // console.log('after sleep stats: %o', httpClient.getDispatcherPoolStats());
        // clients maybe all gone => after sleep stats: {}
        // { connected: 0, free: 0, pending: 0, queued: 0, running: 0, size: 0 }
        // { connected: 1, free: 1, pending: 0, queued: 0, running: 0, size: 0 }
        // { connected: 2, free: 2, pending: 0, queued: 0, running: 0, size: 0 }
        if (Object.keys(httpClient.getDispatcherPoolStats()).length > 0) {
          assert(httpClient.getDispatcherPoolStats()[origin].connected <= 2);
          assert(httpClient.getDispatcherPoolStats()[origin].free <= 2);
          assert.equal(httpClient.getDispatcherPoolStats()[origin].size, 0);
        }
      } catch (err: any) {
        if (err.message === 'other side closed') {
          console.log(err);
          otherSideClosed++;
        } else if (err.message === 'read ECONNRESET') {
          console.log(err);
          readECONNRESET++;
        } else {
          throw err;
        }
      }
    }
    if (otherSideClosed || readECONNRESET) {
      console.log('otherSideClosed: %d, readECONNRESET: %d', otherSideClosed, readECONNRESET);
    }
    assert.equal(otherSideClosed, 0);
    assert.equal(readECONNRESET, 0);
  });
});
