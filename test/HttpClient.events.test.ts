
import { describe, it, beforeAll, afterAll } from 'vitest';
import { strict as assert } from 'assert';
import { HttpClient } from '../src';
import { startServer } from './fixtures/server';

describe('HttpClient.events.test.ts', () => {
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

  it('should emit request and response events', async () => {
    const httpclient = new HttpClient();
    let requestCount = 0;
    let responseCount = 0;
    httpclient.on('request', info => {
      requestCount++;
      // console.log(info);
      assert.equal(info.url, _url);
      assert(info.requestId > 0);
      assert.equal(info.args.opaque.requestId, `mock-request-id-${requestCount}`);
      if (requestCount === 1) {
        assert.deepEqual(info.ctx, { foo: 'bar' });
      } else {
        assert.equal(info.ctx, undefined);
      }
    });
    httpclient.on('response', info => {
      responseCount++;
      // console.log(info);
      assert.equal(info.req.args.opaque.requestId, `mock-request-id-${requestCount}`);
      assert.equal(info.req.options, info.req.args);
      assert.equal(info.res.status, 200);
      assert.equal(info.requestId, info.req.requestId);

      if (responseCount === 1) {
        assert.deepEqual(info.ctx, { foo: 'bar' });
        assert.deepEqual(info.ctx, info.req.ctx);
        // timing false
        assert.equal(info.res.timing.requestHeadersSent, 0);
      } else {
        assert.equal(info.ctx, undefined);
        // timing true
        assert(info.res.timing.requestHeadersSent > 0);
      }
      // socket info
      assert(info.res.socket.remoteAddress);
      assert(info.res.socket.remotePort);
      assert(info.res.socket.localAddress);
      assert(info.res.socket.localPort);
    });

    let response = await httpclient.request(_url, {
      dataType: 'json',
      opaque: {
        requestId: 'mock-request-id-1',
      },
      ctx: { foo: 'bar' },
    });
    assert.equal(response.status, 200);
    assert.equal(response.data.method, 'GET');
    assert.equal(requestCount, 1);
    assert.equal(responseCount, 1);

    response = await httpclient.request(_url, {
      dataType: 'json',
      opaque: {
        requestId: 'mock-request-id-2',
      },
      timing: true,
    });
    assert.equal(response.status, 200);
    assert.equal(response.data.method, 'GET');

    assert.equal(requestCount, 2);
    assert.equal(responseCount, 2);
  });
});
