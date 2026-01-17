import { strict as assert } from 'node:assert';
import { EventEmitter } from 'node:events';
import { setTimeout as sleep } from 'node:timers/promises';

import { describe, it, beforeAll, afterAll } from 'vite-plus/test';

import urllib from '../src/index.js';
import { startServer } from './fixtures/server.js';

describe('options.signal.test.ts', () => {
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

  it('should throw error when AbortController abort', async () => {
    await assert.rejects(
      async () => {
        const abortController = new AbortController();
        const p = urllib.request(`${_url}?timeout=2000`, {
          signal: abortController.signal,
        });
        await sleep(100);
        abortController.abort();
        await p;
      },
      (err: any) => {
        assert.equal(err.name, 'AbortError');
        assert.equal(err.message, 'This operation was aborted');
        assert.equal(err.code, 20);
        return true;
      },
    );
  });

  it('should throw error when EventEmitter emit abort event', async () => {
    await assert.rejects(
      async () => {
        const ee = new EventEmitter();
        const p = urllib.request(`${_url}?timeout=2000`, {
          signal: ee,
        });
        await sleep(100);
        ee.emit('abort');
        await p;
      },
      (err: any) => {
        // console.error(err);
        assert.equal(err.name, 'AbortError');
        assert.equal(err.message, 'Request aborted');
        assert.equal(err.code, 'UND_ERR_ABORTED');
        return true;
      },
    );
  });
});
