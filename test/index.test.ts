import { strict as assert } from 'node:assert';
import { parse as urlparse } from 'node:url';
import { readFileSync } from 'node:fs';
import { describe, it, beforeAll, afterAll } from 'vitest';
import urllib from '../src';
import { MockAgent, setGlobalDispatcher, getGlobalDispatcher } from '../src';
import { startServer } from './fixtures/server';
import { readableToBytes } from './utils';

describe('index.test.ts', () => {
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

  describe('urllib.request()', () => {
    it('should work', async () => {
      const response = await urllib.request(`${_url}html`);
      assert.equal(response.status, 200);
      assert.equal(response.headers['content-type'], 'text/html');
      assert(response.headers.date);
      assert.equal(response.url, `${_url}html`);
      assert(!response.redirected);
    });

    it('should response set-cookie as a string', async () => {
      const response = await urllib.request(`${_url}set-one-cookie`);
      assert.equal(response.status, 200);
      assert.equal(typeof response.headers['set-cookie'], 'string');
      assert.equal(response.headers['set-cookie'], 'foo=bar; path=/');
      assert.equal(response.headers['Set-Cookie'], undefined);
      assert.equal(response.headers['content-type'], 'text/html');
      assert.equal(response.headers['content-length'], '25');
    });

    it('should response set-cookie as an array string', async () => {
      const response = await urllib.request(`${_url}set-two-cookie`);
      assert.equal(response.status, 200);
      assert(Array.isArray(response.headers['set-cookie']));
      assert.equal(typeof response.headers['set-cookie'], 'object');
      assert.deepEqual(response.headers['set-cookie'], [
        'foo=bar; path=/',
        'hello=world; path=/',
      ]);
      assert.equal(response.headers['Set-Cookie'], undefined);
    });

    it('should request with T response data', async () => {
      type HelloData = {
        hello: string;
      };
      const response = await urllib.request<HelloData>(`${_url}hello/json`, {
        dataType: 'json',
      });
      assert.equal(response.status, 200);
      console.log(response.data.hello);
    });

    it('should curl alias to request', async () => {
      const response = await urllib.curl(`${_url}html`);
      assert.equal(response.status, 200);
      assert.equal(response.headers['content-type'], 'text/html');
      assert(response.headers.date);
      assert.equal(response.url, `${_url}html`);
      assert(!response.redirected);
    });

    it('should keep dataAsQueryString compatible', async () => {
      const response = await urllib.request(`${_url}html`, { dataAsQueryString: true });
      assert.equal(response.status, 200);
      assert.equal(response.headers['content-type'], 'text/html');
      assert(response.headers.date);
      assert.equal(response.url, `${_url}html`);
      assert(!response.redirected);
    });

    it('should work with URL object', async () => {
      const response = await urllib.request(new URL(`${_url}html`));
      assert.equal(response.status, 200);
      assert.equal(response.headers['content-type'], 'text/html');
      assert(response.headers.date);
      assert.equal(response.url, `${_url}html`);
      assert(!response.redirected);
    });

    it('should work with url.parse() object', async () => {
      const urlObject = urlparse(`${_url}html?abc=123`);
      const response = await urllib.request(urlObject as any, {
        data: {
          foo: 'bar',
        },
      });
      assert.equal(response.status, 200);
      assert.equal(response.headers['content-type'], 'text/html');
      assert(response.headers.date);
      assert.equal(response.url, `${_url}html?abc=123&foo=bar`);
      assert(!response.redirected);
    });

    // unstable
    it.skip('should request not exists network error', async () => {
      await assert.rejects(async () => {
        await urllib.request('http://www.npmjs-not-exists.foo', {
          timeout: 500,
        });
      }, (err: any) => {
        console.error(err);
        assert.equal(err.res.status, -1);
        // assert.equal(err.name, 'Error');
        // assert.equal(err.message, 'getaddrinfo ENOTFOUND www.npmjs-not-exists.foo');
        // err.status and err.headers
        assert.equal(err.status, -1);
        assert(err.headers);
        return true;
      });
    });

    it('should handle server socket end("balabal") will error', async () => {
      await assert.rejects(async () => {
        await urllib.request(`${_url}socket.end.error`);
      }, (err: any) => {
        // console.error(err);
        assert.equal(err.res.status, 200);
        assert.equal(err.name, 'HTTPParserError');
        assert.equal(err.message, 'Response does not match the HTTP/1.1 protocol (Invalid character in chunk size)');
        assert.equal(err.code, 'HPE_INVALID_CHUNK_SIZE');
        assert.equal(err.data, 'labala');
        return true;
      });
    });

    it('should request(host-only) work', async () => {
      const host = process.env.CI ? 'registry.npmjs.org' : 'registry.npmmirror.com';
      const url = `${host}/urllib/latest`;
      const response = await urllib.request(url, { dataType: 'json' });
      assert.equal(response.status, 200);
      assert.equal(response.data.name, 'urllib');
    });

    it('should request(host:port) work', async () => {
      const host = process.env.CI ? 'registry.npmjs.org' : 'registry.npmmirror.com';
      const url = `${host}:80/urllib/latest`;
      const response = await urllib.request(url, { dataType: 'json' });
      assert.equal(response.status, 200);
      assert.equal(response.data.name, 'urllib');
    });
  });

  describe('default export', () => {
    it('should export USER_AGENT', () => {
      assert.match(urllib.USER_AGENT, /urllib\//);
    });
  });

  describe('Mocking request', () => {
    let mockAgent: MockAgent;
    const globalAgent = getGlobalDispatcher();
    beforeAll(() => {
      mockAgent = new MockAgent();
      setGlobalDispatcher(mockAgent);
    });

    afterAll(async () => {
      setGlobalDispatcher(globalAgent);
      await mockAgent.close();
    });

    it('should mocking intercept work', async () => {
      assert.equal(typeof getGlobalDispatcher, 'function');
      assert(getGlobalDispatcher());
      const mockPool = mockAgent.get(_url.substring(0, _url.length - 1));
      mockPool.intercept({
        path: '/foo',
        method: 'POST',
      }).reply(400, {
        message: 'mock 400 bad request',
      });

      mockPool.intercept({
        path: '/bar',
        method: 'GET',
        query: {
          q: '1',
        },
      }).reply(200, {
        message: 'mock bar with q=1',
      });

      mockPool.intercept({
        path: '/bar',
        method: 'GET',
        query: {
          q: '2',
        },
      }).reply(200, {
        message: 'mock bar with q=2',
      });

      mockPool.intercept({
        path: /\.tgz$/,
        method: 'GET',
      }).reply(400, {
        message: 'mock 400 bad request on tgz',
      });

      let response = await urllib.request(`${_url}foo`, {
        method: 'POST',
        dataType: 'json',
      });
      assert.equal(response.status, 400);
      assert.deepEqual(response.data, { message: 'mock 400 bad request' });

      response = await urllib.request(`${_url}bar?q=1`, {
        method: 'GET',
        dataType: 'json',
      });
      assert.equal(response.status, 200);
      assert.deepEqual(response.data, { message: 'mock bar with q=1' });
      response = await urllib.request(`${_url}bar?q=2`, {
        method: 'GET',
        dataType: 'json',
      });
      assert.equal(response.status, 200);
      assert.deepEqual(response.data, { message: 'mock bar with q=2' });

      response = await urllib.request(`${_url}download/foo.tgz`, {
        method: 'GET',
        dataType: 'json',
      });
      assert.equal(response.status, 400);
      assert.deepEqual(response.data, { message: 'mock 400 bad request on tgz' });

      // only intercept once
      response = await urllib.request(`${_url}download/bar.tgz`, {
        method: 'GET',
        dataType: 'json',
      });
      assert.equal(response.status, 200);
      assert.equal(response.data.method, 'GET');

      mockAgent.assertNoPendingInterceptors();
    });

    it('should mocking intercept work with readable', async () => {
      const mockPool = mockAgent.get(_url.substring(0, _url.length - 1));
      // mock response stream
      mockPool.intercept({
        path: '/foo.js',
        method: 'GET',
      }).reply(200, readFileSync(__filename)).times(2);
      let response = await urllib.request(`${_url}foo.js`, {
        method: 'GET',
        dataType: 'stream',
      });
      assert.equal(response.status, 200);
      let bytes = await readableToBytes(response.res);
      assert.match(bytes.toString(), /mock response stream/);
      assert.equal(bytes.length, readFileSync(__filename).length);

      response = await urllib.request(`${_url}foo.js`, {
        method: 'GET',
        streaming: true,
      });
      assert.equal(response.status, 200);
      bytes = await readableToBytes(response.res);
      assert.match(bytes.toString(), /streaming: true,/);
      assert.equal(bytes.length, readFileSync(__filename).length);

      mockAgent.assertNoPendingInterceptors();
    });
  });
});
