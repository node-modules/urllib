import { strict as assert } from 'assert';
import urllib from '../src';
import { startServer } from './fixtures/server';

describe('options.digestAuth.test.ts', () => {
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

  it('should auth pass', async () => {
    const response = await urllib.request(`${_url}digestAuth`, {
      digestAuth: 'user:pwd',
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    assert(response.data.authorization);
    // console.log(response.data);
    assert.match(response.data.authorization, /Digest username="user", realm="testrealm@urllib.com", nonce="/);
  });

  it('should auth fail', async () => {
    const response = await urllib.request(`${_url}digestAuth`, {
      digestAuth: 'invailduser:pwd',
      dataType: 'json',
    });
    assert.equal(response.status, 401);
    assert.deepEqual(response.data, {
      error: 'authorization invaild',
    });
  });

  it('should digest auth required', async () => {
    const response = await urllib.request(`${_url}digestAuth?t=123123`, {
      dataType: 'json',
    });
    assert.equal(response.status, 401);
    assert.deepEqual(response.data, {
      error: 'authorization required',
    });
  });

  it.skip('should request with digest auth success in webdav', async () => {
    var url = 'http://test.webdav.org/auth-digest/user3';
    const response = await urllib.request(url, {
      digestAuth: 'user3:user3',
      timeout: 20000,
      dataType: 'text',
    });
    assert.equal(response.status, 404);
    assert.match(response.data, /<p>The requested URL \/auth-digest\/user3 was not found on this server.<\/p>/);
  });

  it.skip('should request with digest auth fail in webdav', async () => {
    var url = 'http://test.webdav.org/auth-digest/user4';
    const response = await urllib.request(url, {
      digestAuth: 'user3:fail',
      timeout: 20000,
      dataType: 'text',
    });
    assert.equal(response.status, 401);
    assert(response.headers['www-authenticate']);
    assert.match(response.data, /401 Authorization Required/);
  });

  it.skip('should request with digest auth success in httpbin', async () => {
    var url = 'http://httpbin.org/digest-auth/auth/user/passwd';
    const response = await urllib.request(url, {
      digestAuth: 'user:passwd',
      dataType: 'json',
      timeout: 10000,
    });
    assert.equal(response.status, 200);
    assert.deepEqual(response.data, {
      user: "user",
      authenticated: true,
    });
  });

  it.skip('should request with digest auth fail in httpbin', async () => {
    var url = 'http://httpbin.org/digest-auth/auth/user/passwd';
    const response = await urllib.request(url, {
      digestAuth: 'user:passwdfail',
      dataType: 'json',
      timeout: 10000,
    });
    assert.equal(response.status, 401);
    assert.equal(response.data, null);
  });
});
