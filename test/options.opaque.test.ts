import { strict as assert } from 'node:assert';

import { describe, it, beforeAll, afterAll } from 'vitest';

import urllib from '../src/index.js';
import { startServer } from './fixtures/server.js';

describe('options.opaque.test.ts', () => {
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

  it('should opaque work', async () => {
    const response = await urllib.request(_url, {
      dataType: 'json',
      opaque: {
        traceId: 'some random id here',
      },
    });
    assert.equal(response.status, 200);
    assert.deepEqual(response.opaque, {
      traceId: 'some random id here',
    });
  });

  it('should opaque work on error request', async () => {
    await assert.rejects(
      async () => {
        await urllib.request(`${_url}socket.end.error`, {
          opaque: {
            traceId: 'some random id here',
          },
        });
      },
      (err: any) => {
        // console.error(err);
        assert.equal(err.res.status, 200);
        assert.equal(err.name, 'HTTPParserError');
        assert.deepEqual(err.opaque, {
          traceId: 'some random id here',
        });
        return true;
      },
    );
  });
});
