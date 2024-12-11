import { strict as assert } from 'node:assert';
import { createWriteStream, createReadStream } from 'node:fs';
import { describe, it, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import urllib from '../src/index.js';
import { startServer } from './fixtures/server.js';
import { readableToString, createTempfile } from './utils.js';

describe('options.compressed.test.ts', () => {
  let close: any;
  let _url: string;
  let tmpfile: string;
  let cleanup: any;
  beforeAll(async () => {
    const { closeServer, url } = await startServer();
    close = closeServer;
    _url = url;
  });
  afterAll(async () => {
    await close();
  });

  beforeEach(async () => {
    const item = await createTempfile();
    tmpfile = item.tmpfile;
    cleanup = item.cleanup;
  });
  afterEach(async () => {
    await cleanup();
  });

  it('should default compressed = false', async () => {
    const response = await urllib.request(`${_url}brotli`, {
      dataType: 'text',
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-encoding'], 'br');
    // console.log(response.headers);
    const requestHeaders = JSON.parse(response.headers['x-request-headers'] as string);
    assert(!requestHeaders['accept-encoding'],
      `should not contains accept-encoding header: ${requestHeaders['accept-encoding']}`);
    assert.match(response.data, /export async function startServer/);
  });

  it('should deflate content when server accept brotli', async () => {
    const response = await urllib.request(`${_url}brotli`, {
      dataType: 'text',
      compressed: true,
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-encoding'], 'br');
    // console.log(response.headers);
    const requestHeaders = JSON.parse(response.headers['x-request-headers'] as string);
    assert.equal(requestHeaders['accept-encoding'], 'gzip, br');
    assert.match(response.data, /export async function startServer/);
  });

  it('should gzip content when server accept gzip', async () => {
    const response = await urllib.request(`${_url}gzip`, {
      dataType: 'text',
      compressed: true,
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-encoding'], 'gzip');
    // console.log(response.headers);
    const requestHeaders = JSON.parse(response.headers['x-request-headers'] as string);
    assert.equal(requestHeaders['accept-encoding'], 'gzip, br');
    assert.match(response.data, /export async function startServer/);
  });

  it('should dataType=text with 304 status with content-encoding: gzip', async () => {
    const response = await urllib.request(`${_url}304-with-gzip`, {
      dataType: 'text',
      compressed: true,
    });
    assert.equal(response.status, 304);
    assert.equal(response.headers['content-encoding'], 'gzip');
    // console.log(response.headers);
    const requestHeaders = JSON.parse(response.headers['x-request-headers'] as string);
    assert.equal(requestHeaders['accept-encoding'], 'gzip, br');
    assert.equal(response.data, '');
  });

  it('should dataType=json with 304 status with content-encoding: gzip', async () => {
    const response = await urllib.request(`${_url}304-with-gzip`, {
      dataType: 'json',
      compressed: true,
    });
    assert.equal(response.status, 304);
    assert.equal(response.headers['content-encoding'], 'gzip');
    // console.log(response.headers);
    const requestHeaders = JSON.parse(response.headers['x-request-headers'] as string);
    assert.equal(requestHeaders['accept-encoding'], 'gzip, br');
    assert.equal(response.data, null);
  });

  it('should gzip work on dataType = stream', async () => {
    const response = await urllib.request(`${_url}gzip`, {
      dataType: 'stream',
      compressed: true,
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-encoding'], 'gzip');
    // console.log(response.headers);
    const requestHeaders = JSON.parse(response.headers['x-request-headers'] as string);
    assert.equal(requestHeaders['accept-encoding'], 'gzip, br');
    const text = await readableToString(response.res as any);
    assert.match(text, /export async function startServer/);
  });

  it('should brotli work on dataType = stream', async () => {
    const response = await urllib.request(`${_url}brotli`, {
      dataType: 'stream',
      compressed: true,
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-encoding'], 'br');
    // console.log(response.headers);
    const requestHeaders = JSON.parse(response.headers['x-request-headers'] as string);
    assert.equal(requestHeaders['accept-encoding'], 'gzip, br');
    const text = await readableToString(response.res as any);
    assert.match(text, /export async function startServer/);
  });

  it('should gzip work on writeStream', async () => {
    const writeStream = createWriteStream(tmpfile);
    const response = await urllib.request(`${_url}gzip`, {
      compressed: true,
      writeStream,
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-encoding'], 'gzip');
    const requestHeaders = JSON.parse(response.headers['x-request-headers'] as string);
    assert.equal(requestHeaders['accept-encoding'], 'gzip, br');
    const text = await readableToString(createReadStream(tmpfile));
    assert.match(text, /export async function startServer/);
  });

  it('should brotli work on writeStream', async () => {
    const writeStream = createWriteStream(tmpfile);
    const response = await urllib.request(`${_url}brotli`, {
      compressed: true,
      writeStream,
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-encoding'], 'br');
    // console.log(response.headers);
    const requestHeaders = JSON.parse(response.headers['x-request-headers'] as string);
    assert.equal(requestHeaders['accept-encoding'], 'gzip, br');
    const text = await readableToString(createReadStream(tmpfile));
    assert.match(text, /export async function startServer/);
  });

  it('should keep accept-encoding raw', async () => {
    const response = await urllib.request(`${_url}gzip`, {
      dataType: 'text',
      compressed: true,
      headers: {
        'accept-encoding': 'gzip',
      },
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-encoding'], 'gzip');
    // console.log(response.headers);
    const requestHeaders = JSON.parse(response.headers['x-request-headers'] as string);
    assert.equal(requestHeaders['accept-encoding'], 'gzip');
    assert.match(response.data, /export async function startServer/);
  });

  it('should throw error when gzip content invalid', async () => {
    await assert.rejects(async () => {
      await urllib.request(`${_url}error-gzip`, {
        dataType: 'text',
        compressed: true,
      });
    }, (err: any) => {
      // console.error(err);
      assert.equal(err.name, 'UnzipError');
      assert.equal(err.message, 'incorrect header check');
      assert.equal(err.code, 'Z_DATA_ERROR');
      assert.equal(err.status, 200);
      assert.equal(err.headers['content-encoding'], 'gzip');
      return true;
    });
  });

  it('should throw error when brotli content invaild', async () => {
    await assert.rejects(async () => {
      await urllib.request(`${_url}error-brotli`, {
        dataType: 'text',
        compressed: true,
      });
    }, (err: any) => {
      // console.error(err);
      assert.equal(err.name, 'UnzipError');
      assert.equal(err.message, 'Decompression failed');
      if (process.version !== 'v18.19.0' && !process.version.startsWith('v16.')) {
        assert.equal(err.code, 'ERR__ERROR_FORMAT_PADDING_1');
      } else {
        assert.equal(err.code, 'ERR_PADDING_1');
      }
      assert.equal(err.status, 200);
      assert.equal(err.headers['content-encoding'], 'br');
      return true;
    });
  });
});
