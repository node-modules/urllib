import { strict as assert } from 'node:assert';
import { createWriteStream, createReadStream } from 'node:fs';

import { describe, it, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

import urllib from '../src/index.js';
import { startServer } from './fixtures/server.js';
import { createTempfile } from './utils.js';

describe('options.socketErrorRetry.test.ts', () => {
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

  it('should auto retry on socket error and still fail', async () => {
    await assert.rejects(
      async () => {
        await urllib.request(`${_url}error`, {
          dataType: 'json',
        });
      },
      (err: any) => {
        assert.equal(err.res.retries, 0);
        assert.equal(err.res.socketErrorRetries, 1);
        return true;
      },
    );
  });

  it('should auto retry on socket error and success', async () => {
    const response = await urllib.request(`${_url}error-non-retry`, {
      dataType: 'json',
    });
    assert.equal(response.res.socketErrorRetries, 1);
  });

  it('should not retry on streaming request', async () => {
    await assert.rejects(
      async () => {
        await urllib.request(`${_url}error`, {
          streaming: true,
        });
      },
      (err: any) => {
        assert.equal(err.res.retries, 0);
        assert.equal(err.res.socketErrorRetries, 0);
        return true;
      },
    );

    const writeStream = createWriteStream(tmpfile);
    await assert.rejects(
      async () => {
        await urllib.request(`${_url}error`, {
          writeStream,
        });
      },
      (err: any) => {
        assert.equal(err.res.retries, 0);
        assert.equal(err.res.socketErrorRetries, 0);
        return true;
      },
    );

    await assert.rejects(
      async () => {
        await urllib.request(`${_url}error`, {
          files: createReadStream(__filename),
        });
      },
      (err: any) => {
        assert.equal(err.res.retries, 0);
        assert.equal(err.res.socketErrorRetries, 0);
        return true;
      },
    );
  });
});
