import { describe, it, beforeAll, afterAll } from 'vitest';
import { strict as assert } from 'assert';
import urllib from '../src';
import { HttpClientResponseMeta } from '../src/Response';
import { startServer } from './fixtures/server';

describe('options.timing.test.ts', () => {
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

  it('should timing = true work', async () => {
    const response = await urllib.request(`${_url}?content-encoding=gzip`, {
      dataType: 'json',
      timing: true,
    });
    assert.equal(response.status, 200);
    const res = response.res as HttpClientResponseMeta;
    assert(res.timing.waiting > 0);
    assert(res.timing.contentDownload > 0);
    assert(res.timing.contentDownload > res.timing.waiting);
    assert.equal(res.timing.contentDownload, res.rt);
  });

  it('should timing = false work', async () => {
    const response = await urllib.request(`${_url}?content-encoding=gzip`, {
      dataType: 'json',
      timing: false,
    });
    assert.equal(response.status, 200);
    const res = response.res as HttpClientResponseMeta;
    assert.equal(res.timing.waiting, 0);
    assert.equal(res.timing.contentDownload, 0);
    assert(res.rt > 0);
  });

  it('should timing default to false', async () => {
    const response = await urllib.request(`${_url}?content-encoding=gzip`, {
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    const res = response.res as HttpClientResponseMeta;
    assert.equal(res.timing.waiting, 0);
    assert.equal(res.timing.contentDownload, 0);
    assert(res.rt > 0);
  });
});
