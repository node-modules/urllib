import { strict as assert } from 'node:assert';
import { scheduler } from 'node:timers/promises';

import { describe, it, beforeAll, afterAll } from 'vite-plus/test';

import { HttpClient } from '../src/index.js';
import { startServer } from './fixtures/server.js';

describe('head-request-should-keepalive.test.ts', () => {
  // https://github.com/node-modules/urllib/issues/565
  // head request should keepalive
  let close: any;
  let _url: string;
  beforeAll(async () => {
    const { closeServer, urlWithDns } = await startServer();
    close = closeServer;
    _url = urlWithDns;
  });

  afterAll(async () => {
    await close();
  });

  it('should keepalive on GET => HEAD => HEAD Request', async () => {
    const httpClient = new HttpClient();
    let res = await httpClient.request(_url, {
      method: 'GET',
    });
    assert.equal(res.status, 200);
    // console.log(res.headers, res.res.socket);
    assert.equal(res.headers.connection, 'keep-alive');
    const socketId = res.res.socket.id;

    await scheduler.wait(10);
    res = await httpClient.request(_url, {
      method: 'HEAD',
    });
    assert.equal(res.status, 200);
    // console.log(res.headers, res.res.socket);
    assert.equal(res.headers.connection, 'keep-alive');
    assert.equal(res.res.socket.id, socketId);

    await scheduler.wait(1);
    res = await httpClient.request(_url, {
      method: 'HEAD',
    });
    assert.equal(res.status, 200);
    // console.log(res.headers, res.res.socket);
    assert.equal(res.headers.connection, 'keep-alive');
    assert.equal(res.res.socket.id, socketId);

    res = await httpClient.request(_url, {
      method: 'HEAD',
    });
    assert.equal(res.status, 200);
    // console.log(res.headers, res.res.socket);
    assert.equal(res.headers.connection, 'keep-alive');

    await scheduler.wait(1);
    res = await httpClient.request(_url, {
      method: 'HEAD',
    });
    assert.equal(res.status, 200);
    // console.log(res.headers, res.res.socket);
    assert.equal(res.headers.connection, 'keep-alive');
    assert.equal(res.res.socket.id, socketId);

    await scheduler.wait(1);
    res = await httpClient.request(_url, {
      method: 'HEAD',
    });
    assert.equal(res.status, 200);
    // console.log(res.headers, res.res.socket);
    assert.equal(res.headers.connection, 'keep-alive');
    assert.equal(res.res.socket.id, socketId);
  });

  it('should close connection when reset = true', async () => {
    const httpClient = new HttpClient();
    let res = await httpClient.request(_url, {
      method: 'GET',
      reset: true,
    });
    assert.equal(res.status, 200);
    // console.log(res.headers, res.res.socket);
    assert.equal(res.headers.connection, 'close');
    const socketId = res.res.socket.id;

    await scheduler.wait(10);
    res = await httpClient.request(_url, {
      method: 'HEAD',
      reset: true,
    });
    assert.equal(res.status, 200);
    // console.log(res.headers, res.res.socket);
    assert.equal(res.headers.connection, 'close');
    assert.notEqual(res.res.socket.id, socketId);
  });
});
