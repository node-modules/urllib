import assert from 'node:assert/strict';
import diagnosticsChannel from 'node:diagnostics_channel';
import { describe, it, beforeAll, afterAll } from 'vitest';
import { startServer } from './fixtures/server.js';
import {
  fetch, FetchDiagnosticsMessage, FetchFactory, FetchResponseDiagnosticsMessage,
} from '../src/fetch.js';
import { RequestDiagnosticsMessage, ResponseDiagnosticsMessage } from '../src/HttpClient.js';

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
    diagnosticsChannel.subscribe('urllib:request', msg => {
      requestDiagnosticsMessage = msg as RequestDiagnosticsMessage;
    });
    diagnosticsChannel.subscribe('urllib:response', msg => {
      responseDiagnosticsMessage = msg as ResponseDiagnosticsMessage;
    });
    diagnosticsChannel.subscribe('urllib:fetch:request', msg => {
      fetchDiagnosticsMessage = msg as FetchDiagnosticsMessage;
    });
    diagnosticsChannel.subscribe('urllib:fetch:response', msg => {
      fetchResponseDiagnosticsMessage = msg as FetchResponseDiagnosticsMessage;
    });
    FetchFactory.setClientOptions({});

    const response = await fetch(`${_url}html`);

    assert(response);
    assert(requestDiagnosticsMessage!.request);
    assert(responseDiagnosticsMessage!.request);
    assert(responseDiagnosticsMessage!.response);
    assert.equal(responseDiagnosticsMessage!.response.socket.localAddress, '127.0.0.1');

    assert(fetchDiagnosticsMessage!.fetch);
    assert(fetchResponseDiagnosticsMessage!.fetch);
    assert(fetchResponseDiagnosticsMessage!.response);
    assert(fetchResponseDiagnosticsMessage!.timingInfo);

    const stats = FetchFactory.getDispatcherPoolStats();
    assert(stats);
    assert(Object.keys(stats).length > 0);
  });
});
