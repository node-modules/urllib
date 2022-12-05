import { describe, it, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { strict as assert } from 'assert';
import { createReadStream } from 'fs';
import path from 'path';
import { writeFile, readFile } from 'fs/promises';
import urllib from '../src';
import { isReadable } from '../src/utils';
import { startServer } from './fixtures/server';
import { createTempfile } from './utils';
import tar from 'tar-stream';
import { createGunzip } from 'zlib';
import { Readable } from 'stream';

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
    assert.match(response.data.requestBody, /\('should post with stream', async \(\) => {/);
    const raw = await readFile(__filename, 'utf-8');
    assert.equal(response.data.requestBody, raw);
  });

  it('should post with Readable.wrap()', async () => {
    const response = await urllib.request(_url, {
      method: 'post',
      dataType: 'json',
      stream: new Readable().wrap(createReadStream(__filename)),
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/json');
    assert.equal(response.data.method, 'POST');
    // console.log(response.data);
    // not exists on Node.js
    if (response.data.headers['transfer-encoding']) {
      assert.equal(response.data.headers['transfer-encoding'], 'chunked');
    }
    assert.match(response.data.requestBody, /\('should post with Readable.wrap\(\)', async \(\) => {/);
    const raw = await readFile(__filename, 'utf-8');
    assert.equal(response.data.requestBody, raw);
  });

  it('should post with response.res', async () => {
    const response = await urllib.request(_url, {
      method: 'post',
      dataType: 'stream',
      stream: createReadStream(__filename),
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/json');
    assert(response.res);
    assert(isReadable(response.res as Readable));
    assert(response.res instanceof Readable);
    const response2 = await urllib.request(`${_url}raw`, {
      method: 'post',
      dataType: 'json',
      stream: response.res,
    });
    assert.equal(response2.status, 200);
    assert(!response2.headers['content-type']);
    assert.match(response2.data.requestBody, /\('should post with stream', async \(\) => {/);
    const raw = await readFile(__filename, 'utf-8');
    assert.equal(response2.data.requestBody, raw);
  });

  it('should close 1KB request stream when request timeout', async () => {
    await writeFile(tmpfile, Buffer.alloc(1024));
    const stream = createReadStream(tmpfile);
    assert.equal(stream.destroyed, false);

    await  assert.rejects(async () => {
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
    });
  });

  it('should close 10MB size request stream when request timeout', async () => {
    await writeFile(tmpfile, Buffer.alloc(10 * 1024 * 1024));
    const stream = createReadStream(tmpfile);
    assert.equal(stream.destroyed, false);

    await assert.rejects(async () => {
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
    });
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
    });
    assert.equal(stream.destroyed, true);
    assert.equal(streamError, true);
  });

  it('should POST work on tar-stream', async () => {
    await new Promise((resolve, reject) => {
      const extract = tar.extract();
      extract.on('error', (err: Error) => reject(err));
      extract.on('finish', () => resolve(null));
      extract.on('entry', async (header: any, stream: any, next: any) => {
        assert(isReadable(stream));
        assert.equal(stream instanceof Readable, false);
        // console.log(header.name, header.size, header.type);
        if (header.type !== 'directory') {
          const response = await urllib.request(`${_url}raw`, {
            method: 'POST',
            stream,
            headers: {
              'content-length': header.size,
            },
          });
          assert.equal(response.status, 200);
          assert.equal(response.data.length, header.size);
        }
        next();
      });
      const tgzFile = path.join(__dirname, 'fixtures/pedding-0.0.1.tgz');
      const tgzStream = createReadStream(tgzFile);
      assert(isReadable(tgzStream));
      assert(tgzStream instanceof Readable);
      tgzStream.pipe(createGunzip()).pipe(extract);
    });
  });
});
