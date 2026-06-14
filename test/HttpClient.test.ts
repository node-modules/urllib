import { strict as assert } from 'node:assert';
import dns from 'node:dns';
import { once } from 'node:events';
import { sensitiveHeaders, createSecureServer } from 'node:http2';
import { createServer as createSecureHttp1Server } from 'node:https';
import type { AddressInfo } from 'node:net';
import { PerformanceObserver } from 'node:perf_hooks';
import { setTimeout as sleep } from 'node:timers/promises';

import selfsigned from 'selfsigned';
import { describe, it, beforeAll, afterAll } from 'vite-plus/test';

import { mergePoolStat, normalizePoolStatsKey } from '../src/HttpClient.js';
import { HttpClient, getDefaultHttpClient, getGlobalDispatcher } from '../src/index.js';
import type { RawResponseWithMeta } from '../src/index.js';
import { startServer } from './fixtures/server.js';

const pems = selfsigned.generate([], {
  keySize: 2048,
});

if (process.env.ENABLE_PERF) {
  const obs = new PerformanceObserver((items) => {
    items.getEntries().forEach((item) => {
      console.log('%j', item);
    });
  });
  obs.observe({
    entryTypes: ['net', 'dns', 'function', 'gc', 'http', 'http2', 'node'],
    buffered: true,
  });
}

describe('HttpClient.test.ts', () => {
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

  describe('.curl()', () => {
    it('should curl alias to request()', async () => {
      const httpclient = new HttpClient({ defaultArgs: { timeout: 1000 } });
      let response = await httpclient.curl(_url);
      assert.equal(response.status, 200);
      response = await httpclient.curl(_url, { method: 'GET' });
      assert.equal(response.status, 200);
    });
  });

  describe('clientOptions.allowH2', () => {
    it('should work with allowH2 = true', async () => {
      const httpClient = new HttpClient({
        allowH2: true,
      });
      const httpClient1 = new HttpClient({
        allowH2: false,
      });
      let response = await httpClient.request('https://registry.npmmirror.com/urllib');
      assert.equal(response.status, 200);
      // console.log(response.res.socket, response.res.timing);
      response = await httpClient1.request('https://registry.npmmirror.com/urllib');
      assert.equal(response.status, 200);
      // console.log(response.res.socket, response.res.timing);
      // assert.equal(sensitiveHeaders in response.headers, true);
      assert.equal(response.headers['content-type'], 'application/json; charset=utf-8');
      assert.notEqual(httpClient.getDispatcher(), getGlobalDispatcher());
      response = await httpClient.request('https://registry.npmmirror.com/urllib');
      assert.equal(response.status, 200);
      // assert.equal(sensitiveHeaders in response.headers, true);
      assert.equal(response.headers['content-type'], 'application/json; charset=utf-8');
      response = await httpClient.request('https://registry.npmmirror.com/urllib');
      assert.equal(response.status, 200);
      // assert.equal(sensitiveHeaders in response.headers, true);
      assert.equal(response.headers['content-type'], 'application/json; charset=utf-8');
      response = await httpClient.request('https://registry.npmmirror.com/urllib');
      assert.equal(response.status, 200);
      // assert.equal(sensitiveHeaders in response.headers, true);
      assert.equal(response.headers['content-type'], 'application/json; charset=utf-8');
      response = await httpClient.request('https://registry.npmmirror.com/urllib');
      assert.equal(response.status, 200);
      // assert.equal(sensitiveHeaders in response.headers, true);
      assert.equal(response.headers['content-type'], 'application/json; charset=utf-8');
      // console.log(response.res.socket, response.res.timing);
      await Promise.all([
        httpClient.request('https://registry.npmmirror.com/urllib'),
        httpClient.request('https://registry.npmmirror.com/urllib'),
        httpClient.request('https://registry.npmmirror.com/urllib'),
        httpClient.request('https://registry.npmmirror.com/urllib'),
      ]);

      // should request http 1.1 server work
      let response2 = await httpClient.request(_url);
      assert.equal(response2.status, 200);
      assert.equal(sensitiveHeaders in response2.headers, false);
      assert.equal(response2.headers['content-type'], 'application/json');
      response2 = await httpClient.request(_url);
      assert.equal(response2.status, 200);
      assert.equal(sensitiveHeaders in response2.headers, false);
      assert.equal(response2.headers['content-type'], 'application/json');
      response2 = await httpClient.request(_url);
      assert.equal(response2.status, 200);
      assert.equal(sensitiveHeaders in response2.headers, false);
      assert.equal(response2.headers['content-type'], 'application/json');
      response2 = await httpClient.request(_url);
      assert.equal(response2.status, 200);
      assert.equal(sensitiveHeaders in response2.headers, false);
      assert.equal(response2.headers['content-type'], 'application/json');
      response2 = await httpClient.request(_url);
      assert.equal(response2.status, 200);
      assert.equal(sensitiveHeaders in response2.headers, false);
      assert.equal(response2.headers['content-type'], 'application/json');
      await Promise.all([
        httpClient.request(_url),
        httpClient.request(_url),
        httpClient.request(_url),
        httpClient.request(_url),
      ]);
      // console.log(httpClient.getDispatcherPoolStats());
      // undici@8 negotiates HTTP/2 with h2-capable servers, so all requests are
      // multiplexed over a single connection instead of opening one per request.
      assert.equal(httpClient.getDispatcherPoolStats()['https://registry.npmmirror.com'].connected, 1);
      assert(httpClient.getDispatcherPoolStats()[_url.substring(0, _url.length - 1)].connected > 1);
    });

    it('should not exit after other side closed error', async () => {
      const server = createSecureServer({
        key: pems.private,
        cert: pems.cert,
      });

      let count = 0;
      server.on('stream', (stream, headers) => {
        count++;
        if (count === 2) {
          // SocketError: HTTP/2: "GOAWAY" frame received with code 0
          stream.session!.destroy();
          return;
        }
        assert.equal(headers[':method'], 'GET');
        stream.respond({
          'content-type': 'text/plain; charset=utf-8',
          'x-custom-h2': 'hello',
          ':status': 200,
        });
        stream.end('hello h2!');
      });

      server.listen(0);
      await once(server, 'listening');

      const httpClient = new HttpClient({
        allowH2: true,
        connect: {
          rejectUnauthorized: false,
        },
      });

      const url = `https://localhost:${(server.address() as AddressInfo).port}`;
      let response = await httpClient.request<string>(url, {
        dataType: 'text',
        headers: {
          'x-my-header': 'foo',
        },
      });
      assert.equal(response.status, 200);
      assert.equal(response.headers['x-custom-h2'], 'hello');
      // console.log(response.res.socket, response.res.timing);
      assert.equal(response.data, 'hello h2!');
      await sleep(200);
      response = await httpClient.request<string>(url, {
        dataType: 'text',
        headers: {
          'x-my-header': 'foo2',
        },
      });
      assert.equal(response.status, 200);
      assert.equal(response.headers['x-custom-h2'], 'hello');
      // console.log(response.res.socket, response.res.timing);
      assert.equal(response.data, 'hello h2!');
    });

    it('should auto redirect work', async () => {
      const server = createSecureServer({
        key: pems.private,
        cert: pems.cert,
      });

      let count = 0;
      server.on('stream', (stream, headers) => {
        count++;
        // console.log(count, headers);
        if (count === 2) {
          stream.respond({
            'content-type': 'text/plain; charset=utf-8',
            'x-custom-h2': 'hello',
            location: '/see-other',
            ':status': 302,
          });
          stream.end();
          return;
        }
        assert.equal(headers[':method'], 'GET');
        stream.respond({
          'content-type': 'text/plain; charset=utf-8',
          'x-custom-h2': 'hello',
          ':status': 200,
        });
        stream.end('hello h2!');
      });

      server.listen(0);
      await once(server, 'listening');

      const httpClient = new HttpClient({
        allowH2: true,
        connect: {
          rejectUnauthorized: false,
        },
      });

      const url = `https://localhost:${(server.address() as AddressInfo).port}`;
      let response = await httpClient.request<string>(url, {
        dataType: 'text',
        headers: {
          'x-my-header': 'foo',
        },
      });
      assert.equal(response.status, 200);
      assert.equal(response.headers['x-custom-h2'], 'hello');
      // console.log(response.res.socket, response.res.timing);
      assert.equal(response.data, 'hello h2!');
      await sleep(200);
      response = await httpClient.request<string>(url, {
        dataType: 'text',
        headers: {
          'x-my-header': 'foo2',
        },
        followRedirect: true,
      });
      assert.equal(response.status, 200);
      assert.equal(response.headers['x-custom-h2'], 'hello');
      // console.log(response.res.socket, response.res.timing);
      assert.equal(response.data, 'hello h2!');
    });
  });

  describe('protocol negotiation', () => {
    it('should use HTTP/1.1 when the server only supports HTTP/1.1', async () => {
      const server = createSecureHttp1Server(
        {
          key: pems.private,
          cert: pems.cert,
        },
        (req, res) => {
          res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
          res.end(`hello http/${req.httpVersion}!`);
        },
      );
      server.listen(0);
      await once(server, 'listening');
      const url = `https://localhost:${(server.address() as AddressInfo).port}`;

      const httpClient = new HttpClient({
        connect: { rejectUnauthorized: false },
      });
      try {
        const response = await httpClient.request<string>(url, { dataType: 'text' });
        assert.equal(response.status, 200);
        assert.equal(response.data, 'hello http/1.1!');
      } finally {
        await httpClient.getDispatcher().close();
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    });

    it('should negotiate HTTP/2 by default when the server supports it', async () => {
      // undici@8 enables allowH2 by default, so urllib negotiates HTTP/2 via ALPN.
      const server = createSecureServer({
        allowHTTP1: true,
        key: pems.private,
        cert: pems.cert,
      });
      server.on('request', (req, res) => {
        res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
        res.end(`hello http/${req.httpVersion}!`);
      });
      server.listen(0);
      await once(server, 'listening');
      const url = `https://localhost:${(server.address() as AddressInfo).port}`;

      const httpClient = new HttpClient({
        connect: { rejectUnauthorized: false },
      });
      try {
        const response = await httpClient.request<string>(url, { dataType: 'text' });
        assert.equal(response.status, 200);
        assert.equal(response.data, 'hello http/2.0!');
      } finally {
        await httpClient.getDispatcher().close();
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    });

    it('should force HTTP/1.1 with allowH2 = false even if the server supports HTTP/2', async () => {
      const server = createSecureServer({
        allowHTTP1: true,
        key: pems.private,
        cert: pems.cert,
      });
      server.on('request', (req, res) => {
        res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
        res.end(`hello http/${req.httpVersion}!`);
      });
      server.listen(0);
      await once(server, 'listening');
      const url = `https://localhost:${(server.address() as AddressInfo).port}`;

      const httpClient = new HttpClient({
        allowH2: false,
        connect: { rejectUnauthorized: false },
      });
      try {
        const response = await httpClient.request<string>(url, { dataType: 'text' });
        assert.equal(response.status, 200);
        assert.equal(response.data, 'hello http/1.1!');
      } finally {
        await httpClient.getDispatcher().close();
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    });

    it('should not create a dedicated dispatcher for allowH2: false', () => {
      // allowH2: true uses an isolated agent
      assert.notEqual(new HttpClient({ allowH2: true }).getDispatcher(), getGlobalDispatcher());
      // allowH2: false is applied per request, so it must keep using the active
      // (global) dispatcher instead of bypassing it with its own agent
      assert.equal(new HttpClient({ allowH2: false }).getDispatcher(), getGlobalDispatcher());
    });

    it('normalizePoolStatsKey should strip the http1-only suffix and tolerate non-string keys', () => {
      assert.equal(normalizePoolStatsKey('https://example.com'), 'https://example.com');
      assert.equal(normalizePoolStatsKey('https://example.com#http1-only'), 'https://example.com');
      // MockAgent may use RegExp/function origin matchers as client keys
      assert.equal(normalizePoolStatsKey(/example/), '/example/');
    });

    it('mergePoolStat should treat missing ClientStats counters as zero', () => {
      const pool = { connected: 1, free: 1, pending: 1, queued: 1, running: 1, size: 1 };
      // undici ClientStats (Agent with connections: 1) omit free/queued
      const clientStats = { connected: 2, pending: 1, running: 1, size: 2 } as any;
      const merged = mergePoolStat(pool, clientStats);
      assert.equal(merged.connected, 3);
      assert.equal(merged.free, 1);
      assert.equal(merged.queued, 1);
      assert(!Number.isNaN(merged.free) && !Number.isNaN(merged.queued));
    });

    it('should cache a distinct allowH2: false default client that still uses the global dispatcher', () => {
      // a dedicated cached client carries the allowH2: false preference so that
      // getDefaultHttpClient(undefined, false).request(url) forces HTTP/1.1 ...
      const disallowH2 = getDefaultHttpClient(undefined, false);
      assert.equal(disallowH2, getDefaultHttpClient(undefined, false));
      assert.notEqual(disallowH2, getDefaultHttpClient(undefined, undefined));
      assert.notEqual(disallowH2, getDefaultHttpClient(undefined, true));
      // ... without creating its own dispatcher (so global ProxyAgent/MockAgent is honored)
      assert.equal(disallowH2.getDispatcher(), getGlobalDispatcher());
    });

    it('should force HTTP/1.1 per request via allowH2: false and expose pool stats by origin', async () => {
      const server = createSecureServer({
        allowHTTP1: true,
        key: pems.private,
        cert: pems.cert,
      });
      server.on('request', (req, res) => {
        res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
        res.end(`hello http/${req.httpVersion}!`);
      });
      server.listen(0);
      await once(server, 'listening');
      const url = `https://localhost:${(server.address() as AddressInfo).port}`;

      // the client keeps its (HTTP/2-capable) dispatcher; allowH2: false is per request
      const httpClient = new HttpClient({ connect: { rejectUnauthorized: false } });
      try {
        const response = await httpClient.request<string>(url, { dataType: 'text', allowH2: false });
        assert.equal(response.status, 200);
        assert.equal(response.data, 'hello http/1.1!');

        // undici keys the http1-only pool as `${origin}#http1-only`; stats must be
        // reachable by the plain origin and not leak the internal suffix
        const stats = httpClient.getDispatcherPoolStats();
        assert(stats[url], `expected stats for ${url}, got ${Object.keys(stats).join(', ')}`);
        assert(!Object.keys(stats).some((k) => k.includes('#http1-only')));
      } finally {
        await httpClient.getDispatcher().close();
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    });

    it('should honor per-request allowH2: false for HttpAgent (checkAddress) clients', async () => {
      const server = createSecureServer({
        allowHTTP1: true,
        key: pems.private,
        cert: pems.cert,
      });
      server.on('request', (req, res) => {
        res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
        res.end(`hello http/${req.httpVersion}!`);
      });
      server.listen(0);
      await once(server, 'listening');
      const url = `https://localhost:${(server.address() as AddressInfo).port}`;

      // checkAddress routes through HttpAgent; allowH2 must stay top-level so the
      // per-request flag still reaches undici's connector (ALPN).
      const httpClient = new HttpClient({
        checkAddress: () => true,
        connect: { rejectUnauthorized: false },
      });
      try {
        const h1 = await httpClient.request<string>(url, { dataType: 'text', allowH2: false });
        assert.equal(h1.data, 'hello http/1.1!');
        const h2 = await httpClient.request<string>(url, { dataType: 'text' });
        assert.equal(h2.data, 'hello http/2.0!');
      } finally {
        await httpClient.getDispatcher().close();
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    });
  });

  describe('clientOptions.defaultArgs', () => {
    it('should work with custom defaultArgs', async () => {
      const httpclient = new HttpClient({ defaultArgs: { timeout: 1000 } });
      assert(httpclient);
    });
  });

  describe('clientOptions.lookup', () => {
    it('should work with custom lookup on HTTP protocol', async () => {
      let lookupCallCounter = 0;
      const httpclient = new HttpClient({
        // mock lookup delay
        lookup(...args) {
          lookupCallCounter++;
          setTimeout(() => {
            dns.lookup(...args);
          }, 100);
        },
      });
      let response = await httpclient.request(_url);
      assert.equal(lookupCallCounter, 1);
      assert.equal(response.status, 200);
      const res = response.res as RawResponseWithMeta;
      assert(res.rt > 100, `rt ${res.rt} should bigger than 100`);
      // will cache dns lookup
      let count = 10;
      while (count-- > 0) {
        response = await httpclient.request(_url);
      }
      assert(lookupCallCounter < 10, `${lookupCallCounter} should smaller than 10`);
    });

    it('should work with custom lookup on HTTPS protocol', async () => {
      let lookupCallCounter = 0;
      const httpclient = new HttpClient({
        // mock lookup delay
        lookup(...args) {
          lookupCallCounter++;
          setTimeout(() => {
            dns.lookup(...args);
          }, 100);
        },
      });
      let response = await httpclient.request('https://registry.npmmirror.com/urllib');
      assert.equal(lookupCallCounter, 1);
      assert.equal(response.status, 200);
      const res = response.res as RawResponseWithMeta;
      // console.log(res);
      assert(res.rt > 100, `rt ${res.rt} should bigger than 100`);
      // will cache dns lookup
      let count = 5;
      while (count-- > 0) {
        response = await httpclient.request(_url);
      }
      assert(lookupCallCounter < 5, `${lookupCallCounter} should smaller than 5`);
    });
  });

  describe('clientOptions.checkAddress', () => {
    it('should check non-ip hostname', async () => {
      let count = 0;
      const httpclient = new HttpClient({
        checkAddress() {
          count++;
          if (count === 1) return false;
          return true;
        },
      });
      assert.equal(Object.keys(httpclient.getDispatcherPoolStats()).length, 0);

      await assert.rejects(
        async () => {
          await httpclient.request(_url);
        },
        (err: any) => {
          // console.error(err);
          assert.equal(err.res.status, -1);
          assert.equal(err.name, 'IllegalAddressError');
          assert.equal(err.message, 'illegal address');
          assert.equal(err.hostname, 'localhost');
          assert.equal(typeof err.ip, 'string');
          assert(err.family === 4 || err.family === 6);
          return true;
        },
      );

      const response = await httpclient.request(_url);
      assert.equal(response.status, 200);
      assert.equal(
        Object.keys(httpclient.getDispatcherPoolStats()).length,
        1,
        `dispatcher pool stats: ${JSON.stringify(httpclient.getDispatcherPoolStats())}`,
      );
    });

    it('should check non-ip hostname with custom lookup', async () => {
      let count = 0;
      let lookupCallCounter = 0;
      const httpclient = new HttpClient({
        lookup(...args) {
          lookupCallCounter++;
          setTimeout(() => {
            dns.lookup(...args);
          }, 100);
        },
        checkAddress() {
          count++;
          if (count === 1) return false;
          return true;
        },
      });

      await assert.rejects(
        async () => {
          await httpclient.request(_url);
        },
        (err: any) => {
          // console.error(err);
          assert.equal(err.res.status, -1);
          assert.equal(err.name, 'IllegalAddressError');
          assert.equal(err.message, 'illegal address');
          assert.equal(err.hostname, 'localhost');
          assert.equal(typeof err.ip, 'string');
          assert(err.family === 4 || err.family === 6);
          return true;
        },
      );
      assert.equal(lookupCallCounter, 1);

      const response = await httpclient.request(_url);
      assert.equal(response.status, 200);
    });

    it('should check ip hostname', async () => {
      let count = 0;
      const httpclient = new HttpClient({
        checkAddress() {
          count++;
          if (count === 1) return false;
          return true;
        },
      });

      await assert.rejects(
        async () => {
          await httpclient.request(_url.replace('localhost', '127.0.0.1'));
        },
        (err: any) => {
          // console.error(err);
          assert.equal(err.res.status, -1);
          assert.equal(err.name, 'IllegalAddressError');
          assert.equal(err.message, 'illegal address');
          assert.equal(err.hostname, '127.0.0.1');
          assert.equal(err.ip, '127.0.0.1');
          assert(err.family === 4);
          return true;
        },
      );

      const response = await httpclient.request(_url.replace('localhost', '127.0.0.1'));
      assert.equal(response.status, 200);
    });

    it('should throw error when request address is ip v6', async () => {
      const httpclient = new HttpClient({
        checkAddress(_address, family) {
          return family !== 6;
        },
      });

      await assert.rejects(
        async () => {
          await httpclient.request('http://[::1]/foo/bar');
        },
        (err: any) => {
          // console.error(err);
          assert.equal(err.name, 'IllegalAddressError');
          assert.equal(err.message, 'illegal address');
          assert.equal(err.hostname, '::1');
          assert.equal(err.ip, '::1');
          assert(err.family === 6);
          return true;
        },
      );

      await assert.rejects(
        async () => {
          await httpclient.request('http://[2001:0DB8:02de::0e13]/foo/bar');
        },
        (err: any) => {
          // console.error(err);
          assert.equal(err.res.status, -1);
          assert.equal(err.name, 'IllegalAddressError');
          assert.equal(err.message, 'illegal address');
          assert.equal(err.hostname, '2001:db8:2de::e13');
          assert.equal(err.ip, '2001:db8:2de::e13');
          assert(err.family === 6);
          return true;
        },
      );

      await assert.rejects(
        async () => {
          await httpclient.request('http://[2001:0DB8:02de:0000:0000:0000:0000:0e13]/foo/bar');
        },
        (err: any) => {
          // console.error(err);
          assert.equal(err.res.status, -1);
          assert.equal(err.name, 'IllegalAddressError');
          assert.equal(err.message, 'illegal address');
          assert.equal(err.hostname, '2001:db8:2de::e13');
          assert.equal(err.ip, '2001:db8:2de::e13');
          assert(err.family === 6);
          return true;
        },
      );
    });

    it('should throw error when follow redirect and redirect address illegal', async () => {
      const httpclient = new HttpClient({
        checkAddress() {
          // return address !== '127.0.0.1';
          return false;
        },
      });

      await assert.rejects(
        async () => {
          await httpclient.request(`${_url}redirect-to-localhost`);
        },
        (err: any) => {
          if (err.name !== 'IllegalAddressError') {
            console.error(err);
          }
          assert.equal(err.name, 'IllegalAddressError');
          assert.equal(err.message, 'illegal address');
          // assert.equal(err.ip, '127.0.0.1');
          // assert(err.family === 4);
          return true;
        },
      );
    });

    it('should allow hostname check', async () => {
      let hostname = '';
      const httpclient = new HttpClient({
        checkAddress(_ip, _family, aHostname) {
          hostname = aHostname;
          return true;
        },
        lookup(_hostname, _options, callback) {
          return callback(null, [
            {
              address: '127.0.0.1',
              family: 4,
            },
          ]);
        },
      });

      const response = await httpclient.request(_url.replace('localhost', 'check-host-ssrf.com'));
      assert.equal(hostname, 'check-host-ssrf.com');
      assert.equal(response.status, 200);
    });
  });
});
