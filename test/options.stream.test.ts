import assert from 'assert/strict';
import { createReadStream } from 'fs'; 'fs';
import urllib from '../src';
import { startServer } from './fixtures/server';

describe('options.stream.test.ts', () => {
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

  it('should post with stream', async () => {
    const response = await urllib.request(_url, {
      method: 'post',
      dataType: 'json',
      stream: createReadStream(__filename),
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/json');
    assert.equal(response.data.method, 'POST');
    // console.log(response.data);
    assert.equal(response.data.headers['transfer-encoding'], 'chunked');
    assert.match(response.data.requestBody, /it\('should post with stream', async \(\) => {/);
  });
});
