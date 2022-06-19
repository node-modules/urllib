import assert from 'assert/strict';
import urllib from '../src';
import { startServer } from './fixtures/server';

describe('response-charset-gbk.test.ts', () => {
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

  it.skip('should auto decode with dataType = json on "application/json;charset=gbk"', async () => {
    const response = await urllib.request(`${_url}gbk/json`, {
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/json;charset=gbk');
    assert.deepEqual(response.data, {
      hello: '你好',
    });
  });

  it.skip('should auto decode with dataType = text on "text/plain;charset=gbk"', async () => {
    const response = await urllib.request(`${_url}gbk/text`, {
      dataType: 'text',
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'text/plain;charset=gbk');
    assert.deepEqual(response.data, '你好');
  });

  it('should ignore wrong charset with dataType = text on "text/plain;charset=notfound"', async () => {
    const response = await urllib.request(`${_url}errorcharset`, {
      dataType: 'text',
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'text/plain;charset=notfound');
    assert.deepEqual(response.data, '你好');
  });
});
