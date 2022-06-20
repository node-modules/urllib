import assert from 'assert/strict';
import { ReadableStream } from 'stream/web';
import urllib from '../src';
import { startServer } from './fixtures/server';
import { readableToBytes } from './utils';

describe('options.dataType.test.ts', () => {
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

  it('should dataType is buffer', async () => {
    const response = await urllib.request(_url);
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/json');
    assert(response.headers.date);
    assert(Buffer.isBuffer(response.data));
    assert.match(response.data.toString(), /^{"method":"GET",/);
    assert.equal(response.url, _url);
    assert(!response.redirected);
  });

  it('should work with dataType = buffer', async () => {
    const response = await urllib.request(_url, {
      dataType: 'buffer',
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/json');
    assert(response.headers.date);
    assert(Buffer.isBuffer(response.data));
    assert.match(response.data.toString(), /^{"method":"GET",/);
    assert.equal(response.url, _url);
    assert(!response.redirected);
  });

  it('should work with dataType = text', async () => {
    const response = await urllib.request(_url, {
      dataType: 'text',
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/json');
    assert(response.headers.date);
    assert.equal(typeof response.data, 'string');
    assert.match(response.data, /^{"method":"GET",/);
    assert.equal(response.url, _url);
    assert(!response.redirected);
  });

  it('should work with dataType = json', async () => {
    const response = await urllib.request(_url, {
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/json');
    assert.equal(typeof response.data, 'object');
    assert.equal(response.data.method, 'GET');
  });

  it('should keep exists accept headers when dataType = json', async () => {
    const response = await urllib.request(_url, {
      dataType: 'json',
      headers: {
        accept: 'foo/json',
      },
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/json');
    // console.log(response.data);
    assert.equal(response.data.headers.accept, 'foo/json');
  });

  it('should throw with dataType = json when response json format invaild', async () => {
    await assert.rejects(async () => {
      await urllib.request(`${_url}wrongjson`, {
        dataType: 'json',
      });
    }, (err: any) => {
      // console.error(err);
      assert.equal(err.name, 'JSONResponseFormatError');
      assert.equal(err.message, 'Unexpected end of JSON input (data json format: "{\\"foo\\":\\"\\"")');
      assert.equal(err.res.status, 200);
      assert.equal(err.res.headers['content-type'], 'application/json');
      assert.equal(err.res.size, 9);
      return true;
    });
  });

  it('should work with dataType = text when response json format invaild', async () => {
    const response = await urllib.request(`${_url}wrongjson`, {
      dataType: 'text',
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/json');
    assert.equal(response.data, '{"foo":""');
  });

  it('should handle GET /wrongjson-gbk with dataType=json and data size > 1024', async () => {
    await assert.rejects(async () => {
      await urllib.request(`${_url}wrongjson-gbk`, {
        dataType: 'json',
      });
    }, (err: any) => {
      // console.error(err);
      assert.equal(err.name, 'JSONResponseFormatError');
      assert.match(err.message, /\" \.\.\.skip\.\.\. \"/);
      assert.equal(err.res.status, 200);
      assert.equal(err.res.headers['content-type'], 'application/json');
      return true;
    });
  });

  it('should work with dataType = stream', async () => {
    const response = await urllib.request(_url, {
      dataType: 'stream',
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/json');
    assert(response.res);
    const bytes = await readableToBytes(response.res as ReadableStream);
    const jsonString = bytes.toString();
    assert.equal(JSON.parse(jsonString).method, 'GET');
  });

  it('should work with streaming = true, alias to data = stream', async () => {
    const response = await urllib.request(_url, {
      streaming: true,
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/json');
    assert(response.res);
    assert(response.res);
    const bytes = await readableToBytes(response.res as ReadableStream);
    const jsonString = bytes.toString();
    assert.equal(JSON.parse(jsonString).method, 'GET');
  });
});
