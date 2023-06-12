import { strict as assert } from 'node:assert';
import diagnosticsChannel from 'node:diagnostics_channel';
import { describe, it, beforeEach, afterEach } from 'vitest';
import urllib from '../src';
import type {
  RequestDiagnosticsMessage,
  ResponseDiagnosticsMessage,
} from '../src';
import symbols from '../src/symbols';
import { startServer } from './fixtures/server';
import { sleep } from './utils';

describe('diagnostics_channel.test.ts', () => {
  let close: any;
  let _url: string;
  beforeEach(async () => {
    const { closeServer, url } = await startServer();
    close = closeServer;
    _url = url;
  });

  afterEach(async () => {
    await close();
  });

  it('should support trace socket info by undici:client:sendHeaders and undici:request:trailers', async () => {
    const kRequests = Symbol('requests');
    let lastRequestOpaque: any;
    let kHandler: any;
    function onMessage(message: any, name: string | symbol) {
      if (name === 'undici:client:connected') {
        // console.log('%s %j', name, message.connectParams);
        message.socket[kRequests] = 0;
        return;
      }
      const { request, socket } = message;
      if (!kHandler) {
        const symbols = Object.getOwnPropertySymbols(request);
        for (const symbol of symbols) {
          if (symbol.description === 'handler') {
            kHandler = symbol;
            break;
          }
        }
      }
      const opaque = request[kHandler].opts.opaque[symbols.kRequestOrginalOpaque];
      if (opaque && name === 'undici:client:sendHeaders' && socket) {
        socket[kRequests]++;
        opaque.tracer.socket = {
          localAddress: socket.localAddress,
          localPort: socket.localPort,
          remoteAddress: socket.remoteAddress,
          remotePort: socket.remotePort,
          remoteFamily: socket.remoteFamily,
          timeout: socket.timeout,
          bytesWritten: socket.bytesWritten,
          bytesRead: socket.bytesRead,
          requests: socket[kRequests],
        };
      }
      // console.log('%s emit, %s %s, opaque: %j', name, request.method, request.origin, opaque);
      lastRequestOpaque = opaque;
      // console.log(request);
    }
    diagnosticsChannel.channel('undici:client:connected').subscribe(onMessage);
    diagnosticsChannel.channel('undici:client:sendHeaders').subscribe(onMessage);
    diagnosticsChannel.channel('undici:request:trailers').subscribe(onMessage);

    let traceId = `mock-traceid-${Date.now()}`;
    // _url = 'https://registry.npmmirror.com/';
    let response = await urllib.request(_url, {
      method: 'HEAD',
      dataType: 'json',
      opaque: {
        tracer: { traceId },
      },
    });
    assert.equal(response.status, 200);
    assert(response.url.startsWith(_url));
    assert(!response.redirected);
    assert.equal(lastRequestOpaque.tracer.traceId, traceId);
    assert(lastRequestOpaque.tracer.socket);
    assert.equal(lastRequestOpaque.tracer.socket.requests, 1);

    // HEAD 请求不会 keepalive
    // GET 请求会走 keepalive
    await sleep(1);
    traceId = `mock-traceid-${Date.now()}`;
    response = await urllib.request(_url, {
      method: 'GET',
      dataType: 'json',
      opaque: {
        tracer: { traceId },
      },
    });
    assert.equal(response.status, 200);
    assert.equal(lastRequestOpaque.tracer.traceId, traceId);
    assert(lastRequestOpaque.tracer.socket);
    assert.equal(lastRequestOpaque.tracer.socket.requests, 1);

    await sleep(1);
    traceId = `mock-traceid-${Date.now()}`;
    response = await urllib.request(_url, {
      method: 'GET',
      dataType: 'json',
      opaque: {
        tracer: { traceId },
      },
    });
    assert.equal(response.status, 200);
    assert.equal(lastRequestOpaque.tracer.traceId, traceId);
    assert(lastRequestOpaque.tracer.socket);
    assert.equal(lastRequestOpaque.tracer.socket.requests, 2);

    // socket 复用 1000 次
    let count = 1000;
    while (count-- > 0) {
      await sleep(1);
      traceId = `mock-traceid-${Date.now()}`;
      response = await urllib.request(_url, {
        method: 'GET',
        dataType: 'json',
        opaque: {
          tracer: { traceId },
        },
      });
      assert.equal(response.status, 200);
      assert.equal(lastRequestOpaque.tracer.traceId, traceId);
      assert(lastRequestOpaque.tracer.socket);
      assert.equal(lastRequestOpaque.tracer.socket.requests, 2 + 1000 - count);
    }

    diagnosticsChannel.channel('undici:client:connected').unsubscribe(onMessage);
    diagnosticsChannel.channel('undici:client:sendHeaders').unsubscribe(onMessage);
    diagnosticsChannel.channel('undici:request:trailers').unsubscribe(onMessage);
  });

  it('should support trace request by urllib:request and urllib:response', async () => {
    let lastRequestOpaque: any;
    let socket: any;
    function onRequestMessage(message: unknown) {
      const { request } = message as RequestDiagnosticsMessage;
      lastRequestOpaque = request.args.opaque;
    }
    function onResponseMessage(message: unknown) {
      const { request, response } = message as ResponseDiagnosticsMessage;
      socket = response.socket;
      assert.equal(request.args.opaque, lastRequestOpaque);
    }
    if (typeof diagnosticsChannel.subscribe === 'function') {
      diagnosticsChannel.subscribe('urllib:request', onRequestMessage);
      diagnosticsChannel.subscribe('urllib:response', onResponseMessage);
    } else {
      diagnosticsChannel.channel('urllib:request').subscribe(onRequestMessage);
      diagnosticsChannel.channel('urllib:response').subscribe(onResponseMessage);
    }

    let traceId = `mock-traceid-${Date.now()}`;
    // _url = 'https://registry.npmmirror.com/';
    let response = await urllib.request(_url, {
      method: 'HEAD',
      dataType: 'json',
      opaque: {
        tracer: { traceId },
      },
    });
    assert.equal(response.status, 200);
    assert(response.url.startsWith(_url));
    assert(!response.redirected);
    assert(socket);
    assert.equal(socket.handledRequests, 1);
    assert.equal(socket.handledResponses, 1);
    assert.equal(lastRequestOpaque.tracer.traceId, traceId);

    // HEAD 请求不会 keepalive
    // GET 请求会走 keepalive
    await sleep(1);
    traceId = `mock-traceid-${Date.now()}`;
    response = await urllib.request(_url, {
      method: 'GET',
      dataType: 'json',
      opaque: {
        tracer: { traceId },
      },
    });
    assert.equal(response.status, 200);
    assert.equal(lastRequestOpaque.tracer.traceId, traceId);
    assert(socket);
    assert.equal(socket.handledRequests, 1);
    assert.equal(socket.handledResponses, 1);

    await sleep(1);
    traceId = `mock-traceid-${Date.now()}`;
    response = await urllib.request(_url, {
      method: 'GET',
      dataType: 'json',
      opaque: {
        tracer: { traceId },
      },
    });
    assert.equal(response.status, 200);
    assert.equal(lastRequestOpaque.tracer.traceId, traceId);
    assert(socket);
    assert.equal(socket.handledRequests, 2);
    assert.equal(socket.handledResponses, 2);

    // socket 复用 1000 次
    let count = 1000;
    while (count-- > 0) {
      await sleep(1);
      traceId = `mock-traceid-${Date.now()}`;
      response = await urllib.request(_url, {
        method: 'GET',
        dataType: 'json',
        opaque: {
          tracer: { traceId },
        },
      });
      assert.equal(response.status, 200);
      assert.equal(lastRequestOpaque.tracer.traceId, traceId);
      assert(socket);
      assert.equal(socket.handledRequests, 2 + 1000 - count);
      assert.equal(socket.handledResponses, 2 + 1000 - count);
    }

    if (typeof diagnosticsChannel.unsubscribe === 'function') {
      diagnosticsChannel.unsubscribe('urllib:request', onRequestMessage);
      diagnosticsChannel.unsubscribe('urllib:response', onResponseMessage);
    } else {
      diagnosticsChannel.channel('urllib:request').unsubscribe(onRequestMessage);
      diagnosticsChannel.channel('urllib:response').unsubscribe(onResponseMessage);
    }
  });
});
