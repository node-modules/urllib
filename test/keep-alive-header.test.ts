import { describe, it, beforeAll, afterAll } from 'vitest';
import { strict as assert } from 'assert';
import urllib from '../src';
import { startServer } from './fixtures/server';
import { sleep } from './utils';

describe('keep-alive-header.test.ts', () => {
  const keepAliveTimeout = 2000;
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
    // const max = process.env.CI && process.platform !== 'win32' ? 10 : 2;
    const max = 2;
    while (count < max) {
      count++;
      let response = await urllib.request(_url);
      assert.equal(response.status, 200);
      // console.log(response.headers);
      assert.equal(response.headers.connection, 'keep-alive');
      assert.equal(response.headers['keep-alive'], 'timeout=2');
      response = await urllib.request(_url);
      assert.equal(response.status, 200);
      // console.log(response.headers);
      assert.equal(response.headers.connection, 'keep-alive');
      assert.equal(response.headers['keep-alive'], 'timeout=2');
      response = await urllib.request(_url);
      assert.equal(response.status, 200);
      // console.log(response.headers);
      assert.equal(response.headers.connection, 'keep-alive');
      assert.equal(response.headers['keep-alive'], 'timeout=2');
      response = await urllib.request(_url);
      assert.equal(response.status, 200);
      // console.log(response.headers);
      assert.equal(response.headers.connection, 'keep-alive');
      assert.equal(response.headers['keep-alive'], 'timeout=2');
      response = await urllib.request(_url);
      assert.equal(response.status, 200);
      // console.log(response.headers);
      assert.equal(response.headers.connection, 'keep-alive');
      assert.equal(response.headers['keep-alive'], 'timeout=2');
      assert(parseInt(response.headers['x-requests-persocket'] as string) > 1);
      await sleep(keepAliveTimeout);
    }
  });
});
