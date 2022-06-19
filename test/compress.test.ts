import assert from 'assert/strict';
import urllib from '../src';
import { startServer } from './fixtures/server';

describe('compress.test.ts', () => {
  const keepAliveTimeout = 1000;
  let close: any;
  let _url: string;
  beforeAll(async () => {
    const { closeServer, url } = await startServer({ keepAliveTimeout });
    close = closeServer;
    _url = url;
  });

  afterAll(async () => {
    await close();
  });

  it('should deflate content when server accept deflate', async () => {
    const response = await urllib.request(`${_url}deflate`, {
      dataType: 'text',
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-encoding'], 'deflate');
    // console.log(response.headers);
    const requestHeaders = JSON.parse(response.headers['x-request-headers']);
    assert.equal(requestHeaders['accept-encoding'], 'gzip, deflate');
    assert.match(response.data, /const server = createServer\(async/);
  });

  it('should gzip content when server accept gzip', async () => {
    const response = await urllib.request(`${_url}gzip`, {
      dataType: 'text',
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-encoding'], 'gzip');
    // console.log(response.headers);
    const requestHeaders = JSON.parse(response.headers['x-request-headers']);
    assert.equal(requestHeaders['accept-encoding'], 'gzip, deflate');
    assert.match(response.data, /const server = createServer\(async/);
  });

  it('should ignore error gzip content', async () => {
    const response = await urllib.request(`${_url}error-gzip`, {
      dataType: 'text',
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-encoding'], 'gzip');
    // console.log(response.headers);
    const requestHeaders = JSON.parse(response.headers['x-request-headers']);
    assert.equal(requestHeaders['accept-encoding'], 'gzip, deflate');
    assert.equal(response.data, '');
  });
});
