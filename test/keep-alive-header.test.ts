import assert from 'assert/strict';
import { setTimeout } from 'timers/promises';
import urllib from '../src';
import { startServer } from './fixtures/server';

describe('keep-alive-header.test.ts', () => {
  const keepAliveTimeout = 1000;
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
    const max = process.env.CI ? 10 : 2;
    while (count < max) {
      count++;
      const response = await urllib.request(_url);
      assert.equal(response.status, 200);
      // console.log(response.headers);
      assert.equal(response.headers.connection, 'keep-alive');
      assert.equal(response.headers['keep-alive'], 'timeout=1');
      await setTimeout(keepAliveTimeout);
    }
  });
});
