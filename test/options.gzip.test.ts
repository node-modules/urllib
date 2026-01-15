import { strict as assert } from 'node:assert';

import { describe, it, beforeAll, afterAll } from 'vite-plus/test';

import urllib from '../src/index.js';
import { startServer } from './fixtures/server.js';

describe('options.gzip.test.ts', () => {
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

  it('should handle gzip text response on gzip = true', async () => {
    const { status, headers, data } = await urllib.request(`${_url}gzip`, {
      dataType: 'text',
      gzip: true,
    });
    assert.equal(status, 200);
    const requestHeaders = JSON.parse(headers['x-request-headers'] as string);
    assert.equal(requestHeaders['accept-encoding'], 'gzip, br');
    assert.equal(headers['content-encoding'], 'gzip');
    assert.equal(typeof data, 'string');
    assert.match(data, /export async function startServer/);
  });

  it('should handle gzip text response on gzip = false', async () => {
    const { status, headers, data } = await urllib.request(`${_url}gzip`, {
      dataType: 'text',
      gzip: false,
    });
    assert.equal(status, 200);
    const requestHeaders = JSON.parse(headers['x-request-headers'] as string);
    assert.equal(requestHeaders['accept-encoding'], undefined);
    assert.equal(headers['content-encoding'], 'gzip');
    assert.equal(typeof data, 'string');
    assert.match(data, /export async function startServer/);
  });

  it('should handle gzip json response on gzip = true', async () => {
    const { status, headers, data } = await urllib.request(`${_url}?content-encoding=gzip`, {
      dataType: 'json',
      gzip: true,
    });
    assert.equal(status, 200);
    const requestHeaders = JSON.parse(headers['x-request-headers'] as string);
    assert.equal(requestHeaders['accept-encoding'], 'gzip, br');
    assert.equal(headers['content-encoding'], 'gzip');
    assert.equal(data.headers['accept-encoding'], 'gzip, br');
    assert.equal(data.method, 'GET');
  });

  it('should handle gzip json response on gzip = false', async () => {
    const { status, headers, data } = await urllib.request(`${_url}?content-encoding=gzip`, {
      dataType: 'json',
      gzip: false,
    });
    assert.equal(status, 200);
    const requestHeaders = JSON.parse(headers['x-request-headers'] as string);
    assert.equal(requestHeaders['accept-encoding'], undefined);
    assert.equal(headers['content-encoding'], 'gzip');
    assert.equal(data.headers['accept-encoding'], undefined);
    assert.equal(data.method, 'GET');
  });

  it('should handle br json response on gzip = true', async () => {
    const { status, headers, data } = await urllib.request(`${_url}?content-encoding=br`, {
      dataType: 'json',
      gzip: true,
    });
    assert.equal(status, 200);
    const requestHeaders = JSON.parse(headers['x-request-headers'] as string);
    assert.equal(requestHeaders['accept-encoding'], 'gzip, br');
    assert.equal(headers['content-encoding'], 'br');
    assert.equal(data.headers['accept-encoding'], 'gzip, br');
    assert.equal(data.method, 'GET');
  });

  it('should handle br json response on gzip = false', async () => {
    const { status, headers, data } = await urllib.request(`${_url}?content-encoding=br`, {
      dataType: 'json',
      gzip: false,
    });
    assert.equal(status, 200);
    const requestHeaders = JSON.parse(headers['x-request-headers'] as string);
    assert.equal(requestHeaders['accept-encoding'], undefined);
    assert.equal(headers['content-encoding'], 'br');
    assert.equal(data.headers['accept-encoding'], undefined);
    assert.equal(data.method, 'GET');
  });

  it('should use compressed = false event gzip = true', async () => {
    const { status, headers, data } = await urllib.request(`${_url}?content-encoding=gzip`, {
      dataType: 'json',
      gzip: true,
      compressed: false,
    });
    assert.equal(status, 200);
    const requestHeaders = JSON.parse(headers['x-request-headers'] as string);
    assert.equal(requestHeaders['accept-encoding'], undefined);
    assert.equal(headers['content-encoding'], 'gzip');
    assert.equal(data.headers['accept-encoding'], undefined);
    assert.equal(data.method, 'GET');
  });

  it('should use compressed = true event gzip = false', async () => {
    const { status, headers, data } = await urllib.request(`${_url}?content-encoding=gzip`, {
      dataType: 'json',
      gzip: false,
      compressed: true,
    });
    assert.equal(status, 200);
    const requestHeaders = JSON.parse(headers['x-request-headers'] as string);
    assert.equal(requestHeaders['accept-encoding'], 'gzip, br');
    assert.equal(headers['content-encoding'], 'gzip');
    assert.equal(data.headers['accept-encoding'], 'gzip, br');
    assert.equal(data.method, 'GET');
  });
});
