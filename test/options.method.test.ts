import assert from 'assert';
import urllib from '../src';
import { startServer } from './fixtures/server';

describe('options.method.test.ts', () => {
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

  it('should default set method GET', async () => {
    const { status, data } = await urllib.request(_url, {
      dataType: 'json',
    });
    assert.equal(status, 200);
    assert.equal(data.method, 'GET');
  });

  it('should set method POST', async () => {
    const { status, data } = await urllib.request(_url, {
      dataType: 'json',
      method: 'POST',
    });
    assert.equal(status, 200);
    assert.equal(data.method, 'POST');
  });
});
