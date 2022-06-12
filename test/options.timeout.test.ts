import assert from 'assert';
import urllib from '../src';
import { startServer } from './fixtures/server';

describe('options.timeout.test.ts', () => {
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

  it('should timeout 1ms throw error', async () => {
    await assert.rejects(async () => {
      await urllib.request('https://nodejs.org/en/', {
        timeout: 1,
      });
    }, (err: any) => {
      assert.equal(err.name, 'HttpClientRequestTimeoutError');
      assert.equal(err.message, 'Request timeout for 1 ms');
      return true;
    });
  });

  it('should timeout 500ms throw error', async () => {
    await assert.rejects(async () => {
      await urllib.request(`${_url}?timeout=510`, {
        timeout: [ 1, 500 ],
      });
    }, (err: any) => {
      assert.equal(err.name, 'HttpClientRequestTimeoutError');
      assert.equal(err.message, 'Request timeout for 500 ms');
      return true;
    });
  });
});
