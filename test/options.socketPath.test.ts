import { strict as assert } from 'node:assert';

import { describe, it, beforeAll, afterAll } from 'vitest';

import urllib from '../src/index.js';
import { startServer } from './fixtures/socket_server.js';
import { isWindows } from './utils.js';

describe.skipIf(isWindows())('options.socketPath.test.ts', () => {
  let close: any;
  let _url: string;
  let _socketPath: string;
  let server2: any;
  beforeAll(async () => {
    const { url, closeServer, socketPath } = await startServer();
    close = closeServer;
    _url = url;
    _socketPath = socketPath;
    server2 = await startServer();
  });

  afterAll(async () => {
    await close();
    await server2?.closeServer();
  });

  it('should request socket successfully', async () => {
    let result = await urllib.request(_url, {
      socketPath: _socketPath,
      contentType: 'json',
      dataType: 'json',
    });

    assert.deepStrictEqual(result.data, { a: 1 });
    result = await urllib.request(_url, {
      socketPath: _socketPath,
      contentType: 'json',
      dataType: 'json',
    });
    assert.deepStrictEqual(result.data, { a: 1 });
    result = await urllib.request(_url, {
      socketPath: _socketPath,
      contentType: 'json',
      dataType: 'json',
    });
    assert.deepStrictEqual(result.data, { a: 1 });
    assert(result.res.socket.handledResponses > 1);

    result = await urllib.request('http://unix/api/v1', {
      socketPath: server2.socketPath,
      contentType: 'json',
      dataType: 'json',
    });
    assert.deepStrictEqual(result.data, { a: 1 });
    assert.equal(result.url, 'http://unix/api/v1');

    result = await urllib.request(_url, {
      socketPath: _socketPath,
      contentType: 'json',
      dataType: 'json',
    });
    assert.deepStrictEqual(result.data, { a: 1 });
    assert.equal(result.url, _url);

    // request normal tcp should work
    const host = process.env.CI ? 'registry.npmjs.org' : 'registry.npmmirror.com';
    const url = `${host}/urllib/latest`;
    const result2 = await urllib.request(url, {
      dataType: 'json',
    });
    assert.equal(result2.status, 200);
    assert.equal(result2.data.name, 'urllib');
  });
});
