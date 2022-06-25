import { strict as assert } from 'assert';
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
      gzip: true,
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-encoding'], 'deflate');
    // console.log(response.headers);
    const requestHeaders = JSON.parse(response.headers['x-request-headers'] as string);
    assert.equal(requestHeaders['accept-encoding'], 'gzip, deflate');
    assert.match(response.data, /const server = createServer\(async/);
  });

  it('should gzip content when server accept gzip', async () => {
    const response = await urllib.request(`${_url}gzip`, {
      dataType: 'text',
      gzip: true,
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-encoding'], 'gzip');
    // console.log(response.headers);
    const requestHeaders = JSON.parse(response.headers['x-request-headers'] as string);
    assert.equal(requestHeaders['accept-encoding'], 'gzip, deflate');
    assert.match(response.data, /const server = createServer\(async/);
  });

  it('should throw error when gzip content invaild', async () => {
    await assert.rejects(async () => {
      await urllib.request(`${_url}error-gzip`, {
        dataType: 'text',
        gzip: true,
      });
    }, (err: any) => {
      // console.error(err);
      assert.equal(err.name, 'UnzipError');
      assert.equal(err.message, 'incorrect header check');
      assert.equal(err.code, 'Z_DATA_ERROR');
      assert.equal(err.status, 200);
      assert.equal(err.headers['content-encoding'], 'gzip');
      return true;
    });
  });
});
