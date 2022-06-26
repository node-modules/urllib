import { strict as assert } from 'assert';
import { createReadStream } from 'fs';
import { writeFile, readFile } from 'fs/promises';
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
    // not exists on Node.js
    if (response.data.headers['transfer-encoding']) {
      assert.equal(response.data.headers['transfer-encoding'], 'chunked');
    }
    assert.match(response.data.requestBody, /it\('should post with stream', async \(\) => {/);
    const raw = await readFile(__filename, 'utf-8');
    assert.equal(response.data.requestBody, raw);
  });

  // FIXME: https://github.com/nodejs/undici/pull/1515 wait for new version publish
  it.skip('should close 1KB request stream when request timeout', async () => {
    await writeFile(tmpfile, Buffer.alloc(1024));
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
        // console.error(err);
        assert.equal(err.name, 'HttpClientRequestTimeoutError');
        assert.equal(err.message, 'Request timeout for 100 ms');
        err.cause && assert.equal(err.cause.name, 'HeadersTimeoutError');
        // stream should be close after request error fire
        assert.equal(stream.destroyed, true);
        return true;
      }),
      pEvent(stream, 'error'),
    ]);
    // stream close
    assert.equal(stream.destroyed, true);
  });

  // FIXME: https://github.com/nodejs/undici/pull/1515 wait for new version publish
  it.skip('should close 10MB size request stream when request timeout', async () => {
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
        // console.error(err);
        assert.equal(err.name, 'HttpClientRequestTimeoutError');
        assert.equal(err.message, 'Request timeout for 100 ms');
        err.cause && assert.equal(err.cause.name, 'HeadersTimeoutError');
        // stream should be close after request error fire
        assert.equal(stream.destroyed, true);
        return true;
      }),
      pEvent(stream, 'error'),
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
      await urllib.request(`${_url}block`, {
        method: 'post',
        stream,
      });  
    }, (err: any) => {
      // console.error(err);
      assert.equal(err.name, 'Error');
      assert.match(err.message, /no such file or directory/);
      assert.equal(stream.destroyed, true);
      return true;
    }),
    assert.equal(stream.destroyed, true);
    assert.equal(streamError, true);
  });
});
