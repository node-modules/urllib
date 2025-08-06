import { strict as assert } from 'node:assert';
import { createSecureServer } from 'node:http2';
import { once } from 'node:events';
import selfsigned from 'selfsigned';
import { describe, it, beforeAll, afterAll } from 'vitest';
import urllib, { HttpClientRequestTimeoutError, HttpClient } from '../src/index.js';
import { startServer } from './fixtures/server.js';
import { nodeMajorVersion } from './utils.js';

const pems = selfsigned.generate([], {
  keySize: nodeMajorVersion() >= 22 ? 2048 : 1024,
});

describe('options.timeout.test.ts', () => {
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

  it('should HeadersTimeout 1000ms throw error', async () => {
    await assert.rejects(async () => {
      await urllib.request(`${_url}?timeout=2000`, {
        timeout: 10,
      });
    }, (err: any) => {
      // console.error(err);
      assert.equal(err.name, 'HttpClientRequestTimeoutError');
      assert.equal(err.message, 'Request timeout for 10 ms');
      assert.equal(err.cause.name, 'HeadersTimeoutError');
      assert.equal(err.cause.message, 'Headers Timeout Error');
      assert.equal(err.cause.code, 'UND_ERR_HEADERS_TIMEOUT');

      assert.equal(err.res.status, -1);
      assert(err.res.rt > 10, `actual ${err.res.rt}`);
      assert.equal(typeof err.res.rt, 'number');
      return true;
    });
  });

  it('should timeout support string format', async () => {
    await assert.rejects(async () => {
      await urllib.request(`${_url}?timeout=2000`, {
        // @ts-expect-error check string format
        timeout: '10',
      });
    }, (err: any) => {
      // console.error(err);
      assert.equal(err.name, 'HttpClientRequestTimeoutError');
      assert.equal(err.message, 'Request timeout for 10 ms');
      assert.equal(err.cause.name, 'HeadersTimeoutError');
      assert.equal(err.cause.message, 'Headers Timeout Error');
      assert.equal(err.cause.code, 'UND_ERR_HEADERS_TIMEOUT');

      assert.equal(err.res.status, -1);
      assert(err.res.rt > 10, `actual ${err.res.rt}`);
      assert.equal(typeof err.res.rt, 'number');
      return true;
    });
  });

  it('should timeout on h2', async () => {
    const httpClient = new HttpClient({
      allowH2: true,
      connect: {
        rejectUnauthorized: false,
      },
    });

    const server = createSecureServer({
      key: pems.private,
      cert: pems.cert,
    });

    server.on('stream', () => {
      // wait for timeout
    });

    server.listen(0);
    await once(server, 'listening');

    const url = `https://localhost:${server.address()!.port}`;
    await assert.rejects(async () => {
      await httpClient.request(url, {
        timeout: 10,
      });
    }, (err: any) => {
      // console.error(err);
      assert.equal(err.name, 'HttpClientRequestTimeoutError');
      assert.equal(err.message, 'Request timeout for 10 ms');
      assert.equal(err.cause.name, 'InformationalError');
      assert.equal(err.cause.message, 'HTTP/2: "stream timeout after 10"');
      assert.equal(err.cause.code, 'UND_ERR_INFO');

      assert.equal(err.res.status, -1);
      assert(err.res.rt > 10, `actual ${err.res.rt}`);
      assert.equal(typeof err.res.rt, 'number');
      return true;
    });
  });

  it('should BodyTimeout throw error', async () => {
    await assert.rejects(async () => {
      await urllib.request(`${_url}mock-bytes?timeout=2000`, {
        timeout: 100,
      });
    }, (err: any) => {
      // console.error(err);
      assert.equal(err.name, 'HttpClientRequestTimeoutError');
      assert.equal(err.message, 'Request timeout for 100 ms');
      if (err.cause) {
        assert.equal(err.cause.name, 'BodyTimeoutError');
        assert.equal(err.cause.message, 'Body Timeout Error');
        assert.equal(err.cause.code, 'UND_ERR_BODY_TIMEOUT');
      }
      assert.equal(err.res.status, 200);
      return true;
    });
  });

  it('should timeout 500ms throw error', async () => {
    await assert.rejects(async () => {
      const response = await urllib.request(`${_url}mock-bytes?timeout=1500`, {
        timeout: [ 400, 500 ],
      });
      console.log(response.status, response.headers, response.data);
    }, (err: any) => {
      // console.log(err);
      assert.equal(err.name, 'HttpClientRequestTimeoutError');
      assert.equal(err.message, 'Request timeout for 500 ms');
      assert.equal(err.res.status, 200);
      err.cause && assert.equal(err.cause.name, 'BodyTimeoutError');
      return true;
    });
  });

  it('should timeout on server block', async () => {
    await assert.rejects(async () => {
      await urllib.request(`${_url}block`, {
        timeout: 100,
      });
    }, (err: HttpClientRequestTimeoutError) => {
      // console.log(err);
      assert.equal(err.name, 'HttpClientRequestTimeoutError');
      assert.equal(err.message, 'Request timeout for 100 ms');
      assert.equal(err.res!.status, -1);
      assert(err.headers);
      assert.equal(err.status, -1);
      err.cause && assert.equal(err.cause.name, 'HeadersTimeoutError');
      return true;
    });
  });
});
