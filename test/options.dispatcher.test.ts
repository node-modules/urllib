import { strict as assert } from 'node:assert';

import setup from 'proxy';
import { describe, it, beforeAll, afterAll } from 'vitest';

import { request, ProxyAgent, getGlobalDispatcher, setGlobalDispatcher, Agent } from '../src/index.js';
import { startServer } from './fixtures/server.js';

describe('options.dispatcher.test.ts', () => {
  let close: any;
  let _url: string;
  let proxyServer: any;
  let proxyServerUrl: string;
  beforeAll(async () => {
    const { closeServer, url } = await startServer();
    close = closeServer;
    _url = url;
    proxyServer = setup();
    await new Promise<void>((resolve) => {
      proxyServer.listen(0, () => {
        // console.log('HTTP proxy server listening on port %d', proxyServer.address().port);
        proxyServerUrl = `http://127.0.0.1:${proxyServer.address().port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await close();
    await new Promise((resolve) => {
      proxyServer.close(resolve);
    });
  });

  it('should work with proxyAgent dispatcher', async () => {
    const proxyAgent = new ProxyAgent(proxyServerUrl);
    const response = await request(`${_url}html`, {
      dispatcher: proxyAgent,
      dataType: 'text',
      timing: true,
    });
    assert.equal(response.status, 200);
    assert.equal(response.data, '<h1>hello</h1>');

    const response2 = await request('https://registry.npmmirror.com/urllib/latest', {
      dispatcher: proxyAgent,
      dataType: 'json',
      timing: true,
    });
    // console.log(response2.status, response2.headers);
    assert.equal(response2.status, 200);
    assert.equal(response2.data.name, 'urllib');
  });

  it('should work with getGlobalDispatcher() dispatcher', async () => {
    const agent = getGlobalDispatcher();
    const proxyAgent = new ProxyAgent(proxyServerUrl);
    setGlobalDispatcher(proxyAgent);
    const response = await request(`${_url}html`, {
      dataType: 'text',
      timing: true,
    });
    assert.equal(response.status, 200);
    assert.equal(response.data, '<h1>hello</h1>');
    setGlobalDispatcher(agent);
  });

  it('should work with http/2 dispatcher', async () => {
    // https://github.com/nodejs/undici/issues/2750#issuecomment-1941009554
    const agent = new Agent({
      allowH2: true,
    });
    assert(agent);
    const response = await request('https://registry.npmmirror.com', {
      dataType: 'json',
      timing: true,
      dispatcher: agent,
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/json; charset=utf-8');
  });
});
