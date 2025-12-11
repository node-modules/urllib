import { strict as assert } from 'node:assert';
import { setTimeout as sleep } from 'node:timers/promises';

import { describe, it, beforeAll, afterAll } from 'vitest';

import urllib from '../src/index.js';
import type { RawResponseWithMeta } from '../src/index.js';
import { startServer } from './fixtures/server.js';

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
    let response = await urllib.request(`${_url}?content-encoding=gzip`, {
      dataType: 'json',
      timing: true,
    });
    assert.equal(response.status, 200);
    let res = response.res as RawResponseWithMeta;
    assert(res.timing.waiting > 0);
    assert(res.timing.queuing > 0);
    assert(res.timing.connected > 0);
    assert(res.timing.requestHeadersSent > 0);
    assert(res.timing.requestSent > 0);
    assert(res.timing.contentDownload > 0);
    assert(res.timing.contentDownload > res.timing.waiting);
    assert(res.timing.contentDownload <= res.rt);
    assert.equal(res.socket.handledResponses, 1);

    // again connected should be zero
    await sleep(1);

    response = await urllib.request(`${_url}?content-encoding=gzip`, {
      dataType: 'json',
      timing: true,
    });
    assert.equal(response.status, 200);
    res = response.res as RawResponseWithMeta;
    assert(res.timing.waiting > 0);
    assert(res.timing.queuing > 0);
    assert.equal(res.timing.connected, 0);
    assert(res.timing.requestHeadersSent > 0);
    assert(res.timing.requestSent > 0);
    assert(res.timing.contentDownload > 0);
    assert(res.timing.contentDownload > res.timing.waiting);
    assert(res.timing.contentDownload <= res.rt);
    assert.equal(res.socket.handledResponses, 2);
    // console.log(res.timing);
  });

  it('should timing = false work', async () => {
    const response = await urllib.request(`${_url}?content-encoding=gzip`, {
      dataType: 'json',
      timing: false,
    });
    assert.equal(response.status, 200);
    const res = response.res as RawResponseWithMeta;
    assert.equal(res.timing.waiting, 0);
    assert.equal(res.timing.contentDownload, 0);
    assert(res.rt > 0);
  });

  it('should timing default to true', async () => {
    const response = await urllib.request(`${_url}?content-encoding=gzip`, {
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    const res = response.res as RawResponseWithMeta;
    assert(res.timing.waiting > 0);
    assert(res.timing.contentDownload > 0);
    assert(res.rt > 0);
  });
});
