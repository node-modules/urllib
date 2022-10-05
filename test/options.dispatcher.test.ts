import { describe, it, beforeAll, afterAll } from 'vitest';
import { strict as assert } from 'assert';
import setup from 'proxy';
import { request, ProxyAgent, getGlobalDispatcher, setGlobalDispatcher } from '../src';
import { startServer } from './fixtures/server';

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
        console.log('HTTP proxy server listening on port %d', proxyServer.address().port);
        proxyServerUrl = `http://127.0.0.1:${proxyServer.address().port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await close();
    await new Promise(resolve => {
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
});
