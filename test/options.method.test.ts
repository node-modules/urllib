import { strict as assert } from 'assert';
import urllib from '../src';
import { startServer } from './fixtures/server';

describe('options.method.test.ts', () => {
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
