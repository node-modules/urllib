import { strict as assert } from 'node:assert';
import { createWriteStream, createReadStream } from 'node:fs';
import { describe, it, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import urllib from '../src';
import { startServer } from './fixtures/server';
import { readableToString, createTempfile } from './utils';

describe('options.retry.test.ts', () => {
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

  it('should not retry on 400', async () => {
    const response = await urllib.request(`${_url}mock-status?status=400`, {
      dataType: 'text',
      retry: 2,
    });
    assert.equal(response.status, 400);
    assert.equal(response.data, 'Mock status 400');
    const requestHeaders = JSON.parse(response.headers['x-request-headers'] as string);
    assert.equal(requestHeaders['x-urllib-retry'], undefined);
  });

  it('should not retry on streaming', async () => {
    const response = await urllib.request(`${_url}mock-status?status=500`, {
      dataType: 'text',
      retry: 2,
      streaming: true,
    });
    assert.equal(response.status, 500);
    const requestHeaders = JSON.parse(response.headers['x-request-headers'] as string);
    assert.equal(requestHeaders['x-urllib-retry'], undefined);
    const text = await readableToString(response.res as any);
    assert.equal(text, 'Mock status 500');
  });

  it('should not retry on writeStream', async () => {
    const writeStream = createWriteStream(tmpfile);
    const response = await urllib.request(`${_url}mock-status?status=500`, {
      dataType: 'text',
      retry: 2,
      writeStream,
    });
    assert.equal(response.status, 500);
    const requestHeaders = JSON.parse(response.headers['x-request-headers'] as string);
    assert.equal(requestHeaders['x-urllib-retry'], undefined);
    const text = await readableToString(createReadStream(tmpfile));
    assert.equal(text, 'Mock status 500');
  });

  it('should not retry on streaming', async () => {
    const response = await urllib.request(`${_url}mock-status?status=500`, {
      dataType: 'text',
      retry: 2,
      streaming: true,
    });
    assert.equal(response.status, 500);
    const requestHeaders = JSON.parse(response.headers['x-request-headers'] as string);
    assert.equal(requestHeaders['x-urllib-retry'], undefined);
    const text = await readableToString(response.res as any);
    assert.equal(text, 'Mock status 500');
  });

  it('should retry fail on default server status 500', async () => {
    let response = await urllib.request(`${_url}mock-status?status=500`, {
      dataType: 'text',
      retry: 2,
    });
    assert.equal(response.status, 500);
    assert.equal(response.data, 'Mock status 500');
    let requestHeaders = JSON.parse(response.headers['x-request-headers'] as string);
    assert.equal(requestHeaders['x-urllib-retry'], '2/2');
    assert(parseInt(response.headers['x-requests-persocket'] as string) >= 2);
    // console.log(response.headers);

    response = await urllib.request(`${_url}mock-status?status=500`, {
      dataType: 'text',
      retry: 1,
    });
    assert.equal(response.status, 500);
    assert.equal(response.data, 'Mock status 500');
    // console.log(response.headers);
    requestHeaders = JSON.parse(response.headers['x-request-headers'] as string);
    assert.equal(requestHeaders['x-urllib-retry'], '1/1');
    assert(parseInt(response.headers['x-requests-persocket'] as string) >= 2);

    response = await urllib.request(`${_url}mock-status?status=500`, {
      dataType: 'text',
      retry: 5,
    });
    assert.equal(response.status, 500);
    assert.equal(response.data, 'Mock status 500');
    // console.log(response.headers);
    requestHeaders = JSON.parse(response.headers['x-request-headers'] as string);
    assert.equal(requestHeaders['x-urllib-retry'], '5/5');
    assert(parseInt(response.headers['x-requests-persocket'] as string) >= 2);
  });

  it('should custom isRetry', async () => {
    const response = await urllib.request(`${_url}mock-status?status=400`, {
      dataType: 'text',
      retry: 2,
      isRetry(response) {
        return response.status === 400;
      },
    });
    assert.equal(response.status, 400);
    assert.equal(response.data, 'Mock status 400');
    const requestHeaders = JSON.parse(response.headers['x-request-headers'] as string);
    assert.equal(requestHeaders['x-urllib-retry'], '2/2');
  });

  it('should retry with delay', async () => {
    const startTime = Date.now();
    const response = await urllib.request(`${_url}mock-status?status=500`, {
      dataType: 'text',
      retry: 3,
      retryDelay: 110,
    });
    assert.equal(response.status, 500);
    assert.equal(response.data, 'Mock status 500');
    const requestHeaders = JSON.parse(response.headers['x-request-headers'] as string);
    assert.equal(requestHeaders['x-urllib-retry'], '3/3');
    const use = Date.now() - startTime;
    assert(use >= 330);
  });
});
