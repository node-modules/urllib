import { strict as assert } from 'node:assert';
import { describe, it, beforeAll, afterAll } from 'vitest';
import urllib from '../src';
import { startServer } from './fixtures/server';
import { sleep } from './utils';

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
    await assert.rejects(async () => {
      const abortController = new AbortController();
      const p = urllib.request(`${_url}?timeout=2000`, {
        signal: abortController.signal,
      });
      await sleep(100);
      abortController.abort();
      await p;
    }, (err: any) => {
      // console.error(err);
      assert.equal(err.name, 'AbortError');
      assert.equal(err.message, 'Request aborted');
      assert.equal(err.code, 'UND_ERR_ABORTED');
      return true;
    });
  });
});
