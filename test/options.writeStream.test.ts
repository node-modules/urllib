import { strict as assert } from 'node:assert';
import { createWriteStream } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { stat, readFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';
import { describe, it, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import urllib from '../src/index.js';
import { startServer } from './fixtures/server.js';
import { createTempfile } from './utils.js';

describe('options.writeStream.test.ts', () => {
  let close: any;
  let _url: string;
  let tmpfile: string;
  let cleanup: any;
  beforeAll(async () => {
    const { closeServer, url } = await startServer();
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

  it('should save response to writeStream', async () => {
    const writeStream = createWriteStream(tmpfile);
    const response = await urllib.request(`${_url}mock-bytes?size=1024123`, {
      writeStream,
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], undefined);
    assert.equal(response.data, null);
    // console.log(response.headers);
    assert.equal(response.headers['content-length'], '1024123');
    const stats = await stat(tmpfile);
    assert.equal(stats.size, 1024123);
  });

  it('should work with compressed=true/false', async () => {
    let writeStream = createWriteStream(tmpfile);
    let response = await urllib.request(`${_url}gzip`, {
      writeStream,
      compressed: true,
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], undefined);
    assert.equal(response.data, null);
    // console.log(response.headers);
    // writeStream is decompressed
    let data = await readFile(tmpfile, 'utf-8');
    assert.match(data, /export async function startServer/);

    writeStream = createWriteStream(tmpfile);
    response = await urllib.request(`${_url}gzip`, {
      writeStream,
      compressed: false,
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], undefined);
    assert.equal(response.data, null);
    // console.log(response.headers);
    // writeStream is not decompressed
    data = gunzipSync(await readFile(tmpfile)).toString();
    assert.match(data, /export async function startServer/);
  });

  it('should close writeStream when request timeout', async () => {
    const writeStream = createWriteStream(tmpfile);
    assert.equal(writeStream.destroyed, false);
    let writeStreamClosed = false;
    writeStream.on('close', () => {
      writeStreamClosed = true;
      // console.log('writeStreamClosed');
    });
    await assert.rejects(async () => {
      await urllib.request(`${_url}mock-bytes?size=1024&timeout=2000`, {
        writeStream,
        timeout: 100,
      });
    }, (err: any) => {
      assert.equal(err.name, 'HttpClientRequestTimeoutError');
      assert.equal(err.message, 'Request timeout for 100 ms');
      // writeStream should be close before request error fire
      assert.equal(writeStream.destroyed, true);
      return true;
    });
    await sleep(30);
    // writeStream close
    assert.equal(writeStream.destroyed, true);
    assert.equal(writeStreamClosed, true);
  });

  // writeStream only work with error handle on Node.js >= 18
  // bugfix: https://github.com/node-modules/urllib/issues/459
  it('should throw request error when writeStream error', async () => {
    const tmpfile = join(__dirname, 'not-exists-dir', 'foo.txt');
    const writeStream = createWriteStream(tmpfile);
    let writeStreamError = false;
    writeStream.on('error', () => {
      writeStreamError = true;
    });
    await assert.rejects(async () => {
      await urllib.request(_url, {
        writeStream,
      });
    }, (err: any) => {
      // only Node.js >= 18 has stream.emitError
      if (err.message !== 'writeStream is destroyed') {
        assert.equal(err.name, 'Error');
        assert.match(err.code, /^ENOENT|ERR_STREAM_UNABLE_TO_PIPE$/);
        if (err.code === 'ERR_STREAM_UNABLE_TO_PIPE') {
          // change to ERR_STREAM_UNABLE_TO_PIPE on Node.js >= 23
          assert.equal(err.message, 'Cannot pipe to a closed or destroyed stream');
        } else {
          assert.match(err.message, /no such file or directory/);
        }
      }
      return true;
    });
    assert.equal(writeStream.destroyed, true);
    assert.equal(writeStreamError, true);
  });

  it('should end writeStream when server error', async () => {
    const writeStream = createWriteStream(tmpfile);
    await assert.rejects(async () => {
      await urllib.request(`${_url}error`, {
        writeStream,
      });
    }, (err: any) => {
      // console.error(err);
      assert.equal(err.name, 'SocketError');
      assert.equal(err.code, 'UND_ERR_SOCKET');
      assert.equal(err.message, 'other side closed');
      return true;
    });
  });
});
