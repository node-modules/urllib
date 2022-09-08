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
    assert.match(response.data.authorization, /, uri="\/digestAuth",/);
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

  it('should digest auth with query', async () => {
    const response = await urllib.request(`${_url}digestAuth?t=123123`, {
      digestAuth: 'user:pwd',
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    assert(response.data.authorization);
    assert.match(response.data.authorization, /, uri="\/digestAuth\?t=123123",/);
  });

  it.skip('should request with digest auth success in httpbin', async () => {
    var url = 'https://httpbin.org/digest-auth/auth/user/passwd';
    const response = await urllib.request(url, {
      digestAuth: 'user:passwd',
      dataType: 'json',
      timeout: 10000,
    });
    console.log(response.headers);
    assert.equal(response.status, 200);
    assert.deepEqual(response.data, {
      user: 'user',
      authenticated: true,
    });
  });

  it.skip('should request with digest auth fail in httpbin', async () => {
    var url = 'https://httpbin.org/digest-auth/auth/user/passwd';
    const response = await urllib.request(url, {
      digestAuth: 'user:passwdfail',
      dataType: 'json',
      timeout: 10000,
    });
    // console.log(response.headers);
    assert(response.headers['www-authenticate']);
    assert.equal(response.status, 401);
    assert.equal(response.data, null);
  });
});
