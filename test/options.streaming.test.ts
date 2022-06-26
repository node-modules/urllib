import { strict as assert } from 'assert';
import { isReadable, Readable } from 'stream';
import urllib from '../src';
import { startServer } from './fixtures/server';
import { readableToBytes } from './utils';

describe('options.streaming.test.ts', () => {
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

  it('should get streaming response', async () => {
    const response = await urllib.request(`${_url}streaming_testing`, {
      streaming: true,
    });
    assert.equal(response.status, 200);
    assert.equal(response.res.status, 200);
    assert.equal(response.res.statusCode, 200);
    assert.equal(response.headers['content-type'], 'application/json');
    assert.equal(response.res.headers['content-type'], 'application/json');
    assert.equal(response.res.headers, response.headers);
    assert.equal(response.data, null);
    // console.log(response.res);
    isReadable && assert(isReadable(response.res as any));
    assert.equal(response.res.status, 200);
    const bytes = await readableToBytes(response.res as Readable);
    const data = JSON.parse(bytes.toString());
    assert.equal(data.method, 'GET');
    assert.equal(data.url, '/streaming_testing');
    assert.equal(data.requestBody, '');
  });

  it('should get big streaming response', async () => {
    const response = await urllib.request(`${_url}mock-bytes?size=1024102400`, {
      streaming: true,
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], undefined);
    assert.equal(response.data, null);
    // console.log(response.headers);
    isReadable && assert(isReadable(response.res as any));
    const bytes = await readableToBytes(response.res as Readable);
    assert.equal(bytes.length, 1024102400);
  });

  it('should customResponse alias to streaming', async () => {
    const response = await urllib.request(`${_url}mock-bytes?size=1024102400`, {
      customResponse: true,
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], undefined);
    assert.equal(response.data, null);
    // console.log(response.headers);
    isReadable && assert(isReadable(response.res as any));
    const bytes = await readableToBytes(response.res as Readable);
    assert.equal(bytes.length, 1024102400);
  });
});
