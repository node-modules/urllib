import { strict as assert } from 'node:assert';
import { pipeline } from 'node:stream';
import { createBrotliDecompress } from 'node:zlib';

import { describe, it, beforeEach, afterEach } from 'vitest';

import urllib from '../src/index.js';
import { isReadable } from '../src/utils.js';
import { startServer } from './fixtures/server.js';
import { readableToBytes } from './utils.js';

describe('options.streaming.test.ts', () => {
  let close: any;
  let _url: string;
  beforeEach(async () => {
    const { closeServer, url } = await startServer();
    close = closeServer;
    _url = url;
  });

  afterEach(async () => {
    await close();
  });

  it('should get streaming response', async () => {
    let response = await urllib.request(`${_url}streaming_testing`, {
      streaming: true,
    });
    assert.equal(response.status, 200);
    assert.equal(response.res.status, 200);
    assert.equal(response.res.statusCode, 200);
    assert.equal(response.headers['content-type'], 'application/json');
    assert.equal(response.res.headers['content-type'], 'application/json');
    assert.equal(response.res.headers, response.headers);
    assert.equal(response.data, null);
    // console.log(response.res);
    assert(isReadable(response.res as any));
    assert.equal(response.res.status, 200);
    const bytes = await readableToBytes(response.res);
    const data = JSON.parse(bytes.toString());
    assert.equal(data.method, 'GET');
    assert.equal(data.url, '/streaming_testing');
    assert.equal(data.requestBody, '');

    response = await urllib.request(`${_url}streaming_testing`, {
      streaming: true,
    });
    assert.equal(response.status, 200);
    let size = 0;
    // response.res can be read by await for of
    for await (const chunk of response.res) {
      size += chunk.length;
    }
    assert.equal(size, bytes.length);
  });

  it('should work on streaming=true and compressed=true/false', async () => {
    let response = await urllib.request(`${_url}brotli`, {
      streaming: true,
      compressed: true,
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-encoding'], 'br');
    // console.log(response.headers);
    let requestHeaders = JSON.parse(response.headers['x-request-headers'] as string);
    assert.equal(requestHeaders['accept-encoding'], 'gzip, br');
    assert.equal(response.data, null);
    // console.log(response.res);
    // response.res stream is decompressed
    assert(isReadable(response.res));
    let bytes = await readableToBytes(response.res);
    let data = bytes.toString();
    assert.match(data, /export async function startServer/);

    response = await urllib.request(`${_url}brotli`, {
      streaming: true,
      // compressed: false,
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-encoding'], 'br');
    // console.log(response.headers);
    requestHeaders = JSON.parse(response.headers['x-request-headers'] as string);
    assert(
      !requestHeaders['accept-encoding'],
      `should not contains accept-encoding header: ${requestHeaders['accept-encoding']}`,
    );
    assert.equal(response.data, null);
    // console.log(response.res);
    // response.res stream is not decompressed
    assert(isReadable(response.res));
    let decoder = createBrotliDecompress();
    bytes = await readableToBytes(
      pipeline(response.res, decoder, () => {
        return;
      }),
    );
    data = bytes.toString();
    assert.match(data, /export async function startServer/);

    response = await urllib.request(`${_url}brotli`, {
      streaming: true,
      compressed: false,
      headers: {
        'accept-encoding': 'gzip, deflate, br',
      },
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-encoding'], 'br');
    // console.log(response.headers);
    requestHeaders = JSON.parse(response.headers['x-request-headers'] as string);
    assert.equal(requestHeaders['accept-encoding'], 'gzip, deflate, br');
    assert.equal(response.data, null);
    // console.log(response.res);
    // response.res stream is not decompressed
    assert(isReadable(response.res));
    decoder = createBrotliDecompress();
    bytes = await readableToBytes(
      pipeline(response.res, decoder, () => {
        return;
      }),
    );
    data = bytes.toString();
    assert.match(data, /export async function startServer/);
  });

  it('should customResponse alias to streaming', async () => {
    const response = await urllib.request(`${_url}mock-bytes?size=1024`, {
      customResponse: true,
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], undefined);
    assert.equal(response.data, null);
    // console.log(response.headers);
    assert(isReadable(response.res as any));
    const bytes = await readableToBytes(response.res);
    assert.equal(bytes.length, 1024);
  });

  it('should get big streaming response', async () => {
    const response = await urllib.request(`${_url}mock-bytes?size=1024102400`, {
      streaming: true,
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], undefined);
    assert.equal(response.data, null);
    // console.log(response.headers);
    assert(isReadable(response.res as any));
    const bytes = await readableToBytes(response.res);
    assert.equal(bytes.length, 1024102400);
  });

  it('should save big streaming response with highWaterMark', async () => {
    let start = Date.now();
    const size = 1024 * 1024 * 100;
    const response1 = await urllib.request(`${_url}mock-bytes?size=${size}`, {
      streaming: true,
      // highWaterMark: 64 * 1024,
    });
    assert.equal(response1.status, 200);
    assert(isReadable(response1.res as any));
    const bytes1 = await readableToBytes(response1.res);
    assert.equal(bytes1.length, size);
    const use1 = Date.now() - start;
    // console.log('highWaterMark 64KB use %dms', use1);
    assert(use1 > 0);

    start = Date.now();
    const response2 = await urllib.request(`${_url}mock-bytes?size=${size}`, {
      streaming: true,
      highWaterMark: 128 * 1024,
    });
    assert.equal(response2.status, 200);
    assert(isReadable(response2.res as any));
    const bytes2 = await readableToBytes(response2.res);
    assert.equal(bytes2.length, size);
    const use2 = Date.now() - start;
    // console.log('highWaterMark 128KB use %dms', use2);
    // assert(use2 < use1);
    assert(use2 > 0);
  });
});
