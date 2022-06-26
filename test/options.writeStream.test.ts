import { strict as assert } from 'assert';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { stat } from 'fs/promises';
import urllib from '../src';
import { startServer } from './fixtures/server';
import { createTempfile, sleep } from './utils';

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

  it('should close writeStream when request timeout', async () => {
    const writeStream = createWriteStream(tmpfile);
    assert.equal(writeStream.destroyed, false);
    let writeStreamClosed = false;
    writeStream.on('close', () => {
      writeStreamClosed = true;
      // console.log('writeStreamClosed');
    });
    await assert.rejects(async () => {
      await urllib.request(`${_url}mock-bytes?size=1024&timeout=200`, {
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
  if (!process.version.startsWith('v14.') && !process.version.startsWith('v16.')) {
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
        // console.error(err);
        assert.equal(err.name, 'Error');
        assert.equal(err.code, 'ENOENT');
        assert.match(err.message, /no such file or directory/);
        assert.equal(writeStream.destroyed, true);
        return true;
      });
      assert.equal(writeStream.destroyed, true);
      assert.equal(writeStreamError, true);
    });
  }
});
