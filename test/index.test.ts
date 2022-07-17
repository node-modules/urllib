import { strict as assert } from 'assert';
import urllib from '../src';
import { MockAgent, setGlobalDispatcher, getGlobalDispatcher } from '../src';
import { startServer } from './fixtures/server';

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

    it('should work with URL object', async () => {
      const response = await urllib.request(new URL(`${_url}html`));
      assert.equal(response.status, 200);
      assert.equal(response.headers['content-type'], 'text/html');
      assert(response.headers.date);
      assert.equal(response.url, `${_url}html`);
      assert(!response.redirected);
    });

    it('should request not exists network error', async () => {
      await assert.rejects(async () => {
        await urllib.request('https://www.npmjs-not-exists.com');
      }, (err: any) => {
        // console.error(err);
        assert.equal(err.res.status, -1);
        assert.equal(err.name, 'Error');
        assert.equal(err.message, 'getaddrinfo ENOTFOUND www.npmjs-not-exists.com');
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
        assert.equal(err.message, 'Invalid character in chunk size');
        assert.equal(err.code, 'HPE_INVALID_CHUNK_SIZE');
        assert.equal(err.data, 'labala');
        return true;
      });
    });
  });

  describe('default export', () => {
    it('should export USER_AGENT', () => {
      assert.match(urllib.USER_AGENT, /urllib\//);
    });
  });

  describe('Mocking request', () => {
    it('should mocking intercept work', async () => {
      assert.equal(typeof getGlobalDispatcher, 'function');
      assert(getGlobalDispatcher());

      const mockAgent = new MockAgent();
      setGlobalDispatcher(mockAgent);

      const mockPool = mockAgent.get(_url.substring(0, _url.length - 1));
      mockPool.intercept({
        path: '/foo',
        method: 'POST',
      }).reply(400, {
        message: 'mock 400 bad request',
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
    });
  });
});
