import { strict as assert } from 'node:assert';
import dns from 'node:dns';
import { once } from 'node:events';
import { sensitiveHeaders, createSecureServer } from 'node:http2';
import { PerformanceObserver } from 'node:perf_hooks';
import { setTimeout as sleep } from 'node:timers/promises';
import { describe, it, beforeAll, afterAll } from 'vitest';
import selfsigned from 'selfsigned';
import { HttpClient, RawResponseWithMeta, getGlobalDispatcher } from '../src/index.js';
import { startServer } from './fixtures/server.js';

const pems = selfsigned.generate();

if (process.env.ENABLE_PERF) {
  const obs = new PerformanceObserver(items => {
    items.getEntries().forEach(item => {
      console.log('%j', item);
    });
  });
  obs.observe({
    entryTypes: [ 'net', 'dns', 'function', 'gc', 'http', 'http2', 'node' ],
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
      assert.equal(httpClient.getDispatcherPoolStats()['https://registry.npmmirror.com'].connected, 4);
      assert(httpClient.getDispatcherPoolStats()[_url.substring(0, _url.length - 1)].connected > 1);
    });

    it.skipIf(process.version.startsWith('v16.'))('should not exit after other side closed error', async () => {
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

      const url = `https://localhost:${server.address()!.port}`;
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

      const url = `https://localhost:${server.address()!.port}`;
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

  describe('clientOptions.defaultArgs', () => {
    it('should work with custom defaultArgs', async () => {
      const httpclient = new HttpClient({ defaultArgs: { timeout: 1000 } });
      assert(httpclient);
    });
  });

  describe('clientOptions.lookup', () => {
    it('should work with custom lookup on HTTP protol', async () => {
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

      await assert.rejects(async () => {
        await httpclient.request(_url);
      }, (err: any) => {
        // console.error(err);
        assert.equal(err.res.status, -1);
        assert.equal(err.name, 'IllegalAddressError');
        assert.equal(err.message, 'illegal address');
        assert.equal(err.hostname, 'localhost');
        assert.equal(typeof err.ip, 'string');
        assert(err.family === 4 || err.family === 6);
        return true;
      });

      const response = await httpclient.request(_url);
      assert.equal(response.status, 200);
      assert.equal(Object.keys(httpclient.getDispatcherPoolStats()).length, 1);
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

      await assert.rejects(async () => {
        await httpclient.request(_url);
      }, (err: any) => {
        // console.error(err);
        assert.equal(err.res.status, -1);
        assert.equal(err.name, 'IllegalAddressError');
        assert.equal(err.message, 'illegal address');
        assert.equal(err.hostname, 'localhost');
        assert.equal(typeof err.ip, 'string');
        assert(err.family === 4 || err.family === 6);
        return true;
      });
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

      await assert.rejects(async () => {
        await httpclient.request(_url.replace('localhost', '127.0.0.1'));
      }, (err: any) => {
        // console.error(err);
        assert.equal(err.res.status, -1);
        assert.equal(err.name, 'IllegalAddressError');
        assert.equal(err.message, 'illegal address');
        assert.equal(err.hostname, '127.0.0.1');
        assert.equal(err.ip, '127.0.0.1');
        assert(err.family === 4);
        return true;
      });

      const response = await httpclient.request(_url.replace('localhost', '127.0.0.1'));
      assert.equal(response.status, 200);
    });

    it('should throw error when request address is ip v6', async () => {
      const httpclient = new HttpClient({
        checkAddress(address, family) {
          return family !== 6;
        },
      });

      await assert.rejects(async () => {
        await httpclient.request('http://[::1]/foo/bar');
      }, (err: any) => {
        // console.error(err);
        assert.equal(err.name, 'IllegalAddressError');
        assert.equal(err.message, 'illegal address');
        assert.equal(err.hostname, '::1');
        assert.equal(err.ip, '::1');
        assert(err.family === 6);
        return true;
      });

      await assert.rejects(async () => {
        await httpclient.request('http://[2001:0DB8:02de::0e13]/foo/bar');
      }, (err: any) => {
        // console.error(err);
        assert.equal(err.res.status, -1);
        assert.equal(err.name, 'IllegalAddressError');
        assert.equal(err.message, 'illegal address');
        assert.equal(err.hostname, '2001:db8:2de::e13');
        assert.equal(err.ip, '2001:db8:2de::e13');
        assert(err.family === 6);
        return true;
      });

      await assert.rejects(async () => {
        await httpclient.request('http://[2001:0DB8:02de:0000:0000:0000:0000:0e13]/foo/bar');
      }, (err: any) => {
        // console.error(err);
        assert.equal(err.res.status, -1);
        assert.equal(err.name, 'IllegalAddressError');
        assert.equal(err.message, 'illegal address');
        assert.equal(err.hostname, '2001:db8:2de::e13');
        assert.equal(err.ip, '2001:db8:2de::e13');
        assert(err.family === 6);
        return true;
      });
    });

    it('should throw error when follow redirect and redirect address illegal', async () => {
      const httpclient = new HttpClient({
        checkAddress() {
          // return address !== '127.0.0.1';
          return false;
        },
      });

      await assert.rejects(async () => {
        await httpclient.request(`${_url}redirect-to-localhost`);
      }, (err: any) => {
        if (err.name !== 'IllegalAddressError') {
          console.error(err);
        }
        assert.equal(err.name, 'IllegalAddressError');
        assert.equal(err.message, 'illegal address');
        // assert.equal(err.ip, '127.0.0.1');
        // assert(err.family === 4);
        return true;
      });
    });

    it('should allow hostname check', async () => {
      let hostname = '';
      const httpclient = new HttpClient({
        checkAddress(_ip, _family, aHostname) {
          hostname = aHostname;
          return true;
        },
        lookup(_hostname, _options, callback) {
          if (process.version.startsWith('v18.') || process.version.startsWith('v16.')) {
            return callback(null, '127.0.0.1', 4);
          }
          return callback(null, [{
            address: '127.0.0.1',
            family: 4,
          }]);
        },
      });

      const response = await httpclient.request(_url.replace('localhost', 'check-host-ssrf.com'));
      assert.equal(hostname, 'check-host-ssrf.com');
      assert.equal(response.status, 200);
    });
  });
});
