import assert from 'assert/strict';
import { join } from 'path';
import { createWriteStream } from 'fs';
import { rm, stat } from 'fs/promises';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import urllib from '../src';
import { startServer } from './fixtures/server';

describe('options.writeStream.test.ts', () => {
  let close: any;
  let _url: string;
  let tmpfile = join(tmpdir(), randomUUID());
  beforeAll(async () => {
    const { closeServer, url } = await startServer();
    close = closeServer;
    _url = url;
  });

  afterAll(async () => {
    await close();
    await rm(tmpfile, { force: true });
  });

  it('should same response to writeStream', async () => {
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
});
