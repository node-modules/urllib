import { strict as assert } from 'assert';
import { createReadStream } from 'fs';
import { Readable } from 'stream';
import urllib from '../src';
import { startServer } from './fixtures/server';

describe('options.data.test.ts', () => {
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

  it('should default GET with data and auto convert to query string', async () => {
    const response = await urllib.request(_url, {
      data: {
        sql: 'SELECT * from table',
        data: '哈哈',
      },
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/json');
    assert.equal(response.data.method, 'GET');
    assert(response.url.startsWith(_url));
    assert(!response.redirected);
    // console.log(response.headers);
    assert.equal(response.data.url, '/?sql=SELECT+*+from+table&data=%E5%93%88%E5%93%88');
    const url = new URL(response.data.href);
    assert.equal(url.searchParams.get('sql'), 'SELECT * from table');
    assert.equal(url.searchParams.get('data'), '哈哈');
  });

  it('should HEAD with data and auto convert to query string', async () => {
    const response = await urllib.request(_url, {
      method: 'HEAD',
      data: {
        sql: 'SELECT * from table',
        data: '哈哈',
      },
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/json');
    assert.equal(response.headers['x-method'], 'HEAD');
    assert(response.url.startsWith(_url));
    assert(!response.redirected);
    const url = new URL(response.headers['x-href'] as string);
    assert.equal(url.searchParams.get('sql'), 'SELECT * from table');
    assert.equal(url.searchParams.get('data'), '哈哈');
  });

  it('should concat query string and data correctly when GET', async () => {
    const requestUrl = new URL(_url);
    requestUrl.searchParams.set('that', 'in_path');
    const response = await urllib.request(requestUrl, {
      method: 'GET',
      data: {
        sql: 'SELECT * from table',
        data: '哈哈',
      },
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/json');
    assert.equal(response.data.method, 'GET');
    assert(response.url.startsWith(_url));
    assert(!response.redirected);
    // console.log(response.data);
    assert.equal(response.data.url, '/?that=in_path&sql=SELECT+*+from+table&data=%E5%93%88%E5%93%88');
    const url = new URL(response.data.href);
    assert.equal(url.searchParams.get('sql'), 'SELECT * from table');
    assert.equal(url.searchParams.get('data'), '哈哈');
    assert.equal(url.searchParams.get('that'), 'in_path');
  });

  it('should ignore data = buffer on GET request', async () => {
    const requestUrl = new URL(_url);
    requestUrl.searchParams.set('that', 'in_path');
    const response = await urllib.request(requestUrl, {
      method: 'GET',
      data: Buffer.from(JSON.stringify({
        sql: 'SELECT * from table',
        data: '哈哈',
      })),
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/json');
    assert.equal(response.data.method, 'GET');
    assert(response.url.startsWith(_url));
    assert(!response.redirected);
    // console.log(response.data);
    assert.equal(response.data.url, '/?that=in_path');
  });

  it('should ignore data = string on GET request', async () => {
    const requestUrl = new URL(_url);
    requestUrl.searchParams.set('that', 'in_path');
    const response = await urllib.request(requestUrl, {
      method: 'GET',
      data: JSON.stringify({
        sql: 'SELECT * from table',
        data: '哈哈',
      }),
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/json');
    assert.equal(response.data.method, 'GET');
    assert(response.url.startsWith(_url));
    assert(!response.redirected);
    // console.log(response.data);
    assert.equal(response.data.url, '/?that=in_path');
  });

  it('should ignore data = readable on GET request', async () => {
    const requestUrl = new URL(_url);
    requestUrl.searchParams.set('that', 'in_path');
    const response = await urllib.request(requestUrl, {
      method: 'GET',
      data: createReadStream(__filename),
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/json');
    assert.equal(response.data.method, 'GET');
    assert(response.url.startsWith(_url));
    assert(!response.redirected);
    // console.log(response.data);
    assert.equal(response.data.url, '/?that=in_path');
  });

  it('should POST with data and auto using application/x-www-form-urlencoded', async () => {
    const response = await urllib.request(_url, {
      method: 'POST',
      data: {
        sql: 'SELECT * from table',
        data: '哈哈',
      },
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/json');
    assert.equal(response.data.method, 'POST');
    assert(response.url.startsWith(_url));
    assert(!response.redirected);
    // console.log(response.data);
    assert.equal(response.data.url, '/');
    assert.equal(response.data.headers['content-type'], 'application/x-www-form-urlencoded;charset=UTF-8');
    assert.equal(response.data.requestBody.sql, 'SELECT * from table');
    assert.equal(response.data.requestBody.data, '哈哈');
  });

  it('should PUT with data and auto using application/x-www-form-urlencoded', async () => {
    const response = await urllib.request(_url, {
      method: 'PUT',
      data: {
        sql: 'SELECT * from table',
        data: '哈哈 PUT',
      },
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/json');
    assert.equal(response.data.method, 'PUT');
    assert(response.url.startsWith(_url));
    assert(!response.redirected);
    // console.log(response.data);
    assert.equal(response.data.url, '/');
    assert.equal(response.data.headers['content-type'], 'application/x-www-form-urlencoded;charset=UTF-8');
    assert.equal(response.data.requestBody.sql, 'SELECT * from table');
    assert.equal(response.data.requestBody.data, '哈哈 PUT');
  });

  it('should PATCH with data and auto using application/x-www-form-urlencoded', async () => {
    const response = await urllib.request(_url, {
      method: 'PATCH',
      data: {
        sql: 'SELECT * from table',
        data: '哈哈 PATCH',
      },
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/json');
    assert.equal(response.data.method, 'PATCH');
    assert(response.url.startsWith(_url));
    assert(!response.redirected);
    // console.log(response.data);
    assert.equal(response.data.url, '/');
    assert.equal(response.data.headers['content-type'], 'application/x-www-form-urlencoded;charset=UTF-8');
    assert.equal(response.data.requestBody.sql, 'SELECT * from table');
    assert.equal(response.data.requestBody.data, '哈哈 PATCH');
  });

  it('should POST with application/x-www-form-urlencoded not support nested object', async () => {
    const response = await urllib.request(_url, {
      method: 'POST',
      data: {
        sql: 'SELECT * from table',
        data: '哈哈 POST',
        foo: { bar: 'foo' },
      },
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/json');
    assert.equal(response.data.method, 'POST');
    assert(response.url.startsWith(_url));
    assert(!response.redirected);
    // console.log(response.data);
    assert.equal(response.data.url, '/');
    assert.equal(response.data.headers['content-type'], 'application/x-www-form-urlencoded;charset=UTF-8');
    assert.equal(response.data.requestBody.sql, 'SELECT * from table');
    assert.equal(response.data.requestBody.data, '哈哈 POST');
    assert.equal(response.data.requestBody.foo, '[object Object]');
  });

  it('should PUT with data and contentType = json', async () => {
    const response = await urllib.request(_url, {
      method: 'PUT',
      data: {
        sql: 'SELECT * from table',
        data: '哈哈 PUT',
        foo: { bar: 'bar value' },
      },
      contentType: 'json',
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/json');
    assert.equal(response.data.method, 'PUT');
    assert(response.url.startsWith(_url));
    assert(!response.redirected);
    // console.log(response.data);
    assert.equal(response.data.url, '/');
    assert.equal(response.data.headers['content-type'], 'application/json');
    assert.equal(response.data.headers['content-length'], '75');
    assert.equal(response.data.requestBody.sql, 'SELECT * from table');
    assert.equal(response.data.requestBody.data, '哈哈 PUT');
    assert.equal(response.data.requestBody.foo.bar, 'bar value');
  });

  it('should PUT with data and contentType = application/json', async () => {
    const response = await urllib.request(_url, {
      method: 'PUT',
      data: {
        sql: 'SELECT * from table',
        data: '哈哈 PUT',
      },
      contentType: 'application/json',
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/json');
    assert.equal(response.data.method, 'PUT');
    assert(response.url.startsWith(_url));
    assert(!response.redirected);
    // console.log(response.data);
    assert.equal(response.data.url, '/');
    assert.equal(response.data.headers['content-type'], 'application/json');
    assert.equal(response.data.headers['content-length'], '49');
    assert.equal(response.data.requestBody.sql, 'SELECT * from table');
    assert.equal(response.data.requestBody.data, '哈哈 PUT');
  });

  it('should auto convert data to json string with charset', async () => {
    const now = new Date();
    const response = await urllib.request(_url, {
      method: 'post',
      data: {
        foo: 'bar',
        n1: 1,
        now,
      },
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    assert.equal(response.data.method, 'POST');
    assert.equal(response.data.requestBody.foo, 'bar');
    assert.equal(response.data.requestBody.n1, 1);
    assert.equal(response.data.requestBody.now, now.toISOString());
    assert.equal(response.data.headers['content-type'], 'application/json; charset=utf-8');
  });

  it('should auto convert data to json string with content-type=application/json', async () => {
    const now = new Date();
    const response = await urllib.request(_url, {
      method: 'post',
      data: {
        foo: 'bar',
        n1: 1,
        now,
      },
      headers: { 'content-type': 'application/json' },
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    assert.equal(response.data.method, 'POST');
    assert.equal(response.data.requestBody.foo, 'bar');
    assert.equal(response.data.requestBody.n1, 1);
    assert.equal(response.data.requestBody.now, now.toISOString());
    assert.equal(response.data.headers['content-type'], 'application/json');
  });

  it('should keep data to string when content-type exists', async () => {
    const now = new Date();
    const response = await urllib.request(_url, {
      method: 'put',
      data: JSON.stringify({
        foo: 'bar',
        n1: 1,
        now,
      }),
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    assert.equal(response.data.method, 'PUT');
    assert.equal(response.data.requestBody.foo, 'bar');
    assert.equal(response.data.requestBody.n1, 1);
    assert.equal(response.data.requestBody.now, now.toISOString());
    assert.equal(response.data.headers['content-type'], 'application/json; charset=utf-8');
  });

  it('should keep data to buffer when content-type exists', async () => {
    const now = new Date();
    const response = await urllib.request(_url, {
      method: 'put',
      data: Buffer.from(JSON.stringify({
        foo: 'bar',
        n1: 1,
        now,
      })),
      headers: { 'Content-Type': 'application/json; charset=gbk' },
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    assert.equal(response.data.method, 'PUT');
    assert.equal(response.data.requestBody.foo, 'bar');
    assert.equal(response.data.requestBody.n1, 1);
    assert.equal(response.data.requestBody.now, now.toISOString());
    assert.equal(response.data.headers['content-type'], 'application/json; charset=gbk');
  });

  it('should keep data to readable when content-type exists', async () => {
    const now = new Date();
    const buf = Buffer.from(JSON.stringify({
      foo: 'bar',
      n1: 1,
      now,
    }));
    const readable = Readable.from([ buf ]);
    const response = await urllib.request(_url, {
      method: 'put',
      data: readable,
      headers: { 'Content-Type': 'application/json; charset=gbk' },
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    // console.log(response.data);
    assert.equal(response.data.method, 'PUT');
    assert.equal(response.data.requestBody.foo, 'bar');
    assert.equal(response.data.requestBody.n1, 1);
    assert.equal(response.data.requestBody.now, now.toISOString());
    assert.equal(response.data.headers['content-type'], 'application/json; charset=gbk');
    assert.equal(response.data.headers['transfer-encoding'], 'chunked');
  });

  it('should keep data to readable and not set content-type', async () => {
    const now = new Date();
    const buf = Buffer.from(JSON.stringify({
      foo: 'bar',
      n1: 1,
      now,
    }));
    const readable = Readable.from([ buf ]);
    const response = await urllib.request(_url, {
      method: 'put',
      data: readable,
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    // console.log(response.data);
    assert.equal(response.data.method, 'PUT');
    const requestBody = JSON.parse(response.data.requestBody);
    assert.equal(requestBody.foo, 'bar');
    assert.equal(requestBody.n1, 1);
    assert.equal(requestBody.now, now.toISOString());
    assert(!response.data.headers['content-type']);
    assert.equal(response.data.headers['transfer-encoding'], 'chunked');
  });
});
