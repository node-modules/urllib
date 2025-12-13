import { strict as assert } from 'node:assert';
import { once } from 'node:events';
import { createSecureServer } from 'node:http2';
import type { AddressInfo } from 'node:net';

import selfsigned from 'selfsigned';
import { describe, it, beforeAll, afterAll } from 'vitest';

import urllib, { HttpClient } from '../src/index.js';
import { startServer } from './fixtures/server.js';
import { nodeMajorVersion } from './utils.js';

describe('urllib.options.rejectUnauthorized-false.test.ts', () => {
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

  it('should 200 on options.rejectUnauthorized = false', async () => {
    const response = await urllib.request(_url, {
      rejectUnauthorized: false,
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    assert.equal(response.data.method, 'GET');
  });

  it('should 200 with H2 on options.rejectUnauthorized = false', async () => {
    const pem = selfsigned.generate([], {
      keySize: nodeMajorVersion() >= 22 ? 2048 : 1024,
    });
    const server = createSecureServer({
      key: pem.private,
      cert: pem.cert,
    });

    server.on('stream', (stream, headers) => {
      assert.equal(headers[':method'], 'GET');
      stream.respond({
        'content-type': 'text/plain; charset=utf-8',
        'x-custom-h2': 'hello',
        ':status': 200,
      });
      stream.end('hello h2!');
    });

    server.listen(0);
    await once(server, 'listening');

    const httpClient = new HttpClient({
      allowH2: true,
      connect: {
        rejectUnauthorized: false,
      },
    });

    const url = `https://localhost:${(server.address() as AddressInfo).port}`;
    const response1 = await httpClient.request(url, {});
    assert.equal(response1.status, 200);
    assert.equal(response1.data.toString(), 'hello h2!');

    const response2 = await urllib.request(url, {
      rejectUnauthorized: false,
      allowH2: true,
      dataType: 'text',
    });
    assert.equal(response2.status, 200);
    assert.equal(response2.data, 'hello h2!');
  });
});
