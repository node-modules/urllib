import { strict as assert } from 'node:assert';
import { describe, it, beforeAll, afterAll } from 'vitest';
import urllib from '../src';
import { startServer } from './fixtures/server';
import { sleep } from './utils';

describe('keep-alive-header.test.ts', () => {
  const keepAliveTimeout = 2000;
  // should shorter than server keepalive timeout
  // https://zhuanlan.zhihu.com/p/34147188
  const clientKeepAliveTimeout = keepAliveTimeout - 500;
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

  it('should handle Keep-Alive header and not throw reset error', async () => {
    let count = 0;
    const max = process.env.TEST_KEEPALIVE_COUNT ? parseInt(process.env.TEST_KEEPALIVE_COUNT) : 10;
    let otherSideClosed = 0;
    let readECONNRESET = 0;
    while (count < max) {
      count++;
      try {
        let response = await urllib.request(_url, {
          keepAliveTimeout: clientKeepAliveTimeout,
        });
        assert.equal(response.status, 200);
        // console.log(response.headers);
        assert.equal(response.headers.connection, 'keep-alive');
        assert.equal(response.headers['keep-alive'], 'timeout=2');
        response = await urllib.request(_url, {
          keepAliveTimeout: clientKeepAliveTimeout,
        });
        assert.equal(response.status, 200);
        // console.log(response.headers);
        assert.equal(response.headers.connection, 'keep-alive');
        assert.equal(response.headers['keep-alive'], 'timeout=2');
        response = await urllib.request(_url, {
          keepAliveTimeout: clientKeepAliveTimeout,
        });
        assert.equal(response.status, 200);
        // console.log(response.headers);
        assert.equal(response.headers.connection, 'keep-alive');
        assert.equal(response.headers['keep-alive'], 'timeout=2');
        response = await urllib.request(_url, {
          keepAliveTimeout: clientKeepAliveTimeout,
        });
        assert.equal(response.status, 200);
        // console.log(response.headers);
        assert.equal(response.headers.connection, 'keep-alive');
        assert.equal(response.headers['keep-alive'], 'timeout=2');
        response = await urllib.request(_url, {
          keepAliveTimeout: clientKeepAliveTimeout,
        });
        assert.equal(response.status, 200);
        // console.log(response.headers);
        assert.equal(response.headers.connection, 'keep-alive');
        assert.equal(response.headers['keep-alive'], 'timeout=2');
        assert(parseInt(response.headers['x-requests-persocket'] as string) > 1);
        await sleep(keepAliveTimeout);
      } catch (err) {
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
      console.log('otherSideClosed: %d, readECONNRESET: %d',
        otherSideClosed, readECONNRESET);
    }
    assert.equal(otherSideClosed, 0);
    assert.equal(readECONNRESET, 0);
  });
});
