import { strict as assert } from 'node:assert';
import { once } from 'node:events';
import { createSecureServer } from 'node:http2';
import type { AddressInfo } from 'node:net';

import selfsigned from 'selfsigned';
import { describe, it, beforeAll, afterAll } from 'vite-plus/test';

import urllib, { HttpClient } from '../src/index.js';
import type { RequestOptions } from '../src/index.js';
import { startServer } from './fixtures/server.js';

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

  it.each(['request', 'curl'] as const)('should honor typed rejectUnauthorized on urllib.%s', async (method) => {
    const options: RequestOptions = {
      rejectUnauthorized: false,
      dataType: 'json',
    };
    const response = await urllib[method](_url, options);
    assert.equal(response.status, 200);
    assert.equal(response.data.method, 'GET');

    // An unverified connection must not be reused by requests that verify certificates.
    for (const rejectUnauthorized of [true, undefined]) {
      const secureOptions: RequestOptions = { rejectUnauthorized };
      await assert.rejects(urllib[method](_url, secureOptions), {
        code: 'DEPTH_ZERO_SELF_SIGNED_CERT',
      });
    }
  });

  it('should 200 with H2 on options.rejectUnauthorized = false', async () => {
    const pem = selfsigned.generate([], {
      keySize: 2048,
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
