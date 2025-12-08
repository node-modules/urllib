import assert from 'node:assert/strict';
import diagnosticsChannel from 'node:diagnostics_channel';
import { setTimeout as sleep } from 'node:timers/promises';

import { Request } from 'undici';
import { describe, it, beforeAll, afterAll } from 'vitest';

import { fetch, FetchDiagnosticsMessage, FetchFactory, FetchResponseDiagnosticsMessage } from '../src/fetch.js';
import { RequestDiagnosticsMessage, ResponseDiagnosticsMessage } from '../src/HttpClient.js';
import { startServer } from './fixtures/server.js';

describe('fetch.test.ts', () => {
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

  it('fetch should work', async () => {
    let requestDiagnosticsMessage: RequestDiagnosticsMessage;
    let responseDiagnosticsMessage: ResponseDiagnosticsMessage;
    let fetchDiagnosticsMessage: FetchDiagnosticsMessage;
    let fetchResponseDiagnosticsMessage: FetchResponseDiagnosticsMessage;
    diagnosticsChannel.subscribe('urllib:request', (msg) => {
      requestDiagnosticsMessage = msg as RequestDiagnosticsMessage;
    });
    diagnosticsChannel.subscribe('urllib:response', (msg) => {
      responseDiagnosticsMessage = msg as ResponseDiagnosticsMessage;
    });
    diagnosticsChannel.subscribe('urllib:fetch:request', (msg) => {
      fetchDiagnosticsMessage = msg as FetchDiagnosticsMessage;
    });
    diagnosticsChannel.subscribe('urllib:fetch:response', (msg) => {
      fetchResponseDiagnosticsMessage = msg as FetchResponseDiagnosticsMessage;
    });
    FetchFactory.setClientOptions({});

    let response = await fetch(`${_url}html`);

    assert(response);
    assert(requestDiagnosticsMessage!.request);
    assert(responseDiagnosticsMessage!.request);
    assert(responseDiagnosticsMessage!.response);
    assert(responseDiagnosticsMessage!.response.socket.localAddress);
    assert(['127.0.0.1', '::1'].includes(responseDiagnosticsMessage!.response.socket.localAddress));

    assert(fetchDiagnosticsMessage!.fetch);
    assert(fetchResponseDiagnosticsMessage!.fetch);
    assert(fetchResponseDiagnosticsMessage!.response);
    assert(fetchResponseDiagnosticsMessage!.timingInfo);

    await sleep(1);
    // again, keep alive
    response = await fetch(`${_url}html`);
    assert(responseDiagnosticsMessage!.response.socket.handledRequests > 1);
    assert(responseDiagnosticsMessage!.response.socket.handledResponses > 1);

    const stats = FetchFactory.getDispatcherPoolStats();
    assert(stats);
    assert(Object.keys(stats).length > 0);
  });

  it('fetch error should has socket info', async () => {
    let requestDiagnosticsMessage: RequestDiagnosticsMessage;
    let responseDiagnosticsMessage: ResponseDiagnosticsMessage;
    let fetchDiagnosticsMessage: FetchDiagnosticsMessage;
    let fetchResponseDiagnosticsMessage: FetchResponseDiagnosticsMessage;
    diagnosticsChannel.subscribe('urllib:request', (msg) => {
      requestDiagnosticsMessage = msg as RequestDiagnosticsMessage;
    });
    diagnosticsChannel.subscribe('urllib:response', (msg) => {
      responseDiagnosticsMessage = msg as ResponseDiagnosticsMessage;
    });
    diagnosticsChannel.subscribe('urllib:fetch:request', (msg) => {
      fetchDiagnosticsMessage = msg as FetchDiagnosticsMessage;
    });
    diagnosticsChannel.subscribe('urllib:fetch:response', (msg) => {
      fetchResponseDiagnosticsMessage = msg as FetchResponseDiagnosticsMessage;
    });
    FetchFactory.setClientOptions({});

    await assert.rejects(
      async () => {
        await fetch(`${_url}html?timeout=9999`, {
          signal: AbortSignal.timeout(100),
        });
      },
      (err: any) => {
        assert.equal(err.name, 'TimeoutError');
        assert.equal(err.message, 'The operation was aborted due to timeout');
        return true;
      },
    );

    assert(requestDiagnosticsMessage!.request);
    assert(responseDiagnosticsMessage!.request);
    assert(responseDiagnosticsMessage!.response);
    assert(responseDiagnosticsMessage!.response.socket.localAddress);
    assert(['127.0.0.1', '::1'].includes(responseDiagnosticsMessage!.response.socket.localAddress));

    assert(fetchDiagnosticsMessage!.fetch);
    assert(fetchResponseDiagnosticsMessage!.fetch);

    const stats = FetchFactory.getDispatcherPoolStats();
    assert(stats);
    assert(Object.keys(stats).length > 0, `dispatcher pool stats: ${JSON.stringify(stats)}`);
  });

  it('fetch request with post should work', async () => {
    await assert.doesNotReject(async () => {
      const request = new Request(_url, {
        method: 'POST',
        body: 'test-body',
      });
      await fetch(request);
    }, /Cannot construct a Request with a Request object that has already been used/);
  });

  it('fetch with new FetchFactory instance should work', async () => {
    let requestDiagnosticsMessage: RequestDiagnosticsMessage;
    let responseDiagnosticsMessage: ResponseDiagnosticsMessage;
    let fetchDiagnosticsMessage: FetchDiagnosticsMessage;
    let fetchResponseDiagnosticsMessage: FetchResponseDiagnosticsMessage;
    diagnosticsChannel.subscribe('urllib:request', (msg) => {
      requestDiagnosticsMessage = msg as RequestDiagnosticsMessage;
    });
    diagnosticsChannel.subscribe('urllib:response', (msg) => {
      responseDiagnosticsMessage = msg as ResponseDiagnosticsMessage;
    });
    diagnosticsChannel.subscribe('urllib:fetch:request', (msg) => {
      fetchDiagnosticsMessage = msg as FetchDiagnosticsMessage;
    });
    diagnosticsChannel.subscribe('urllib:fetch:response', (msg) => {
      fetchResponseDiagnosticsMessage = msg as FetchResponseDiagnosticsMessage;
    });
    const factory = new FetchFactory();
    factory.setClientOptions({});
    let response = await factory.fetch(`${_url}html`);

    assert(response);
    assert(requestDiagnosticsMessage!.request);
    assert(responseDiagnosticsMessage!.request);
    assert(responseDiagnosticsMessage!.response);
    assert(responseDiagnosticsMessage!.response.socket.localAddress);
    assert(['127.0.0.1', '::1'].includes(responseDiagnosticsMessage!.response.socket.localAddress));

    assert(fetchDiagnosticsMessage!.fetch);
    assert(fetchResponseDiagnosticsMessage!.fetch);
    assert(fetchResponseDiagnosticsMessage!.response);
    assert(fetchResponseDiagnosticsMessage!.timingInfo);

    await sleep(1);
    // again, keep alive
    response = await factory.fetch(`${_url}html`);
    assert(responseDiagnosticsMessage!.response.socket.handledRequests > 1);
    assert(responseDiagnosticsMessage!.response.socket.handledResponses > 1);

    const stats = factory.getDispatcherPoolStats();
    assert(stats);
    assert(Object.keys(stats).length > 0);
  });
});
