import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { describe, it, beforeAll, afterAll } from 'vitest';
import urllib, {
  HttpClient,
  MockAgent, setGlobalDispatcher, getGlobalDispatcher,
} from '../src/index.js';
import { startServer } from './fixtures/server.js';
import { readableToBytes } from './utils.js';

const globalAgent = getGlobalDispatcher();

describe('mock-request.test', () => {
  let close: any;
  let _url: string;

  describe('Mocking request 1', () => {
    let mockAgent: MockAgent;
    beforeAll(async () => {
      mockAgent = new MockAgent();
      setGlobalDispatcher(mockAgent);
      const { closeServer, url } = await startServer();
      close = closeServer;
      _url = url;
    });

    afterAll(async () => {
      setGlobalDispatcher(globalAgent);
      await mockAgent.close();
      await close();
    });

    it('should mocking intercept work', async () => {
      assert.equal(typeof getGlobalDispatcher, 'function');
      assert(getGlobalDispatcher());
      assert.equal(getGlobalDispatcher(), mockAgent);
      const httpClient = new HttpClient();
      const origin = _url.substring(0, _url.length - 1);
      const mockPool = mockAgent.get(origin);
      mockPool.intercept({
        path: '/foo',
        method: 'POST',
      }).reply(400, {
        message: 'mock 400 bad request',
      }).times(2);

      let response = await httpClient.request(`${_url}foo`, {
        method: 'POST',
        dataType: 'json',
      });
      assert.equal(response.status, 400);
      assert.deepEqual(response.data, { message: 'mock 400 bad request' });

      response = await urllib.request(`${_url}foo`, {
        method: 'POST',
        dataType: 'json',
      });
      assert.equal(response.status, 400);
      assert.deepEqual(response.data, { message: 'mock 400 bad request' });

      mockPool.intercept({
        path: '/bar',
        method: 'GET',
        query: {
          q: '1',
        },
      }).reply(200, {
        message: 'mock bar with q=1',
      });

      response = await urllib.request(`${_url}bar?q=1`, {
        method: 'GET',
        dataType: 'json',
      });
      assert.equal(response.status, 200);
      assert.deepEqual(response.data, { message: 'mock bar with q=1' });

      mockPool.intercept({
        path: '/bar',
        method: 'GET',
        query: {
          q: '2',
        },
      }).reply(200, {
        message: 'mock bar with q=2',
      });

      response = await urllib.request(`${_url}bar?q=2`, {
        method: 'GET',
        dataType: 'json',
      });
      assert.equal(response.status, 200);
      assert.deepEqual(response.data, { message: 'mock bar with q=2' });

      mockPool.intercept({
        path: /\.tgz$/,
        method: 'GET',
      }).reply(400, {
        message: 'mock 400 bad request on tgz',
      });
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
      await mockPool.close();
    });
  });

  describe('Mocking request 2', () => {
    let mockAgent: MockAgent;
    beforeAll(async () => {
      mockAgent = new MockAgent();
      setGlobalDispatcher(mockAgent);
      const { closeServer, url } = await startServer();
      close = closeServer;
      _url = url;
    });

    afterAll(async () => {
      setGlobalDispatcher(globalAgent);
      await mockAgent.close();
      await close();
    });

    it('should mocking intercept work with readable', async () => {
      assert.equal(getGlobalDispatcher(), mockAgent);
      const origin = _url.substring(0, _url.length - 1);
      const mockPool = mockAgent.get(origin);
      // mock response stream
      mockPool.intercept({
        path: '/foo.js',
        method: 'GET',
      }).reply(200, readFileSync(__filename))
        .times(2);
      const response1 = await urllib.request(`${_url}foo.js`, {
        method: 'GET',
        dataType: 'stream',
      });
      assert.equal(response1.status, 200);
      const bytes1 = await readableToBytes(response1.res);
      assert.match(bytes1.toString(), /mock response stream/);
      assert.equal(bytes1.length, readFileSync(__filename).length);

      // response = await urllib.request(`${_url}foo.js`, {
      //   method: 'GET',
      //   streaming: true,
      // });
      // assert.equal(response.status, 200);
      // bytes = await readableToBytes(response.res);
      // assert.match(bytes.toString(), /streaming: true,/);
      // assert.equal(bytes.length, readFileSync(__filename).length);

      // mockAgent.assertNoPendingInterceptors();
      // await mockPool.close();
    });
  });

  describe('Mocking request 3', () => {
    let mockAgent: MockAgent;
    beforeAll(async () => {
      mockAgent = new MockAgent();
      setGlobalDispatcher(mockAgent);
      const { closeServer, url } = await startServer();
      close = closeServer;
      _url = url;
    });

    afterAll(async () => {
      setGlobalDispatcher(globalAgent);
      await mockAgent.close();
      await close();
    });

    it('should mocking intercept work on custom httpClient', async () => {
      assert.equal(getGlobalDispatcher(), mockAgent);
      const httpClient = new HttpClient({
        connect: {
          timeout: 2000,
        },
      });
      const oldAgent = httpClient.getDispatcher();
      assert(oldAgent);
      httpClient.setDispatcher(mockAgent);
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

      let response = await httpClient.request(`${_url}foo`, {
        method: 'POST',
        dataType: 'json',
      });
      assert.equal(response.status, 400);
      assert.equal(response.res.statusMessage, 'Bad Request');
      assert.equal(response.res.statusText, 'Bad Request');
      assert.deepEqual(response.data, { message: 'mock 400 bad request' });

      response = await httpClient.request(`${_url}bar?q=1`, {
        method: 'GET',
        dataType: 'json',
      });
      assert.equal(response.status, 200);
      assert.deepEqual(response.data, { message: 'mock bar with q=1' });
      response = await httpClient.request(`${_url}bar?q=2`, {
        method: 'GET',
        dataType: 'json',
      });
      assert.equal(response.status, 200);
      assert.deepEqual(response.data, { message: 'mock bar with q=2' });

      response = await httpClient.request(`${_url}download/foo.tgz`, {
        method: 'GET',
        dataType: 'json',
      });
      assert.equal(response.status, 400);
      assert.deepEqual(response.data, { message: 'mock 400 bad request on tgz' });

      // only intercept once
      response = await httpClient.request(`${_url}download/bar.tgz`, {
        method: 'GET',
        dataType: 'json',
      });
      assert.equal(response.status, 200);
      assert.equal(response.data.method, 'GET');

      mockAgent.assertNoPendingInterceptors();

      // should not work
      httpClient.setDispatcher(oldAgent);
      mockPool.intercept({
        path: '/foo',
        method: 'POST',
      }).reply(400, {
        message: 'mock 400 bad request',
      });
      response = await httpClient.request(`${_url}foo`, {
        method: 'POST',
        dataType: 'json',
      });
      assert.equal(response.status, 200);
      await mockPool.close();
    });
  });
});
