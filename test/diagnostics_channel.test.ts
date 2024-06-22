import { strict as assert } from 'node:assert';
import diagnosticsChannel from 'node:diagnostics_channel';
import { setTimeout as sleep } from 'node:timers/promises';
import { describe, it, beforeEach, afterEach } from 'vitest';
import urllib from '../src/index.js';
import type {
  RequestDiagnosticsMessage,
  ResponseDiagnosticsMessage,
} from '../src/index.js';
import symbols from '../src/symbols.js';
import { startServer } from './fixtures/server.js';

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
      const opaque = request[kHandler].opts.opaque[symbols.kRequestOriginalOpaque];
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
    diagnosticsChannel.subscribe('undici:client:connected', onMessage);
    diagnosticsChannel.subscribe('undici:client:sendHeaders', onMessage);
    diagnosticsChannel.subscribe('undici:request:trailers', onMessage);

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

    diagnosticsChannel.unsubscribe('undici:client:connected', onMessage);
    diagnosticsChannel.unsubscribe('undici:client:sendHeaders', onMessage);
    diagnosticsChannel.unsubscribe('undici:request:trailers', onMessage);
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
    diagnosticsChannel.subscribe('urllib:request', onRequestMessage);
    diagnosticsChannel.subscribe('urllib:response', onResponseMessage);

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

    diagnosticsChannel.unsubscribe('urllib:request', onRequestMessage);
    diagnosticsChannel.unsubscribe('urllib:response', onResponseMessage);
  });

  it('should support trace request error by urllib:request and urllib:response', async () => {
    let lastRequestOpaque: any;
    let socket: any;
    let lastError: Error | undefined;
    function onRequestMessage(message: unknown) {
      const { request } = message as RequestDiagnosticsMessage;
      lastRequestOpaque = request.args.opaque;
    }
    function onResponseMessage(message: unknown) {
      const { request, response, error } = message as ResponseDiagnosticsMessage;
      socket = response.socket;
      assert.equal(request.args.opaque, lastRequestOpaque);
      lastError = error;
    }
    diagnosticsChannel.subscribe('urllib:request', onRequestMessage);
    diagnosticsChannel.subscribe('urllib:response', onResponseMessage);

    let traceId = `mock-traceid-${Date.now()}`;
    // handle network error
    await assert.rejects(async () => {
      await urllib.request(`${_url}error`, {
        method: 'GET',
        dataType: 'json',
        opaque: {
          tracer: { traceId },
        },
      });
    }, err => {
      assert(err);
      assert(lastError);
      assert.equal(err, lastError);
      assert.equal(err.name, 'SocketError');
      assert.equal(err.message, 'other side closed');
      assert.equal((err as any).code, 'UND_ERR_SOCKET');
      assert.equal((err as any).res.socket, socket);
      assert.equal((err as any).socket, socket);
      assert((err as any)._rawSocket);
      return true;
    });
    assert(socket);
    assert.equal(socket.handledRequests, 1);
    assert.equal(socket.handledResponses, 0);
    assert.equal(lastRequestOpaque.tracer.traceId, traceId);
    assert(socket.connectedTime);
    assert.equal(socket.lastRequestEndTime, undefined);
    assert(socket.localAddress);
    assert(socket.localPort);
    assert(socket.remoteAddress);
    assert(socket.remotePort);

    await sleep(1);
    traceId = `mock-traceid-${Date.now()}`;
    const response = await urllib.request(_url, {
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

    // handle response decode error, not network error
    await sleep(1);
    await assert.rejects(async () => {
      await urllib.request(`${_url}error-gzip`, {
        method: 'GET',
        dataType: 'json',
        opaque: {
          tracer: { traceId },
        },
      });
    }, err => {
      assert(lastError);
      assert.equal(err, lastError);
      assert.equal(err.name, 'UnzipError');
      assert.equal(err.message, 'incorrect header check');
      assert.equal((err as any).code, 'Z_DATA_ERROR');
      assert.equal((err as any).res.socket, socket);
      assert.equal((err as any).socket, socket);
      assert.equal((err as any)._rawSocket, undefined);
      return true;
    });
    assert.equal(socket.handledRequests, 2);
    assert.equal(socket.handledResponses, 2);

    diagnosticsChannel.unsubscribe('urllib:request', onRequestMessage);
    diagnosticsChannel.unsubscribe('urllib:response', onResponseMessage);
  });
});
