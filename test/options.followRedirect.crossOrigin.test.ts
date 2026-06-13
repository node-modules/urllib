import { strict as assert } from 'node:assert';

import { describe, it, beforeAll, afterAll } from 'vite-plus/test';

import urllib, { HttpClient } from '../src/index.js';
import { startServer } from './fixtures/server.js';

// On a cross-origin redirect, credential-bearing request headers
// (Authorization, Cookie, Proxy-Authorization) must NOT be forwarded
// to the new origin. Same-origin redirects should keep them.
describe('options.followRedirect.crossOrigin.test.ts', () => {
  let closeA: any;
  let closeB: any;
  let urlA: string;
  let urlB: string;

  beforeAll(async () => {
    const a = await startServer();
    const b = await startServer();
    closeA = a.closeServer;
    closeB = b.closeServer;
    urlA = a.url;
    urlB = b.url;
  });

  afterAll(async () => {
    await closeA();
    await closeB();
  });

  const credentialHeaders = {
    Authorization: 'Bearer LIVE-AUTH',
    Cookie: 'session=LIVE-COOKIE',
    'Proxy-Authorization': 'Bearer proxy-LIVE',
  };

  // `from` redirects (302) to absolute url `to`
  const buildRedirectUrl = (from: string, to: string) => `${from}redirect-to?url=${encodeURIComponent(to)}`;
  // headers the final target actually received, echoed back via x-request-headers
  const receivedHeaders = (response: { headers: Record<string, string | string[] | undefined> }) =>
    JSON.parse(response.headers['x-request-headers'] as string);

  it('should NOT forward credential headers on cross-origin redirect', async () => {
    // server A redirects to a DIFFERENT origin (server B, different port)
    const response = await urllib.request(buildRedirectUrl(urlA, `${urlB}hello/json`), {
      dataType: 'json',
      headers: { ...credentialHeaders },
    });
    assert.equal(response.status, 200);
    assert.equal(response.requestUrls.length, 2);
    const received = receivedHeaders(response);
    assert.equal(received.authorization, undefined, 'authorization must be stripped cross-origin');
    assert.equal(received.cookie, undefined, 'cookie must be stripped cross-origin');
    assert.equal(received['proxy-authorization'], undefined, 'proxy-authorization must be stripped cross-origin');
  });

  it('should keep credential headers on same-origin redirect', async () => {
    const response = await urllib.request(buildRedirectUrl(urlA, `${urlA}hello/json`), {
      dataType: 'json',
      headers: { ...credentialHeaders },
    });
    assert.equal(response.status, 200);
    assert.equal(response.requestUrls.length, 2);
    const received = receivedHeaders(response);
    assert.equal(received.authorization, 'Bearer LIVE-AUTH');
    assert.equal(received.cookie, 'session=LIVE-COOKIE');
    assert.equal(received['proxy-authorization'], 'Bearer proxy-LIVE');
  });

  it('should NOT forward credential headers when redirected cross-origin and back to the original origin', async () => {
    // A -> B (cross-origin) -> A (back to original origin)
    // Once stripped at the boundary, credentials must stay stripped.
    const viaB = buildRedirectUrl(urlB, `${urlA}hello/json`);
    const response = await urllib.request(buildRedirectUrl(urlA, viaB), {
      dataType: 'json',
      headers: { ...credentialHeaders },
    });
    assert.equal(response.status, 200);
    assert.equal(response.requestUrls.length, 3);
    const received = receivedHeaders(response);
    assert.equal(received.authorization, undefined);
    assert.equal(received.cookie, undefined);
    assert.equal(received['proxy-authorization'], undefined);
  });

  it('should NOT re-inject Basic auth (options.auth) on cross-origin redirect', async () => {
    const response = await urllib.request(buildRedirectUrl(urlA, `${urlB}hello/json`), {
      dataType: 'json',
      auth: 'user:passwd',
    });
    assert.equal(response.status, 200);
    const received = receivedHeaders(response);
    assert.equal(received.authorization, undefined, 'Basic auth must not be sent cross-origin');
  });

  it('should keep Basic auth (options.auth) on same-origin redirect', async () => {
    const response = await urllib.request(buildRedirectUrl(urlA, `${urlA}hello/json`), {
      dataType: 'json',
      auth: 'user:passwd',
    });
    assert.equal(response.status, 200);
    const received = receivedHeaders(response);
    assert.equal(received.authorization, `Basic ${Buffer.from('user:passwd').toString('base64')}`);
  });

  it('should NOT re-inject defaultArgs credentials cross-origin when called without per-call options', async () => {
    // defaultArgs.auth + request(url) with no options object: the strip path
    // must still run, otherwise Basic auth is re-applied on the new origin.
    const client = new HttpClient({ defaultArgs: { auth: 'user:passwd' } });
    const response = await client.request(buildRedirectUrl(urlA, `${urlB}hello/json`));
    assert.equal(response.status, 200);
    const received = receivedHeaders(response);
    assert.equal(received.authorization, undefined, 'defaultArgs Basic auth must not be sent cross-origin');
  });

  it('should keep defaultArgs credentials on same-origin redirect when called without per-call options', async () => {
    const client = new HttpClient({ defaultArgs: { auth: 'user:passwd' } });
    const response = await client.request(buildRedirectUrl(urlA, `${urlA}hello/json`));
    assert.equal(response.status, 200);
    const received = receivedHeaders(response);
    assert.equal(received.authorization, `Basic ${Buffer.from('user:passwd').toString('base64')}`);
  });

  it('should not mutate the caller-supplied options.headers on cross-origin redirect', async () => {
    const headers = { ...credentialHeaders };
    await urllib.request(buildRedirectUrl(urlA, `${urlB}hello/json`), {
      dataType: 'json',
      headers,
    });
    // the original object the caller passed must be untouched
    assert.deepEqual(headers, credentialHeaders);
  });
});
