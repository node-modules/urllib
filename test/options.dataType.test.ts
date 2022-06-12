import assert from 'assert';
import { isReadable } from 'stream';
import urllib from '../src';
import { startServer } from './fixtures/server';

describe('options.dataType.test.ts', () => {
  let _server: any;
  let _url: string;
  beforeAll(async () => {
    const { server, url } = await startServer();
    _server = server;
    _url = url;
  });

  afterAll(() => {
    _server.closeAllConnections && _server.closeAllConnections();
    _server.close();
  });

  it('should dataType is buffer', async () => {
    const response = await urllib.request(_url);
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/json');
    assert(response.headers.date);
    assert(Buffer.isBuffer(response.data));
    assert.match(response.data.toString(), /^{"method":"GET",/);
    assert.equal(response.url, _url);
    assert(!response.redirected);
  });

  it('should work with dataType = buffer', async () => {
    const response = await urllib.request(_url, {
      dataType: 'buffer',
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/json');
    assert(response.headers.date);
    assert(Buffer.isBuffer(response.data));
    assert.match(response.data.toString(), /^{"method":"GET",/);
    assert.equal(response.url, _url);
    assert(!response.redirected);
  });

  it('should work with dataType = text', async () => {
    const response = await urllib.request(_url, {
      dataType: 'text',
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/json');
    assert(response.headers.date);
    assert.equal(typeof response.data, 'string');
    assert.match(response.data, /^{"method":"GET",/);
    assert.equal(response.url, _url);
    assert(!response.redirected);
  });

  it('should work with dataType = json', async () => {
    const response = await urllib.request('https://registry.npmjs.org/urllib/latest', {
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/json');
    assert.equal(typeof response.data, 'object');
    assert.equal(response.data.name, 'urllib');
  });

  it('should work with dataType = stream', async () => {
    const response = await urllib.request('https://registry.npmjs.org/urllib', {
      dataType: 'stream',
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/json');
    assert(isReadable(response.data));
    const chunks = [];
    for await (const chunk of response.data) {
      chunks.push(chunk);
    }
    const jsonString = Buffer.concat(chunks).toString();
    assert.equal(JSON.parse(jsonString).name, 'urllib');
  });

  it('should work with streaming = true', async () => {
    const response = await urllib.request('https://registry.npmjs.org/urllib', {
      streaming: true,
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/json');
    assert(isReadable(response.data));
    const chunks = [];
    for await (const chunk of response.data) {
      chunks.push(chunk);
    }
    const jsonString = Buffer.concat(chunks).toString();
    assert.equal(JSON.parse(jsonString).name, 'urllib');
  });
});
