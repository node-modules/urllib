import { strict as assert } from 'node:assert';
import { describe, it, beforeAll, afterAll } from 'vitest';
import urllib from '../src';
import { startServer } from './fixtures/server';

describe('options.socketErrorRetry.test.ts', () => {
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

  it('should auto retry on socket error and still fail', async () => {
    await assert.rejects(async () => {
      await urllib.request(`${_url}error`, {
        dataType: 'json',
        opaque: {
          requestId: 'mock-request-id-1',
        },
        ctx: { foo: 'bar' },
      });
    }, (err: any) => {
      assert.equal(err.res.retries, 0);
      assert.equal(err.res.socketErrorRetries, 1);
      return true;
    });
  });

  it('should auto retry on socket error and success', async () => {
    const response = await urllib.request(`${_url}error-non-retry`, {
      dataType: 'json',
      opaque: {
        requestId: 'mock-request-id-1',
      },
      ctx: { foo: 'bar' },
    });
    assert.equal(response.res.socketErrorRetries, 1);
  });

  it('should not retry on streaming', async () => {
    await assert.rejects(async () => {
      await urllib.request(`${_url}error`, {
        opaque: {
          requestId: 'mock-request-id-1',
        },
        ctx: { foo: 'bar' },
        streaming: true,
      });
    }, (err: any) => {
      assert.equal(err.res.retries, 0);
      assert.equal(err.res.socketErrorRetries, 0);
      return true;
    });
  });
});
