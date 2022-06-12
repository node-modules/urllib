'use strict';

import assert from 'assert';
import { setTimeout } from 'timers/promises';
import urllib from '../src';
import { startServer } from './fixtures/server';

describe('keep-alive-header.test.ts', () => {
  const keepAliveTimeout = 1000;
  let _server: any;
  let _url: string;
  beforeAll(async () => {
    const { server, url } = await startServer({ keepAliveTimeout });
    _server = server;
    _url = url;
  });

  afterAll(() => {
    _server.closeAllConnections && _server.closeAllConnections();
    _server.close();
  });

  it('should handle Keep-Alive header and not throw reset error', async () => {
    let count = 0;
    while (count < 6) {
      count++;
      const response = await urllib.request(_url);
      assert.equal(response.status, 200);
      // console.log(response.headers);
      assert(response.headers.connection === 'keep-alive');
      assert(response.headers['keep-alive'] === 'timeout=1');
      await setTimeout(keepAliveTimeout);
    }
  });
});
