import { strict as assert } from 'node:assert';
import { createReadStream } from 'node:fs';
import { describe, it, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs/promises';
import urllib from '../src';
import { startServer } from './fixtures/server';

describe('options.content.test.ts', () => {
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

  it('should default GET will ignore content', async () => {
    const response = await urllib.request(_url, {
      content: 'foo content',
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/json');
    assert.equal(response.data.method, 'GET');
    assert(response.url.startsWith(_url));
    assert(!response.redirected);
    // console.log(response.data);
    assert.equal(response.data.requestBody, '');
  });

  it('should default GET will ignore content and contentType', async () => {
    const response = await urllib.request(_url, {
      content: 'foo content',
      contentType: 'application/json',
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/json');
    assert.equal(response.data.method, 'GET');
    assert(response.url.startsWith(_url));
    assert(!response.redirected);
    // console.log(response.data);
    assert.equal(response.data.requestBody, '');
    assert(!response.data.headers['content-type']);
  });

  it('should POST with content', async () => {
    const response = await urllib.request(_url, {
      method: 'POST',
      content: 'foo content',
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/json');
    assert.equal(response.data.method, 'POST');
    assert(response.url.startsWith(_url));
    assert(!response.redirected);
    // console.log(response.data);
    assert.equal(response.data.requestBody, 'foo content');
    assert.equal(response.data.headers['content-type'], 'text/plain;charset=UTF-8');
    assert.equal(response.data.headers['content-length'], '11');
  });

  it('should POST with content and content-type', async () => {
    const response = await urllib.request(_url, {
      method: 'POST',
      content: 'foo content',
      dataType: 'json',
      headers: {
        'content-type': 'text/plain',
      },
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/json');
    assert.equal(response.data.method, 'POST');
    assert(response.url.startsWith(_url));
    assert(!response.redirected);
    // console.log(response.data);
    assert.equal(response.data.requestBody, 'foo content');
    assert.equal(response.data.headers['content-type'], 'text/plain');
    assert.equal(response.data.headers['content-length'], '11');
  });

  it('should POST with content and content-type', async () => {
    const response = await urllib.request(_url, {
      method: 'POST',
      content: 'foo content',
      contentType: 'text',
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/json');
    assert.equal(response.data.method, 'POST');
    assert(response.url.startsWith(_url));
    assert(!response.redirected);
    // console.log(response.data);
    assert.equal(response.data.requestBody, 'foo content');
    assert.equal(response.data.headers['content-type'], 'text');
    assert.equal(response.data.headers['content-length'], '11');
  });

  it('should POST with big content', async () => {
    const bigdata = Buffer.alloc(1024 * 1024 * 10);
    const response = await urllib.request(`${_url}raw`, {
      method: 'POST',
      content: bigdata,
    });
    assert.equal(response.status, 200);
    assert(!response.headers['content-type']);
    assert.equal(response.headers['transfer-encoding'], 'chunked');
    assert(response.url.startsWith(_url));
    assert(!response.redirected);
    assert.equal(response.data.length, bigdata.length);
    assert.deepEqual(response.data, bigdata);
    const requestHeaders = JSON.parse(response.headers['x-request-headers'] as string);
    // console.log(requestHeaders);
    assert.equal(requestHeaders['content-length'], `${bigdata.length}`);
    assert(!requestHeaders['content-type']);
  });

  it('should POST with big content and contentType', async () => {
    const bigdata = Buffer.alloc(1024 * 1024 * 10);
    const response = await urllib.request(`${_url}raw`, {
      method: 'POST',
      content: bigdata,
      contentType: 'bytes',
    });
    assert.equal(response.status, 200);
    assert(!response.headers['content-type']);
    assert.equal(response.headers['transfer-encoding'], 'chunked');
    assert(response.url.startsWith(_url));
    assert(!response.redirected);
    assert.equal(response.data.length, bigdata.length);
    assert.deepEqual(response.data, bigdata);
    const requestHeaders = JSON.parse(response.headers['x-request-headers'] as string);
    // console.log(requestHeaders);
    assert.equal(requestHeaders['content-length'], `${bigdata.length}`);
    assert(requestHeaders['content-type'], 'bytes');
  });

  it('should DELETE with content and content-type = xml', async () => {
    const response = await urllib.request(_url, {
      method: 'DELETE',
      content: '<xml>DELETE * FROM user</xml>',
      contentType: 'application/xml',
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/json');
    assert.equal(response.data.method, 'DELETE');
    assert(response.url.startsWith(_url));
    assert(!response.redirected);
    // console.log(response.data);
    assert.equal(response.data.requestBody, '<xml>DELETE * FROM user</xml>');
    assert.equal(response.data.headers['content-type'], 'application/xml');
    assert.equal(response.data.headers['content-length'], '29');
  });

  it('should POST content = readable', async () => {
    const stat = await fs.stat(__filename);
    const fileContent = await fs.readFile(__filename);
    const response = await urllib.request(`${_url}raw`, {
      method: 'POST',
      content: createReadStream(__filename),
    });
    assert.equal(response.status, 200);
    assert(!response.headers['content-type']);
    assert.equal(response.headers['transfer-encoding'], 'chunked');
    assert(response.url.startsWith(_url));
    assert(!response.redirected);
    assert.equal(response.data.length, stat.size);
    assert.deepEqual(response.data, fileContent);
    const requestHeaders = JSON.parse(response.headers['x-request-headers'] as string);
    // console.log(requestHeaders);
    assert.equal(requestHeaders['transfer-encoding'], 'chunked');
    assert.equal(requestHeaders.connection, 'keep-alive');
  });
});
