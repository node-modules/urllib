import { describe, it, beforeAll, afterAll } from 'vitest';
import { strict as assert } from 'assert';
import urllib from '../src';
import { startServer } from './fixtures/server';

describe('keep-alive-header.test.ts', () => {
  const keepAliveTimeout = 1000;
  let close: any;
  let _url: string;
  beforeAll(async () => {
    const { closeServer, url } = await startServer({ keepAliveTimeout });
    close = closeServer;
    _url = url;
  });

  afterAll(async () => {
    await close();
  });

  it('should return default user agent', async () => {
    const response = await urllib.request(_url, {
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    // console.log(response.data.headers);
    assert.match(response.data.headers['user-agent'], /^node\-urllib\/3\.\d+\.\d+ Node\.js\/\d+\.\d+\.\d+ \(/);
  });

  it('should return no user agent if user-agent header is set to empty string',  async () => {
    const response = await urllib.request(_url, {
      dataType: 'json',
      headers: {'user-agent': ''},
    });
    assert.equal(response.status, 200);
    // console.log(response.data.headers);
    assert.equal(response.data.headers['user-agent'], undefined);
  });

  it('should return no user agent if user-agent header is set undefined',  async () => {
    const response = await urllib.request(_url, {
      dataType: 'json',
      headers: {'user-agent': undefined},
    });
    assert.equal(response.status, 200);
    // console.log(response.data.headers);
    assert.equal(response.data.headers['user-agent'], undefined);
  });

  it('should return mock user agent',  async () => {
    const response = await urllib.request(_url, {
      dataType: 'json',
      headers: {'user-agent': 'mock agent'},
    });
    assert.equal(response.status, 200);
    // console.log(response.data.headers);
    assert.equal(response.data.headers['user-agent'], 'mock agent');
  });
});
