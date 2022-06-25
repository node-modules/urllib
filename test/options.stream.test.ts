import assert from 'assert/strict';
import { createReadStream } from 'fs';
import { writeFile } from 'fs/promises';
import pEvent from 'p-event';
import urllib from '../src';
import { startServer } from './fixtures/server';
import { createTempfile } from './utils';

describe('options.stream.test.ts', () => {
  let close: any;
  let _url: string;
  let tmpfile: string;
  let cleanup: any;

  beforeAll(async () => {
    const { closeServer, url } = await startServer({
      keepAliveTimeout: 1000,
    });
    close = closeServer;
    _url = url;
  });
  afterAll(async () => {
    await close();
  });

  beforeEach(async () => {
    const item = await createTempfile();
    tmpfile = item.tmpfile;
    cleanup = item.cleanup;
  });
  afterEach(async () => {
    await cleanup();
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

  it('should close request stream when request timeout', async () => {
    await writeFile(tmpfile, Buffer.alloc(10 * 1024 * 1024));
    const stream = createReadStream(tmpfile);
    assert.equal(stream.destroyed, false);
    await Promise.all([
      assert.rejects(async () => {
        await urllib.request(`${_url}block`, {
          method: 'post',
          timeout: 100,
          stream,
        });  
      }, (err: any) => {
        assert.equal(err.name, 'HttpClientRequestTimeoutError');
        assert.equal(err.message, 'Request timeout for 100 ms');
        // stream should be close after request error fire
        assert.equal(stream.destroyed, false);
        return true;
      }),
      pEvent(stream, 'close'),
    ]);
    // stream close
    assert.equal(stream.destroyed, true);
  });

  it('should throw request error when stream error', async () => {
    const stream = createReadStream(`${__filename}.not-exists`);
    let streamError = false;
    stream.on('error', () => {
      streamError = true;
    });
    await assert.rejects(async () => {
      await urllib.request(_url, {
        method: 'post',
        timeout: 100,
        stream,
      });  
    }, (err: any) => {
      // console.error(err);
      assert.equal(err.name, 'TypeError');
      assert.equal(err.message, 'fetch failed');
      assert.equal(stream.destroyed, true);
      return true;
    }),
    assert.equal(stream.destroyed, true);
    assert.equal(streamError, true);
  });
});
