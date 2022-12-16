import { describe, it, beforeAll, afterAll } from 'vitest';
import { strict as assert } from 'assert';
import { Readable, pipeline } from 'stream';
import { createBrotliDecompress } from 'zlib';
import urllib from '../src';
import { isReadable } from '../src/utils';
import { startServer } from './fixtures/server';
import { readableToBytes } from './utils';

describe('options.streaming.test.ts', () => {
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
    let bytes = await readableToBytes(response.res as Readable);
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
    assert(!requestHeaders['accept-encoding'],
      `should not contains accept-encoding header: ${requestHeaders['accept-encoding']}`);
    assert.equal(response.data, null);
    // console.log(response.res);
    // response.res stream is not decompressed
    assert(isReadable(response.res));
    let decoder = createBrotliDecompress();
    bytes = await readableToBytes(pipeline(response.res, decoder, () => {}));
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
    bytes = await readableToBytes(pipeline(response.res, decoder, () => {}));
    data = bytes.toString();
    assert.match(data, /export async function startServer/);
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

  it('should customResponse alias to streaming', async () => {
    const response = await urllib.request(`${_url}mock-bytes?size=1024102400`, {
      customResponse: true,
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], undefined);
    assert.equal(response.data, null);
    // console.log(response.headers);
    assert(isReadable(response.res as any));
    const bytes = await readableToBytes(response.res);
    assert.equal(bytes.length, 1024102400);
  });
});
